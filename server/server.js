// server/server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const fs = require("fs");

const raw = fs.readFileSync("questions.json", "utf8");
const questions = JSON.parse(raw);

app.use(express.static(path.join(__dirname, "../client")));

const sessions = {}; // { roomCode: { players, food } }

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("createGame", () => {
    const roomCode = generateRoomCode();
    sessions[roomCode] = { players: {}, food: { x: 20, y: 20 } };
    socket.join(roomCode);
    socket.emit("gameCreated", roomCode);
  });

  socket.on("joinGame", ({ roomCode }) => {
    if (sessions[roomCode]) {
      socket.join(roomCode);
      sessions[roomCode].players[socket.id] = {
        x: Math.floor(Math.random() * sessions[roomCode].gridWidth),
        y: Math.floor(Math.random() * sessions[roomCode].gridHeight),
        dir: "right",
        length: 3,
        color: getRandomColorHex(),
      };
      io.to(roomCode).emit("playerJoined", sessions[roomCode].players);
      console.log("Player joined room:", roomCode);
      
    }
  });

  socket.on("setGridSize", ({ roomCode, gridWidth, gridHeight }) => {
  if (sessions[roomCode]) {
    sessions[roomCode].gridWidth = gridWidth;
    sessions[roomCode].gridHeight = gridHeight;
    console.log(`Grid size for ${roomCode}: ${gridWidth} x ${gridHeight}`);
  }
});

  socket.on("askQuestion", ({ roomCode }) => {
    const player = sessions[roomCode]?.players[socket.id];
    if (player) {
      socket.emit(
        "question",
        questions[Math.floor(Math.random() * questions.length)]
      );
    }
  });

  socket.on("answer", ({ roomCode, correct, index, correctIndex }) => {
    const player = sessions[roomCode]?.players[socket.id];
    if (player) {
      player.stunned = !correct;
      if (player.stunned) {
        setTimeout(() => {
          player.stunned = false;
        }, 10000);
      }
      socket.emit("answerResult", correct, index, correctIndex);
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

  socket.on("move", ({ roomCode }) => {
    // Basic movement logic

    const player = sessions[roomCode]?.players[socket.id];
    if (!player.stunned){
        if (player.dir === "right") player.x += 1;
        else if (player.dir === "left") player.x -= 1;
        else if (player.dir === "up") player.y -= 1;
        else if (player.dir === "down") player.y += 1;
    }
    
  });
});

setInterval(() => {
  for (const roomCode in sessions) {
    // move(sessions[roomCode]);
    io.to(roomCode).emit("stateUpdate", sessions[roomCode]);
  }
}, 20);

server.listen(3000, '192.168.8.127', () =>
  console.log("Server running on http://192.168.8.127:3000")
);

function getRandomColorHex() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16);
}
