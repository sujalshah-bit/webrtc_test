// server.js (Express.js)
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configure CORS for Express
app.use(cors({
    cors: true,
}));

const io = socketIo(server, {
    cors: true,
});

const emailIdToSocket = new Map();
const socketToEmailId = new Map();


io.on("connection", (socket) => {
    console.log(`Socket Connected`, socket.id);
    socket.on("room:join", (data) => {
      const { email, room } = data;
      emailIdToSocket.set(email, socket.id);
      socketToEmailId.set(socket.id, email);
      io.to(room).emit("user:joined", { email, id: socket.id });
      socket.join(room);
      io.to(socket.id).emit("room:join", data);
    });
  
    socket.on("user:call", ({ to, offer }) => {
      io.to(to).emit("incomming:call", { from: socket.id, offer });
    });
  
    socket.on("call:accepted", ({ to, ans }) => {
      io.to(to).emit("call:accepted", { from: socket.id, ans });
    });
  
    socket.on("peer:nego:needed", ({ to, offer }) => {
      console.log("peer:nego:needed", offer);
      io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
    });
  
    socket.on("peer:nego:done", ({ to, ans }) => {
      console.log("peer:nego:done", ans);
      io.to(to).emit("peer:nego:final", { from: socket.id, ans });
    });
  });

server.listen(5000, () => console.log('Server running on port 5000'));
