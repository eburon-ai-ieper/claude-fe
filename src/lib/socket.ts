import { io } from "socket.io-client";

export const socket = io('http://localhost:80', {
  transports: ["websocket"],
  withCredentials: true
});
