const socket = io();
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let roomCode = "";
 
function createGame() {
  socket.emit("createGame");
  socket.on("gameCreated", (code) => {
    roomCode = code;
    document.getElementById("roomDisplay").innerText = "Room Code: " + code;

    console.log("Game created with code: " + code);

    // Hide the lobby UI
    document.getElementById("lobbyUI").style.display = "none";
  });
}
 
function joinGame() {
  const code = document.getElementById("roomCode").value;
  roomCode = code;
  socket.emit("joinGame", { roomCode: code });
}
 
socket.on("stateUpdate", (session) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const id in session.players) {
    const p = session.players[id];
  ctx.fillStyle = id === socket.id ? "lime" : "white";
      ctx.fillRect(p.x * 10, p.y * 10, 10, 10);
  }
  
});

socket.on("question", (q) => {

  console.log("Received question:", q);

  const panel = document.getElementById("questionPanel");
  const questionText = document.getElementById("questionText");
  const choicesContainer = document.getElementById("choicesContainer");

  // Clear previous choices
  choicesContainer.innerHTML = "";

  // Set the question
  questionText.innerHTML = q.question;

  // Add choice buttons
  q.choices.forEach((choice, i) => {
    const btn = document.createElement("button");
    btn.innerHTML = choice;
    btn.onclick = () => {
      socket.emit("answer", { questionId: q.id, selected: i });
      panel.style.display = "none"; // optionally hide panel after answering
    };
    choicesContainer.appendChild(btn);
  });

  // Show panel
  panel.style.display = "block";

  // Re-render math
  MathJax.typesetPromise([questionText]);
});

 
window.addEventListener("keydown", (e) => {
  const key = e.key;
  let dir = null;
  if (key === "ArrowUp") dir = "up";
  if (key === "ArrowDown") dir = "down";
  if (key === "ArrowLeft") dir = "left";
  if (key === "ArrowRight") dir = "right";
  if (dir) socket.emit("changeDirection", { roomCode, dir });
});

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const cellSize = 20; // each grid square is 20px

socket.on("stateUpdate", (session) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const id in session.players) {
    const p = session.players[id];
    ctx.fillStyle = id === socket.id ? "lime" : "white";
    ctx.fillRect(p.x * cellSize, p.y * cellSize, cellSize, cellSize);
  }
});

const gridWidth = Math.floor(canvas.width / cellSize);
const gridHeight = Math.floor(canvas.height / cellSize);