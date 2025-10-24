import { Server } from "socket.io";
import http from "http";

const port = process.env.PORT || 3003;
const server = http.createServer();

// Conjunto para llevar las salas activas
const activeRooms = new Set();

const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (client) => {
  console.log("Cliente conectado:", client.id);

  // Emitir salas activas al conectarse
  client.emit("updateRooms", Array.from(activeRooms));

  // Usuario se une a una sala
  client.on("joinRoom", ({ username, room }) => {
    if (!username || !room) return;

    client.join(room);
    client.data.username = username;
    client.data.room = room;

    // Guardar sala en el conjunto de salas activas
    activeRooms.add(room);

    // Emitir lista de salas actualizada a todos
    io.emit("updateRooms", Array.from(activeRooms));

    // Mensaje de bienvenida al usuario
    client.emit("msg", `Bienvenido ${username} a la sala ${room}`);

    // Mensaje para los demás en la sala
    client.to(room).emit("msg", `${username} se ha unido a la sala.`);
  });

  // Manejo de mensajes en la sala
  client.on("stream", ({ user, room, message }) => {
    if (!room || !user || !message) return;
    client.to(room).emit("stream", { user, message });
  });

  // Cambio de sala
  client.on("changeRoom", ({ newRoom }) => {
    const oldRoom = client.data.room;
    if (!newRoom) return;

    if (oldRoom) {
      client.leave(oldRoom);
      client.to(oldRoom).emit("msg", `${client.data.username} ha salido de la sala.`);
    }

    client.join(newRoom);
    client.data.room = newRoom;

    // Agregar nueva sala al conjunto si es nueva
    activeRooms.add(newRoom);

    // Emitir lista de salas actualizada a todos
    io.emit("updateRooms", Array.from(activeRooms));

    client.emit("msg", `Has entrado a la sala ${newRoom}`);
    client.to(newRoom).emit("msg", `${client.data.username} se ha unido a la sala.`);
  });

  // Desconexión del usuario
  client.on("disconnect", () => {
    if (client.data.username && client.data.room) {
      io.to(client.data.room).emit("msg", `${client.data.username} ha salido del chat.`);
    }
    console.log("Cliente desconectado:", client.id);
  });
});

server.listen(port, () => {
  console.log(`Servidor Socket.IO escuchando en puerto ${port}`);
});
