import { Server } from "socket.io";
import http from "http";

const port = process.env.PORT || 3003;
const server = http.createServer();

const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (client) => {
  console.log("Cliente conectado:", client.id);

  // Usuario se une a una sala
  client.on("joinRoom", ({ username, room }) => {
    client.join(room);
    client.data.username = username;
    client.data.room = room;

    // Mensaje solo para el usuario que entra
    client.emit("msg", `Bienvenido ${username} a la sala ${room}`);

    // Mensaje para todos los demás en la sala
    client.to(room).emit("msg", `${username} se ha unido a la sala.`);
  });

  // Manejo de mensajes
  client.on("stream", ({ user, room, message }) => {
    if (!room || !user || !message) return;
    // Envía solo a los demás en la sala
    client.to(room).emit("stream", { user, message });
  });

  client.on("changeRoom", ({ newRoom }) => {
    const oldRoom = client.data.room;

    if (oldRoom) {
      client.leave(oldRoom);
      client.to(oldRoom).emit("msg", `${client.data.username} ha salido de la sala.`);
    }

    client.join(newRoom);
    client.data.room = newRoom;
    client.emit("msg", `Has entrado a la sala ${newRoom}`);
    client.to(newRoom).emit("msg", `${client.data.username} se ha unido a la sala.`);
  });

  client.on("disconnect", () => {
    if (client.data.username && client.data.room) {
      io.to(client.data.room).emit(
        "msg",
        `${client.data.username} ha salido del chat.`
      );
    }
    console.log("Cliente desconectado:", client.id);
  });
});

server.listen(port, () => {
  console.log(`Servidor Socket.IO escuchando en puerto ${port}`);
});
