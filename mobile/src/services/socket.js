import { io } from "socket.io-client";
import { API_BASE_URL } from "./api";

let socketInstance = null;

function resolveSocketUrl() {
  const url = API_BASE_URL || "";
  if (url.startsWith("https://")) return url.replace("https://", "wss://");
  if (url.startsWith("http://")) return url.replace("http://", "ws://");
  return url;
}

export function connectSocket(token) {
  if (!token) return null;
  if (socketInstance?.connected) return socketInstance;

  socketInstance = io(resolveSocketUrl(), {
    transports: ["websocket"],
    auth: { token },
    reconnection: true,
  });

  return socketInstance;
}

export function getSocket() {
  return socketInstance;
}

export function disconnectSocket() {
  socketInstance?.disconnect();
  socketInstance = null;
}

// Ultra-safe proxy to prevent "Cannot read property '...' of undefined"
const socketProxy = {
  emit: (...args) => {
    if (socketInstance) socketInstance.emit(...args);
    else console.warn("Socket not connected, delayed emit:", args[0]);
  },
  on: (...args) => {
    if (socketInstance) socketInstance.on(...args);
  },
  off: (...args) => {
    if (socketInstance) socketInstance.off(...args);
  },
  get connected() {
    return socketInstance?.connected || false;
  }
};

export default socketProxy;
