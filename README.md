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

    Install dependencies

    bash
    Copy
    Edit
    npm install
    Run the server

    bash
    Copy
    Edit
    node server/server.js
    Open the game

    Visit http://localhost:3000 in your browser
    (Players must be on the same network unless deployed)

## 🌐 Hosting Online (Render or Railway)
    Push this repo to GitHub

    Deploy on Render.com or Railway.app

    Set the start command to:

    pgsql
    Copy
    Edit
    node server/server.js
## 👨‍🏫 How It Works
    The teacher clicks “Create Game” and gets a room code

    Students join using the code and enter their name

    When the host starts the game:

    All players are asked a question

    Only correct answers allow them to move their snake

    Wrong answers = 10s stun

    A global timer counts down from 30s+

    When time runs out:

    Host sees the full leaderboard

    Players see their final rank and length

## 📁 File Structure
    pgsql
    Copy
    Edit
    ├── client/
    │   ├── index.html
    │   ├── game.js
    │   └── style.css
    ├── server/
    │   ├── server.js
    │   └── questions.json
## ✏️ Question Format (in questions.json)
    json
    Copy
    Edit
    {
    "id": 1,
    "question": "What is the derivative of $x^2$?",
    "choices": ["$x$", "$2x$", "$x^2$", "$2x^2$"],
    "correctIndex": 1
    }
    Supports LaTeX via MathJax.

## ✅ To Do / Improvements
 Support touch/mouse for mobile play

 Add question categories (derivatives, integrals, limits)

 Add animations/sound effects

 Add a game replay mode for classrooms

## 📚 Credits
    Made with 💛 for classrooms using:

    Socket.IO

    MathJax

    HTML5 Canvas

    📄 License
    MIT — feel free to modify and use this in your own classrooms or educational games!