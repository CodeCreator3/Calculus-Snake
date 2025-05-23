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
let isHost = false;
let cameraVelocityX = 0;
let cameraVelocityY = 0;
const gridWidth = 50;
const gridHeight = 20;

function createGame() {
  socket.emit("createGame");
  isHost = true; // set flag
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
  // Hide the lobby UI
  document.getElementById("lobbyUI").style.display = "none";
  document.getElementById("moveCounter").style.display = "block";
  socket.emit("setGridSize", { roomCode, gridWidth, gridHeight });
  socket.emit("joinGame", { roomCode: code });
  socket.emit("askQuestion", { roomCode: code });
  
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
      socket.emit("answer", {
        roomCode: code,
        correct: correct,
        index: i,
        correctIndex: newQ.correctIndex,
      });
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

function randomizeQuestion(q) {
  let newIndices = [];
  let newChoices = [];
  for (let i = 0; i < q.choices.length; i++) {
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * q.choices.length);
    } while (newIndices.includes(randomIndex));
    newIndices[i] = randomIndex;
  }
  for (let i = 0; i < q.choices.length; i++) {
    newChoices[i] = q.choices[newIndices[i]];
  }
  let newCorrectIndex = newIndices.findIndex((element) => element == q.correctIndex);
  return {
    question: q.question,
    choices: newChoices,
    correctIndex: newCorrectIndex,
  };
}

socket.on("answerResult", (correct, index, correctIndex) => {
  if (answered) return;
  if (correct) moves+=5;
  if (correct) {
    btns[index].style.backgroundColor = "#648268";
  } else {
    btns[index].style.backgroundColor = "#8B2C2C";
    btns[correctIndex].style.backgroundColor = "#648268";
  }
  answered = true;
  setTimeout(
    () => {
      socket.emit("askQuestion", { roomCode });
      answered = false;
    },
    correct ? 1000 : 10000
  );
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
  }
});

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const delta = Math.sign(e.deltaY);
  zoom -= delta * zoomStep;
  zoom = Math.max(zoomMin, Math.min(zoomMax, zoom));

  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;

  canvas.addEventListener("mousedown", (e) => {
    if (!isHost) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!isHost || !isDragging) return;

    const dx = (e.clientX - dragStartX) / zoom;
    const dy = (e.clientY - dragStartY) / zoom;

    const sensitivity = 1.4; // smaller = less jumpy
    cameraVelocityX = dx * sensitivity;
    cameraVelocityY = dy * sensitivity;

    dragStartX = e.clientX;
    dragStartY = e.clientY;
  });

  canvas.addEventListener("mouseup", () => {
    isDragging = false;
  });
  canvas.addEventListener("mouseleave", () => {
    isDragging = false;
  });
});

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

socket.on("stateUpdate", (session) => {
  const player = session.players[socket.id];
  if (isHost) {
    if(cameraVelocityX !== 0 || cameraVelocityY !== 0){
      cameraX -= cameraVelocityX;
      cameraY -= cameraVelocityY;
      if(cameraX < 0) cameraX = 0;
      if(cameraY < 0) cameraY = 0;
      if(cameraX > (gridWidth * cellSize * zoom)) cameraX = (gridWidth * cellSize * zoom);
      if(cameraY > (gridHeight * cellSize * zoom)) cameraY = (gridHeight * cellSize * zoom);

      // Apply damping to make it smooth and stop gradually
      cameraVelocityX *= 0.85;
      cameraVelocityY *= 0.85;

      if (Math.abs(cameraVelocityX) < 0.01) cameraVelocityX = 0;
      if (Math.abs(cameraVelocityY) < 0.01) cameraVelocityY = 0;
    }
  } else{
    const targetX = player.x * cellSize + cellSize / 2;
    const targetY = player.y * cellSize + cellSize / 2;
    cameraX += (targetX - cameraX) * 0.1;
    cameraY += (targetY - cameraY) * 0.1;
  }

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
    document.getElementById("moveCounter").textContent = `Moves: ${moves} Length: ${p.length}`;
    if(p.bodyPoses.length > p.length)do{p.bodyPoses.shift()}while(p.bodyPoses.length > p.length);
    for (const pos of p.bodyPoses) {
      ctx.fillStyle = darkenColor(p.color, 50);
      ctx.fillRect(pos.x * cellSize, pos.y * cellSize, cellSize, cellSize);
    }
  }

  // Draw all food
  for(const food of session.food) {
    ctx.fillStyle = "#FF0000";
    ctx.beginPath();
    ctx.arc(food.x * cellSize + cellSize*0.5, food.y * cellSize+ cellSize*0.5, cellSize * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  paintGrid();
});

function darkenColor(color, amount) {
  const r = Math.max(0, parseInt(color.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(color.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(color.slice(5, 7), 16) - amount);

  const rHex = r.toString(16).padStart(2, "0");
  const gHex = g.toString(16).padStart(2, "0");
  const bHex = b.toString(16).padStart(2, "0");

  return `#${rHex}${gHex}${bHex}`;
}

socket.on("addFood", (session) => {
  loc = generateRandomLocation(session);
  session.food.push(loc)
})

function generateRandomLocation(session) {
  let x;
  let y;
  do{
  x = Math.floor(Math.random() * gridWidth);
  y = Math.floor(Math.random() * gridHeight);
  } while(session.food.some((obj) => obj.x === x && obj.y === y) || Object.values(session.players).some((obj) => obj.x === x && obj.y === y));
  console.log("Food location: ", x, y);
  return { x, y };
}
