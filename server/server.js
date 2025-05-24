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
    sessions[roomCode] = { players: {}, food: [], gameStarted: false};
    socket.join(roomCode);
    socket.emit("gameCreated", roomCode);
  });

  socket.on("joinGame", ({ roomCode, username }) => {
    if (sessions[roomCode]) {
      socket.join(roomCode);
      socket.emit("gameStatus", { gameStarted: sessions[roomCode].gameStarted });
      const x =Math.floor(Math.random() * (sessions[roomCode].gridWidth - 3));
      const y = Math.floor(Math.random() * sessions[roomCode].gridHeight);
      sessions[roomCode].players[socket.id] = {
        x: x,
        y: y,
        dir: "right",
        length: 3,
        bodyPoses: [{x: x + 3,y: y}, {x: x + 2,y: y}, {x: x + 1,y: y}],
        color: getRandomColorHex(),
        username: username,
      };
      io.to(roomCode).emit("playerJoined", sessions[roomCode].players);
      console.log("Player joined room:", roomCode);
      if (!sessions[roomCode].food) {
        sessions[roomCode].food = [];
      }
      const foodLoc = generateRandomFoodLocation(sessions[roomCode]);
      sessions[roomCode].food.push(foodLoc);

      io.to(roomCode).emit("stateUpdate", sessions[roomCode]); // this includes food
      if(sessions[roomCode].gameStarted) {
        askQuestion(roomCode);
      }
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
    askQuestion(roomCode);
  });

  function askQuestion(roomCode){
    const player = sessions[roomCode]?.players[socket.id];
    if (player) {
      socket.emit(
        "question",
        questions[Math.floor(Math.random() * questions.length)]
      );
    }
  }

  socket.on("startGame", ({ roomCode }) => {
    sessions[roomCode].gameStarted = true;
    io.to(roomCode).emit("gameStatus", { gameStarted: sessions[roomCode].gameStarted });
    io.to(roomCode).emit("question", questions[Math.floor(Math.random() * questions.length)]);
    io.to(roomCode).emit("startTimer", { duration: 10 });
  });

  socket.on("answer", ({ roomCode, correct, index, correctIndex }) => {
    const player = sessions[roomCode]?.players[socket.id];
    if (player) {
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
    let newLoc = { x: player.x, y: player.y };
    if (!player.stunned){
        if (player.dir === "right") newLoc.x += 1;
        else if (player.dir === "left") newLoc.x -= 1;
        else if (player.dir === "up") newLoc.y -= 1;
        else if (player.dir === "down") newLoc.y += 1;
    }

    if(locOccupied(sessions[roomCode], newLoc.x, newLoc.y, false)) return;

    player.bodyPoses.push({ x: player.x, y: player.y });

    // Trim body to correct length (on the server!)
    while (player.bodyPoses.length > player.length) {
      player.bodyPoses.shift();
    }

    player.x = newLoc.x;
    player.y = newLoc.y;

    if(sessions[roomCode].food.some(f => f.x === player.x && f.y === player.y)) {
      player.length ++;
      const foodIndex = sessions[roomCode].food.findIndex(
        f => f.x === player.x && f.y === player.y
      );
      if (foodIndex !== -1) {
        sessions[roomCode].food.splice(foodIndex, 1);
        const newFoodLoc = generateRandomFoodLocation(sessions[roomCode]);
        sessions[roomCode].food.push(newFoodLoc);
      }
    }
    
    socket.emit("moved");
  });

  socket.on("endGame", (roomCode) => {
  const session = sessions[roomCode];
  if (!session) return;

  io.to(roomCode).emit("endGame", {
    players: session.players
  });
});
});

setInterval(() => {
  for (const roomCode in sessions) {
    // move(sessions[roomCode]);
    io.to(roomCode).emit("stateUpdate", sessions[roomCode]);
  }
}, 20);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

function getRandomColorHex() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

function generateRandomFoodLocation(session) {
  let x, y;
  do {
    x = Math.floor(Math.random() * session.gridWidth);
    y = Math.floor(Math.random() * session.gridHeight);
  } while (
    locOccupied(session, x, y)
  );
  return { x, y };
}

function locOccupied(session, x, y, includeFood = true) {
  const players = Object.values(session.players);
  return (
    (session.food.some(f => f.x === x && f.y === y) &&includeFood) ||
    players.some(p => p.x === x && p.y === y || p.bodyPoses.some(p => p.x === x && p.y === y)) ||
    x < 0 || x >= session.gridWidth || y < 0 || y >= session.gridHeight
  );
}
