const socket = io();
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let roomCode = "";
 
function createGame() {
  socket.emit("createGame");
  socket.on("gameCreated", (code) => {
    roomCode = code;
    alert("Game created! Room code: " + code);
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
 
window.addEventListener("keydown", (e) => {
  const key = e.key;
  let dir = null;
  if (key === "ArrowUp") dir = "up";
  if (key === "ArrowDown") dir = "down";
  if (key === "ArrowLeft") dir = "left";
  if (key === "ArrowRight") dir = "right";
  if (dir) socket.emit("changeDirection", { roomCode, dir });
});