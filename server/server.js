// server/server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
 
const app = express();
const server = http.createServer(app);
const io = new Server(server);
 
app.use(express.static(path.join(__dirname, "../client")));
 
const sessions = {}; // { roomCode: { players, food } }
 
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}
 
io.on("connection", (socket) => {
console.log("New connection:", socket.id);
 
  socket.on("createGame", () => {
    const roomCode = generateRoomCode();
    sessions[roomCode] = { players: {}, food: { x:20, y: 20 } };
    socket.join(roomCode);
sessions[roomCode].players[socket.id] = {
      x: 5,
      y: 5,
      dir: "right",
      length: 3,
      stunned: false,
    };
    socket.emit("gameCreated", roomCode);
  });
 
  socket.on("joinGame", ({ roomCode }) => {
    if (sessions[roomCode]) {
      socket.join(roomCode);
sessions[roomCode].players[socket.id] = {
        x: 2,
        y: 2,
        dir: "right",
        length: 3,
        stunned: false,
      };
io.to(roomCode).emit("playerJoined", sessions[roomCode].players);
    }
  });
 
  socket.on("submitAnswer", ({ roomCode, correct }) => {
const player = sessions[roomCode]?.players[socket.id];
    if (player) {
      player.stunned = !correct;
      if (player.stunned) {
        setTimeout(() => {
          player.stunned = false;
        }, 10000);
      }
    }
  });
 
  socket.on("changeDirection", ({ roomCode, dir }) => {
const player = sessions[roomCode]?.players[socket.id];
    if (player && !player.stunned) player.dir = dir;
  });
 
  socket.on("disconnect", () => {
    for (const roomCode in sessions) {
delete sessions[roomCode].players[socket.id];
    }
  });
});
 
function updateGameState(session) {
  // Basic movement logic
  for (const id in session.players) {
    const player = session.players[id];
    if (player.stunned) continue;
    if (player.dir === "right") player.x += 1;
    else if (player.dir === "left") player.x -= 1;
    else if (player.dir === "up") player.y -= 1;
    else if (player.dir === "down") player.y += 1;
  }
}
 
setInterval(() => {
  for (const roomCode in sessions) {
    updateGameState(sessions[roomCode]);
io.to(roomCode).emit("stateUpdate", sessions[roomCode]);
  }
}, 300);
 
server.listen(3000, () => console.log("Server running on http://localhost:3000"));