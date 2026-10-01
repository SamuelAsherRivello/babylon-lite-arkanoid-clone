import { createContext, useContext, useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { MultiplayerClient } from '@rmc/multiplayer-client';

const GameContext = createContext(null);
export function GameSessionProvider({ children }) {
  const clientRef = useRef(null);
  const [state, setState] = useState({status:'connecting',players:[],capacity:2,sessionId:null,gameState:null,error:''});
  const [paused,setPaused]=useState(false);
  useEffect(()=>{
    const endpoint=import.meta.env.VITE_MULTIPLAYER_URL || (import.meta.env.DEV?'http://127.0.0.1:2567':'https://rmc-colyseus-multiplayer-server.vercel.app');
    const client=new MultiplayerClient(endpoint,'neon-breaker-duo'); clientRef.current=client;
    const unsubscribe=client.subscribe(next=>setState({...next,players:[...(next.players||[])],gameState:next.gameState}));
    void client.connect();
    const blur=()=>{client.send('input',{x:.5});};
    window.addEventListener('blur',blur); document.addEventListener('visibilitychange',blur);
    return ()=>{window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',blur);unsubscribe();client.disconnect();clientRef.current=null;};
  },[]);
  const send=useCallback((kind,payload)=>clientRef.current?.send(kind,payload),[]);
  const retry=useCallback(()=>clientRef.current?.connect(),[]);
  const seat=state.players.find(p=>p.id===state.sessionId)?.seat ?? (state.players.length===0?0:1);
  const value=useMemo(()=>({state,seat,send,retry,paused,setPaused}),[state,seat,send,retry,paused]);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
export function useGameSession(){return useContext(GameContext) || {state:{status:'connecting',players:[],capacity:2,sessionId:null,gameState:null,error:''},seat:0,send:()=>{},retry:()=>{},paused:false,setPaused:()=>{}};}


