import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { contentConfig, logicalResolution, pixelPerfectOptions, getRenderingPolicy } from '../src/content/babylon/config.js';
import { getInitializationMessage } from '../src/content/babylon/initialization.js';
import { getLogicalToRenderScale } from '../src/content/babylon/pixel-perfect.js';
import { cycleRenderResolutionPreset, getRenderResolutionDimensions } from '../src/content/babylon/render-resolution.js';

test('uses Babylon Lite WebGPU and crisp pixel-perfect sampling for the 320x576 playfield',()=>{assert.deepEqual(contentConfig,{renderer:'babylon-lite',style:'2d'});assert.deepEqual(logicalResolution,{width:320,height:576});assert.equal(getRenderingPolicy(contentConfig),'pixel-perfect');assert.deepEqual(pixelPerfectOptions.engine,{msaaSamples:1,alphaMode:"premultiplied"});assert.equal(pixelPerfectOptions.texture.minFilter,'nearest');assert.equal(pixelPerfectOptions.texture.magFilter,'nearest');assert.equal(pixelPerfectOptions.texture.mipMaps,false);assert.equal(getLogicalToRenderScale(640,1152,logicalResolution),2);});
test('resolves render presets and integer scale from the available backing size',()=>{assert.deepEqual(getRenderResolutionDimensions(640,1152,'half'),{preset:'half',width:320,height:576,scale:.5});assert.deepEqual(getRenderResolutionDimensions(640,1152,'double'),{preset:'double',width:1280,height:2304,scale:2});assert.equal(cycleRenderResolutionPreset('double'),'quarter');});
test('produces a clear WebGPU recovery message',()=>{assert.match(getInitializationMessage(false,new Error('unsupported')),/requires WebGPU/);assert.match(getInitializationMessage(true,new Error('texture decode failed')),/could not initialize/);});
test('loads generated background and original crisp game sprite atlas',async()=>{const atlas=await readFile(new URL('../src/content/babylon/images/neon-brick-atlas.png',import.meta.url));const png=await readFile(new URL('../documentation/neon-space-background.png',import.meta.url));assert.deepEqual([...atlas.subarray(0,8)],[137,80,78,71,13,10,26,10]);assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);});
test('cleans renderer resources and continues rendering current server snapshots',async()=>{const content=await readFile(new URL('../src/content/Content.jsx',import.meta.url),'utf8');for(const re of [/cancelled=true/ ,/resizeObserver\?\.disconnect\(\)/,/disposeSpriteRenderer\(renderer\)/,/releaseTexture\(texture\)/,/disposeEngine\(engine\)/,/paintRef\.current=paint/,/centerSprite2DView\(layer\.view,logicalResolution\.width\/2,logicalResolution\.height\/2/])assert.match(content,re);});



