// server.js (Express.js)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configure CORS for Express
app.use(cors());

const io = new Server(server, {
    cors: {
      origin: "https://192.168.29.61:5173",
      methods: ["GET", "POST"]
    }
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
      console.log(`User ${socket.id} is calling user ${to} with offer:`, offer);
      io.to(to).emit("incomming:call", { from: socket.id, offer });
    });
  
    socket.on("call:accepted", ({ to, ans }) => {
      console.log(`Call accepted by user ${to}, sending answer from ${socket.id}`);
      io.to(to).emit("call:accepted", { from: socket.id, ans });
    });
  
    socket.on("peer:nego:needed", ({ to, offer }) => {
      console.log(`Negotiation needed between ${socket.id} and ${to} with offer:`, offer);
      io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
    });
  
    socket.on("peer:nego:done", ({ to, ans }) => {
      console.log(`Negotiation done between ${socket.id} and ${to} with answer:`, ans);
      io.to(to).emit("peer:nego:final", { from: socket.id, ans });
    });
  
    socket.on("call:ended", ({ to }) => {
      console.log(`to ${to} `);
      io.to(to).emit("call:ended");
    });

    
  });

  app.get('/', (req, res) => {
    res.send('Server is running');
  });
  
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  
  module.exports = app;
