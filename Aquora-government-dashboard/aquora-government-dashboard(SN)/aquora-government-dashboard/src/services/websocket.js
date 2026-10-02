let socket=null,reconnectTimer=null,manuallyClosed=false;

export function connectGovernmentWebSocket(callbacks={}){
  manuallyClosed=false;

  if(socket?.readyState===WebSocket.OPEN)return socket;

  const url=import.meta.env.VITE_WS_URL||"ws://10.207.191.50:8081/ws";

  try{
    socket=new WebSocket(url);
  }catch(e){
    callbacks.onError?.(e);
    schedule(callbacks);
    return null;
  }

  socket.onopen=()=>callbacks.onOpen?.();

  socket.onmessage=e=>{
    try{
      callbacks.onMessage?.(JSON.parse(e.data));
    }catch(err){
      callbacks.onError?.(err);
    }
  };

  socket.onerror=e=>callbacks.onError?.(e);

  socket.onclose=e=>{
    socket=null;
    callbacks.onClose?.(e);
    if(!manuallyClosed)schedule(callbacks);
  };

  return socket;
}

function schedule(c){
  if(reconnectTimer||manuallyClosed)return;

  reconnectTimer=setTimeout(()=>{
    reconnectTimer=null;
    connectGovernmentWebSocket(c);
  },5000);
}

export function disconnectGovernmentWebSocket(){
  manuallyClosed=true;

  if(reconnectTimer)clearTimeout(reconnectTimer);

  reconnectTimer=null;

  if(socket){
    socket.close();
    socket=null;
  }
}