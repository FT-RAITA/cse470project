import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5001";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export const connectSocket = (token) => {
  if (!socket.connected) {
    socket.auth = { token };
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};