import { Server } from "socket.io";

export function attachSocket(server, options = {}) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      credentials: true
    },
    ...options
  });

  global.io = io;

  io.on("connection", (socket) => {
    console.log("socket connected:", socket.id);

    socket.on("join_order_room", (userId) => {
      if (userId) socket.join(userId);
    });

    socket.on("disconnect", () => {
      // noop
    });
  });

  return io;
}
