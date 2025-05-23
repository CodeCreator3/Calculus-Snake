const socket = io();
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const cellSize = 20; // each grid square is 20px
const btns = [];
let moves = 0;
let roomCode = "";
let answered = false;
let cameraX = 0;
let cameraY = 0;
let zoom = 1;
const zoomMin = 0.5;
const zoomMax = 2;
const zoomStep = 0.1;

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
  // Hide the lobby UI
    document.getElementById("lobbyUI").style.display = "none";
    socket.emit("setGridSize", { roomCode, gridWidth, gridHeight });
}

socket.on("question", (q) => {
  const newQ = randomizeQuestion(q);
  console.log("Received question:", newQ);

  const panel = document.getElementById("questionPanel");
  const questionText = document.getElementById("questionText");
  const choicesContainer = document.getElementById("choicesContainer");

  // Clear previous choices
  choicesContainer.innerHTML = "";

  // Set the question
  questionText.innerHTML = newQ.question;

  const code = document.getElementById("roomCode").value;
  roomCode = code;

  // Add choice buttons
  newQ.choices.forEach((choice, i) => {
    const btn = document.createElement("button");
    btn.innerHTML = choice;
    btn.onclick = () => {
      const correct = i == newQ.correctIndex;
      socket.emit("answer", { roomCode: code, correct: correct, index: i, correctIndex: newQ.correctIndex });
    };
    choicesContainer.appendChild(btn);
    MathJax.typesetPromise([btn]);
    btns[i] = btn;
  });

   // Re-render math
  MathJax.typesetPromise([questionText]);

  // Show panel
  panel.style.display = "block";
});

function randomizeQuestion(q){
  let newIndices = [];
  let filledIndices = [];
  for (let i = 0; i < q.choices.length; i++) {
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * q.choices.length);
    } while (filledIndices.includes(randomIndex));
    filledIndices.push(randomIndex);
    newIndices[i] = randomIndex;
  }
  let newChoices = [];
  for (let i = 0; i < q.choices.length; i++) {
    newChoices[i] = q.choices[newIndices[i]];
  }
  let newCorrectIndex = newIndices[q.correctIndex];
  return {
    question: q.question,
    choices: newChoices,
    correctIndex: newCorrectIndex,
  };
}

socket.on("answerResult", (correct, index, correctIndex) => {
  if(answered) return;
  if(correct) moves++;
  document.getElementById('moveCounter').textContent = `Moves: ${moves}`;
  if(correct) {
    btns[index].style.backgroundColor = "#648268";
  } else {
    btns[index].style.backgroundColor = "#8B2C2C";
    btns[correctIndex].style.backgroundColor = "#648268";
  }
  answered = true;
  setTimeout(() => {socket.emit("askQuestion", { roomCode }); answered = false;}, correct ? 1000 : 10000);
});

window.addEventListener("keydown", (e) => {
  if (moves > 0) {
    const key = e.key;
    let dir = null;
    if (key === "ArrowUp") dir = "up";
    if (key === "ArrowDown") dir = "down";
    if (key === "ArrowLeft") dir = "left";
    if (key === "ArrowRight") dir = "right";
    if (dir) socket.emit("changeDirection", { roomCode, dir });
    socket.emit("move", { roomCode });
    moves--;
    document.getElementById('moveCounter').textContent = `Moves: ${moves}`;
  }
});

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = Math.sign(e.deltaY);
  zoom -= delta * zoomStep;
  zoom = Math.max(zoomMin, Math.min(zoomMax, zoom));
});

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

socket.on("stateUpdate", (session) => {
  const player = session.players[socket.id];
  if (!player) return;

  // Smooth camera follow
  const targetX = player.x * cellSize + cellSize / 2;
  const targetY = player.y * cellSize + cellSize / 2;
  cameraX += (targetX - cameraX) * 0.1;
  cameraY += (targetY - cameraY) * 0.1;

  // Clear and apply camera transform
  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-cameraX, -cameraY);

  // Draw all players
  for (const id in session.players) {
    const p = session.players[id];
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x * cellSize, p.y * cellSize, cellSize, cellSize);
  }

  paintGrid();
});

const gridWidth = 50;
const gridHeight = 20;