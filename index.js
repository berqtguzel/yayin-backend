const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }
});

io.on("connection", socket => {
  console.log("Yeni bağlantı:", socket.id);

  socket.on("join", room => {
    socket.join(room);
    socket.to(room).emit("user-joined", socket.id);
  });

  socket.on("offer", (data) => {
    socket.to(data.to).emit("offer", { from: socket.id, offer: data.offer });
  });

  socket.on("answer", (data) => {
    socket.to(data.to).emit("answer", { from: socket.id, answer: data.answer });
  });

  socket.on("ice-candidate", (data) => {
    socket.to(data.to).emit("ice-candidate", {
      from: socket.id,
      candidate: data.candidate,
    });
  });

  // ✅ CHAT mesajını burada dinle!
  socket.on("chat-message", (data) => {
    console.log("Gelen mesaj:", data);
    io.emit("chat-message", data); // herkese gönder
  });

  socket.on("disconnect", () => {
    console.log("Ayrıldı:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("Socket server running on http://localhost:5000");
});

