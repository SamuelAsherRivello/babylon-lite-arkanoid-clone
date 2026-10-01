import { useEffect, useRef, useState } from 'react';
import {
  addSprite2D, centerSprite2DView, createEngine, createGridSpriteAtlas, createRenderTexture2D,
  createSprite2DLayer, createSpriteRenderer, disposeEngine, disposeSpriteAtlas, disposeSpriteRenderer,
  loadTexture2D, registerSpriteRenderer, releaseTexture, setSpriteRendererTarget, startEngine, stopEngine, updateSprite2D,
} from '@babylonjs/lite';
import { useViewportInfo } from '../ui/ViewportInfoContext.jsx';
import { useGameSession } from '../game/GameSession.jsx';
import { movePaddleInput, toPaddleInput } from '../game/controls.js';
import {
  advancePaddleTowardTarget, paddleTargetX,
  REMOTE_PADDLE_INTERPOLATION_MS, samplePaddlePositions,
} from '../game/presentation.js';
import { getInitializationMessage } from './babylon/initialization.js';
import { getLogicalToRenderScale } from './babylon/pixel-perfect.js';
import { createRenderTargetSurfaceView, getRenderResolutionDimensions } from './babylon/render-resolution.js';
import { contentConfig, getRenderingPolicy, logicalResolution, pixelPerfectOptions } from './babylon/config.js';
import spritesUrl from './babylon/images/neon-brick-atlas.png?url';
import spaceUrl from '../../documentation/neon-space-background.png?url';

const transparent = Object.freeze({r:0,g:0,b:0,a:0});
const spriteSize = Object.freeze({cellWidthPx:16,cellHeightPx:16,columns:8,rows:1,pivot:[0.5,0.5]});

function PixelPerfectGame(){
  const {setScale,renderPreset,setRenderResolutionInfo,sceneBorderVisible,processingPaused}=useViewportInfo();
  const {state,seat,send,paused,setPaused,retry,snapshotHistory}=useGameSession();
  const hostRef=useRef(null),canvasRef=useRef(null),spriteStateRef=useRef(null),paintRef=useRef(null),resizeRef=useRef(()=>{}),engineRef=useRef(null),engineRunningRef=useRef(false),inputRef=useRef({x:.5,left:false,right:false}),localPaddleRef=useRef({seat:-1,x:null}),lastInputAtRef=useRef(0),lastPaintAtRef=useRef(0),renderPresetRef=useRef(renderPreset);
  renderPresetRef.current=renderPreset;
  const snapshotAtRef=useRef(0);
  const [message,setMessage]=useState('Starting Babylon Lite…');
  const game=state.gameState;
  useEffect(()=>{
    if(!game){spriteStateRef.current=null;localPaddleRef.current={seat:-1,x:null};return;}
    const receivedAt=performance.now();spriteStateRef.current=game;snapshotAtRef.current=receivedAt;
    const authoritative=game.paddles?.[seat];
    if(authoritative){
      if(localPaddleRef.current.seat!==seat||localPaddleRef.current.x===null)localPaddleRef.current={seat,x:authoritative.x};
      else if(receivedAt-lastInputAtRef.current>180)localPaddleRef.current.x+=Math.max(-2,Math.min(2,(authoritative.x-localPaddleRef.current.x)*.08));
    }
  },[game,seat]);

  useEffect(()=>{
    const host=hostRef.current,canvas=canvasRef.current;
    let cancelled=false,disposed=false,engine=null,texture=null,atlas=null,layer=null,renderer=null,renderSurface=null;
    let renderTexture=null,presentationAtlas=null,presentationRenderer=null,presentationSprite=null,resizeObserver=null,dprQuery=null;
    const sprites={bricks:[],balls:[],paddles:[],drops:[]};
    const paint=()=>{
      const g=spriteStateRef.current;if(!g||!sprites.bricks.length)return;
      const now=performance.now(),elapsed=lastPaintAtRef.current?Math.min(.05,Math.max(0,(now-lastPaintAtRef.current)/1000)):0;lastPaintAtRef.current=now;
      const direction=Number(inputRef.current.right)-Number(inputRef.current.left);
      if(direction){inputRef.current.x=movePaddleInput(inputRef.current.x,direction,.9*elapsed);lastInputAtRef.current=now;}
      const remotePaddles=samplePaddlePositions(snapshotHistory,now-REMOTE_PADDLE_INTERPOLATION_MS);
      const put=(sprite,x,y,w,h,frame)=>updateSprite2D(sprite,{positionPx:[x,y],sizePx:[w,h],frame});
      sprites.bricks.forEach((sprite,i)=>{const b=g.bricks[i];put(sprite,b?b.x+b.w/2:-40,b?b.y+b.h/2:-40,b?.w??2,b?.h??2,b?.kind==='reinforced'?1:0);});
      sprites.paddles.forEach((sprite,i)=>{
        const p=g.paddles[i];let x=p?.x??(i?240:80);
        if(p&&i===seat){
          const prediction=localPaddleRef.current;
          if(prediction.seat!==seat||prediction.x===null)localPaddleRef.current={seat,x};
          const local=localPaddleRef.current;local.x=advancePaddleTowardTarget(local.x,paddleTargetX(inputRef.current.x,p?.width??38),elapsed);x=local.x;
        }else x=remotePaddles.find((remote)=>remote.seat===i)?.x??x;
        put(sprite,x,p?.y??(i===0?490:440),p?.width??38,8,i?4:3);
      });
      sprites.balls.forEach((sprite,i)=>{const b=g.balls[i];put(sprite,b?b.x+b.vx*elapsed:-40,b?b.y+b.vy*elapsed:-40,8,8,2);});
      sprites.drops.forEach((sprite,i)=>{const d=g.drops[i];put(sprite,d?.x??-40,d?.y??-40,14,14,d?.type==='wide'?5:6);});
    };
    const disposeResources=()=>{
      disposed=true;resizeObserver?.disconnect();dprQuery?.removeEventListener('change',onDprChange);window.removeEventListener('resize',resize);
      if(engine&&engineRunningRef.current)stopEngine(engine);engineRunningRef.current=false;
      if(renderer)setSpriteRendererTarget(renderer,null);
      if(presentationRenderer){disposeSpriteRenderer(presentationRenderer);presentationRenderer=null;}
      if(renderer){disposeSpriteRenderer(renderer);renderer=null;}
      if(presentationAtlas){disposeSpriteAtlas(presentationAtlas);presentationAtlas=null;}
      if(atlas){disposeSpriteAtlas(atlas);atlas=null;}
      if(renderTexture){releaseTexture(renderTexture);renderTexture=null;}
      if(texture){releaseTexture(texture);texture=null;}
      if(engine){disposeEngine(engine);engine=null;}
      engineRef.current=null;paintRef.current=null;
    };
    const failInitialization=(error)=>{
      if(disposed)return;
      console.error('Neon Breaker initialization failed:',error);
      disposeResources();
      if(!cancelled)setMessage(getInitializationMessage(Boolean(navigator.gpu),error));
    };
    const observeDpr=()=>{dprQuery=window.matchMedia(`(resolution: ${window.devicePixelRatio||1}dppx)`);dprQuery.addEventListener('change',onDprChange,{once:true});};
    const resize=()=>{
      if(!engine||!renderer||!renderSurface||!layer||!host||disposed)return false;
      const dpr=window.devicePixelRatio||1,nativeWidth=Math.max(1,Math.floor(host.clientWidth*dpr)),nativeHeight=Math.max(1,Math.floor(host.clientHeight*dpr));
      try{
        const resolved=getRenderResolutionDimensions(nativeWidth,nativeHeight,renderPresetRef.current,engine._device.limits.maxTextureDimension2D);
        renderSurface.canvas.width=resolved.width;renderSurface.canvas.height=resolved.height;
        const same=renderTexture&&renderTexture.width===resolved.width&&renderTexture.height===resolved.height;
        if(!same){
          setSpriteRendererTarget(renderer,null);
          if(presentationRenderer){disposeSpriteRenderer(presentationRenderer);presentationRenderer=null;}
          if(presentationAtlas){disposeSpriteAtlas(presentationAtlas);presentationAtlas=null;}
          if(renderTexture){releaseTexture(renderTexture);renderTexture=null;}
          presentationRenderer=null;presentationAtlas=null;presentationSprite=null;
          renderTexture=createRenderTexture2D(engine,resolved.width,resolved.height,{addressModeU:'clamp-to-edge',addressModeV:'clamp-to-edge',minFilter:'nearest',magFilter:'nearest'});
          setSpriteRendererTarget(renderer,renderTexture);
          presentationAtlas=createGridSpriteAtlas(renderTexture,{cellWidthPx:resolved.width,cellHeightPx:resolved.height,columns:1,rows:1,pivot:[.5,.5]});
          const presentationLayer=createSprite2DLayer(presentationAtlas,{pivot:[.5,.5]});
          presentationSprite=addSprite2D(presentationLayer,{positionPx:[nativeWidth/2,nativeHeight/2],sizePx:[nativeWidth,nativeHeight],frame:0});
          presentationRenderer=createSpriteRenderer(engine,{layers:[presentationLayer],clear:true,clearValue:transparent});
          registerSpriteRenderer(presentationRenderer);
        }else if(presentationSprite)updateSprite2D(presentationSprite,{positionPx:[nativeWidth/2,nativeHeight/2],sizePx:[nativeWidth,nativeHeight]});
        layer.view.zoom=getLogicalToRenderScale(resolved.width,resolved.height,logicalResolution);
        centerSprite2DView(layer.view,logicalResolution.width/2,logicalResolution.height/2,resolved.width,resolved.height);
        setScale(resolved.scale);setRenderResolutionInfo({...resolved,nativeWidth,nativeHeight});
        return true;
      }catch(error){failInitialization(error);return false;}
    };
    resizeRef.current=resize;
    function onDprChange(){resize();dprQuery?.removeEventListener('change',onDprChange);observeDpr();}
    const setup=async()=>{
      try{
        if(!navigator.gpu)throw new Error('WebGPU is not available in this browser.');
        engine=await createEngine(canvas,pixelPerfectOptions.engine);engineRef.current=engine;if(cancelled){disposeResources();return;}
        texture=await loadTexture2D(engine,spritesUrl,pixelPerfectOptions.texture);if(cancelled){disposeResources();return;}
        atlas=createGridSpriteAtlas(texture,spriteSize);layer=createSprite2DLayer(atlas,{pivot:[.5,.5]});
        for(let i=0;i<100;i++)sprites.bricks.push(addSprite2D(layer,{positionPx:[-40,-40],sizePx:[2,2],frame:0}));
        for(let i=0;i<2;i++)sprites.paddles.push(addSprite2D(layer,{positionPx:[160,i===0?490:440],sizePx:[38,8],frame:i?4:3}));
        for(let i=0;i<3;i++)sprites.balls.push(addSprite2D(layer,{positionPx:[-40,-40],sizePx:[8,8],frame:2}));
        for(let i=0;i<12;i++)sprites.drops.push(addSprite2D(layer,{positionPx:[-40,-40],sizePx:[14,14],frame:5}));
        renderSurface=createRenderTargetSurfaceView(engine,320,576);
        renderer=createSpriteRenderer(renderSurface,{layers:[layer],clear:true,clearValue:transparent});setSpriteRendererTarget(renderer,null);registerSpriteRenderer(renderer);
        if(!resize())return;engineRunningRef.current=true;await startEngine(engine);if(cancelled||disposed){disposeResources();return;}
        paintRef.current=paint;paint();resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);window.addEventListener('resize',resize);observeDpr();setMessage('');
      }catch(error){failInitialization(error);}
    };
    void setup();
    return()=>{cancelled=true;disposeResources();};
  },[setScale,setRenderResolutionInfo]);

  useEffect(()=>{resizeRef.current();},[renderPreset]);

  useEffect(()=>{let frame=0;const draw=()=>{paintRef.current?.();frame=requestAnimationFrame(draw);};frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);},[]);
  useEffect(()=>{const e=engineRef.current;if(!e)return;if(processingPaused&&engineRunningRef.current){stopEngine(e);engineRunningRef.current=false;}else if(!processingPaused&&!engineRunningRef.current){engineRunningRef.current=true;void startEngine(e);}},[processingPaused]);
  useEffect(()=>{if(paused)send('input',{x:.5});},[paused,send]);
  useEffect(()=>{if(state.status!=='connected'||paused)return;const timer=setInterval(()=>send('input',{x:inputRef.current.x}),50);return()=>clearInterval(timer);},[state.status,paused,send]);
  useEffect(()=>{
    const down=e=>{if(['INPUT','TEXTAREA','BUTTON'].includes(e.target?.tagName))return;const k=e.key.toLowerCase();if(k==='a'||k==='arrowleft')inputRef.current.left=true;if(k==='d'||k==='arrowright')inputRef.current.right=true;if(k===' '){e.preventDefault();send('launch');}if(k==='p')setPaused(v=>!v);};
    const up=e=>{const k=e.key.toLowerCase();if(k==='a'||k==='arrowleft')inputRef.current.left=false;if(k==='d'||k==='arrowright')inputRef.current.right=false;};
    const blur=()=>{inputRef.current.left=inputRef.current.right=false;inputRef.current.x=.5;send('input',{x:.5});};
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);blur();};
  },[send,setPaused]);
  const pointerMove=e=>{if(state.status!=='connected'||paused)return;const r=hostRef.current.getBoundingClientRect(),u=(e.clientX-r.left)/r.width,next=toPaddleInput(u);if(next!==inputRef.current.x)lastInputAtRef.current=performance.now();inputRef.current.x=next;};
  const label=state.status==='full'?'Both paddle positions are occupied. Retry when a player leaves.':state.status==='connected'?'Connected — waiting for the shared board…':state.error||'Connecting to the shared game…';
  return <div ref={hostRef} className="babylon_content neon_game" style={{backgroundImage:`url(${spaceUrl})`}} onPointerDown={e=>{if(!e.target.closest('button')){e.currentTarget.setPointerCapture(e.pointerId);pointerMove(e);}}} onPointerMove={e=>{if(e.buttons)pointerMove(e);}} onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}} onPointerCancel={()=>{inputRef.current.x=.5;send('input',{x:.5});}}>
    <canvas ref={canvasRef} className="babylon_canvas" aria-hidden="true"/>{sceneBorderVisible&&<div className="babylon_scene_border" aria-hidden="true"/>}
    {message&&<div className="babylon_content_message" role="status">{message}</div>}
    <div className="game-hud"><span>WAVE {game?.wave??1}/3</span><span>SCORE {String(game?.score??0).padStart(5,'0')}</span><span>LIVES {game?.lives??3}</span></div>
    {(state.status!=='connected'||!game)&&<div className="game-notice" role="status"><strong>NEON BREAKER DUO</strong><span>{label}</span>{state.status==='full'&&<button onClick={retry}>Retry</button>}</div>}
    {game?.outcome==='victory'&&<div className="game-notice" role="status"><strong>WAVE CLEAR!</strong><span>You broke through all three sectors.</span><button onClick={()=>send('restart')}>PLAY AGAIN</button></div>}
    {game?.outcome==='defeat'&&<div className="game-notice" role="status"><strong>OUT OF LIVES</strong><span>Your team can try another run.</span><button onClick={()=>send('restart')}>RESTART</button></div>}
    <div className="game-controls"><span>{seat===0?'PLAYER 1 · LOWER · Y 490':'PLAYER 2 · UPPER · Y 440'}</span><button onClick={()=>send('launch')}>LAUNCH · SPACE</button><button onClick={()=>setPaused(v=>!v)}>{paused?'RESUME':'PAUSE · P'}</button></div>
    {paused&&<div className="pause-tag" role="status">LOCAL PAUSE · YOUR PARTNER KEEPS PLAYING</div>}
  </div>;
}
export function Content(){const mode=getRenderingPolicy(contentConfig);if(mode==='performance-scaled-3d')return <div className="babylon_content babylon_content_message">Configure a Babylon Lite 3D scene using the Performance-scaled 3D policy.</div>;if(mode!=='pixel-perfect')return <div className="babylon_content babylon_content_message">Select Babylon Lite 2D content or configure a supported renderer.</div>;return <PixelPerfectGame/>;}

