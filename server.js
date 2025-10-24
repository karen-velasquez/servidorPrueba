const { Server } = require("socket.io");

const PORT = process.env.PORT || 3003;

const io = new Server(PORT, {
  cors: { origin: "*" },
});

io.on("connection", (client) => {
  console.log("Cliente conectado:", client.id);

  client.on("joinRoom", ({ username, room }) => {
    client.join(room);
    client.data.username = username;
    client.data.room = room;
    console.log(`${username} se unió a ${room}`);

    client.emit("msg", `Bienvenido ${username} a la sala ${room}`);
    client.to(room).emit("msg", `${username} se ha unido a la sala.`);
  });

  client.on("stream", (data) => {
    const { room, user, message } = data;
    console.log(`(${room}) ${user}: ${message}`);
    io.to(room).emit("stream", `${user}: ${message}`);
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

console.log(`Servidor Socket.IO escuchando en puerto ${PORT}`);
