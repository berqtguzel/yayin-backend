const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Basit bir kontrol için root endpoint
app.get("/", (req, res) => {
  res.send("🟢 Yayın Backend Aktif");
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

  socket.on("chat-message", (data) => {
    console.log("💬 Gelen mesaj:", data);
    io.to(data.room).emit("chat-message", data);
  });

  socket.on("disconnect", () => {
    console.log("Ayrıldı:", socket.id);
  });
});

// 🌐 PORT ayarı (Render otomatik port sağlar)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Socket server çalışıyor: http://localhost:${PORT}`);
});
let viewerCount = 0;
const viewers = {}; // Socket ID'ye göre isimleri tutar

io.on("connection", socket => {
  console.log("Yeni bağlantı:", socket.id);

  socket.on("join", ({ room, name }) => {
    socket.join(room);

    // İzleyici listesine ekle
    viewers[socket.id] = { room, name };

    // Yayıncıya haber ver
    socket.to(room).emit("user-joined", socket.id);

    // Hoş geldin mesajı gönder
    io.to(room).emit("chat-message", {
      sender: "Sistem",
      message: `${name} yayına katıldı 👋`,
    });

    // O anki izleyici sayısını gönder
    const count = Object.values(viewers).filter(v => v.room === room).length;
    io.in(room).emit("viewer-count", count);
  });

  socket.on("disconnect", () => {
    const viewer = viewers[socket.id];

    if (viewer) {
      const { room, name } = viewer;
      delete viewers[socket.id];

      // Kullanıcı ayrıldı mesajı
      io.to(room).emit("chat-message", {
        sender: "Sistem",
        message: `${name} yayından ayrıldı 👋`,
      });

      // İzleyici sayısını güncelle
      const count = Object.values(viewers).filter(v => v.room === room).length;
      io.in(room).emit("viewer-count", count);
    }

    console.log("Ayrıldı:", socket.id);
  });

  // Diğer socket eventlerin (offer, answer, ice-candidate, chat-message) burada devam edebilir.
});
