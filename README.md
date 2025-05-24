# 🐍 Calculus Snake

A multiplayer, synchronous Snake game where players solve calculus questions to move. Designed for classroom settings, hosted by a teacher who can monitor the whole game and leaderboard in real time.

---

## 🚀 Features

- 🧠 Players must solve multiple-choice calculus questions to move
- 🐍 Grow by eating food, die by colliding with other snakes
- ❌ Wrong answers stun players for 10 seconds
- ⏱️ Server-side timer tracks the game duration
- 🧑‍🏫 Teacher has a host view with full-grid control, zoom, drag, and leaderboard
- 📊 Leaderboard ranks players by snake length

---

## 🧩 Tech Stack

- Node.js + Express + Socket.IO for real-time multiplayer
- Vanilla JavaScript + HTML5 `<canvas>` for gameplay
- MathJax for rendering calculus questions
- Server-authoritative game logic

---

## 🛠️ Setup & Running Locally

1. **Clone the repo**

   ```bash
   git clone https://github.com/yourname/calculus-snake.git
   cd calculus-snake
