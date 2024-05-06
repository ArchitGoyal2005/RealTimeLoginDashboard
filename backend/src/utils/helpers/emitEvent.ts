import { Server } from "socket.io";

export default function emitEvent(
  io: Server,
  roomId: string,
  eventName: string,
  data: any
) {
  io.to(roomId).emit(eventName, data);
}
