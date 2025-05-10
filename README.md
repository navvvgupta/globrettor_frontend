# 🌍 Globetrotter Challenge - Frontend

This is the frontend client for **Globetrotter Challenge**, a geography-based quiz game where users guess world destinations based on timed clues and compete with friends.

Live backend: [`https://globetrotter-o4m5.onrender.com`](https://globetrotter-o4m5.onrender.com)

---

## 🚀 Features

- User Registration and Login (JWT-based Auth)
- Game session creation with configurable question/time limits
- Timer-based multiple choice questions
- Clue reveal system
- Fun facts on correct answers
- Real-time score updates
- Challenge a friend feature
- Session state persistence via `localStorage`

---

## 🛠️ Tech Stack

- HTML/CSS/Vanilla JS
- Backend API hosted on Render (Node.js + Express)
- JWT Token for secure authentication

---

## 🧩 Global Variables

```js
let currentUser = null;
let jwtToken = null;
let gameSessionId = null;
let currentQuestion = null;
let timer = null;
let timePerQuestion = 30;
let totalQuestions = 5;
let questionsAnswered = 0;
let selectedOption = null;
const API_BASE_URL = 'https://globetrotter-o4m5.onrender.com';
