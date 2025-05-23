const socket = io();
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const cellSize = 20; // each grid square is 20px
let moveable = false;
let roomCode = "";

function createGame() {
  socket.emit("createGame");
  socket.on("gameCreated", (code) => {
    roomCode = code;
    document.getElementById("roomDisplay").innerText = "Room Code: " + code;

    console.log("Game created with code: " + code);

    // Hide the lobby UI
    document.getElementById("lobbyUI").style.display = "none";
    
    document.getElementById("questionPanel").style.display = "none";
  });
}

function paintGrid() {
  console.log("Painting grid");
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 1;
  ctx.rect(10, 10, 100, 100);
  ctx.strokeStyle = "#2C2C2C";
  for (let i = 0; i < gridWidth; i++) {
    for (let j = 0; j < gridHeight; j++) {
      ctx.strokeRect(i * cellSize, j * cellSize, cellSize, cellSize);
    }
  }
}

function joinGame() {
  const code = document.getElementById("roomCode").value;
  roomCode = code;
  socket.emit("joinGame", { roomCode: code });
  socket.emit("askQuestion", { roomCode: code });
}

socket.on("question", (q) => {
  console.log("Received question:", q);

  const panel = document.getElementById("questionPanel");
  const questionText = document.getElementById("questionText");
  const choicesContainer = document.getElementById("choicesContainer");

  // Clear previous choices
  choicesContainer.innerHTML = "";

  // Set the question
  questionText.innerHTML = q.question;

  const code = document.getElementById("roomCode").value;
  roomCode = code;

  // Add choice buttons
  q.choices.forEach((choice, i) => {
    const btn = document.createElement("button");
    btn.innerHTML = choice;
    btn.onclick = () => {
      socket.emit("answer", { roomCode: code, correct: i == q.correctIndex });
    };
    choicesContainer.appendChild(btn);
  });

   // Re-render math
  MathJax.typesetPromise([questionText]);

  // Show panel
  panel.style.display = "block";
});

socket.on("answerResult", (correct) => {
  moveable = correct;
});

window.addEventListener("keydown", (e) => {
  if (moveable) {
    const key = e.key;
    let dir = null;
    if (key === "ArrowUp") dir = "up";
    if (key === "ArrowDown") dir = "down";
    if (key === "ArrowLeft") dir = "left";
    if (key === "ArrowRight") dir = "right";
    if (dir) socket.emit("changeDirection", { roomCode, dir });
    socket.emit("move", { roomCode });
    socket.emit("askQuestion", { roomCode });
    moveable = false;
  }
});

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

socket.on("stateUpdate", (session) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const id in session.players) {
    const p = session.players[id];
    ctx.fillStyle = id === socket.id ? "lime" : "white";
    ctx.fillRect(p.x * cellSize, p.y * cellSize, cellSize, cellSize);
    paintGrid();
  }
});

const gridWidth = 50;
const gridHeight = 20;
