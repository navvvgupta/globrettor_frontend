// Global variables
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
// DOM elements
const authSection = document.getElementById('auth-section');
const gameSection = document.getElementById('game-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const gamePlayArea = document.getElementById('game-play-area');
const answerFeedback = document.getElementById('answer-feedback');
const clueText = document.getElementById('clue-text');
const optionsContainer = document.getElementById('options-container');
const timerDisplay = document.getElementById('time-left');
const questionCountDisplay = document.getElementById('question-count');
const totalQuestionsDisplay = document.getElementById('total-questions');
const totalScoreDisplay = document.getElementById('total-score');
const correctCountDisplay = document.getElementById('correct-count');
const incorrectCountDisplay = document.getElementById('incorrect-count');
const feedbackTitle = document.getElementById('feedback-title');
const funFactDisplay = document.getElementById('fun-fact');
const pointsEarnedDisplay = document.getElementById('points-earned');

// Helper functions
function showLogin() {
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
}

function showRegister() {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
}

function showChallengeForm() {
    document.getElementById('challenge-form').style.display = 'block';
}

function hideChallengeForm() {
    document.getElementById('challenge-form').style.display = 'none';
}

function startTimer(duration, display, callback) {
    let timer = duration;
    display.textContent = timer;
    
    const interval = setInterval(function () {
        timer--;
        display.textContent = timer;
        
        if (timer <= 0) {
            clearInterval(interval);
            if (callback) callback();
        }
    }, 1000);
    
    return interval;
}

// Auth functions
async function register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
        });
        
        
        const data = await response.text();
        console.log(data);
        if (response.ok) {
            alert('Registration successful! Please login.');
            showLogin();
        } else {
            alert('Registration failed: ' + data);
        }
    } catch (error) {
        alert('Error during registration: ' + error.message);
    }
}

async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
        });
        
        const data = await response.text();
        
        if (response.ok) {
            jwtToken = data;
            currentUser = username;
            authSection.style.display = 'none';
            gameSection.style.display = 'block';
            
            // Store token in localStorage
            localStorage.setItem('jwtToken', jwtToken);
            localStorage.setItem('username', username);
        } else {
            alert('Login failed: ' + data);
        }
    } catch (error) {
        alert('Error during login: ' + error.message);
    }
}

async function logout() {
    try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });
        
        // Clear session
        jwtToken = null;
        currentUser = null;
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('username');
        
        // Reset UI
        gameSection.style.display = 'none';
        gamePlayArea.style.display = 'none';
        authSection.style.display = 'block';
        showLogin();
    } catch (error) {
        alert('Error during logout: ' + error.message);
    }
}

async function startGame() {
    try {
        // Get values from input fields
        totalQuestions = parseInt(document.getElementById('total-questions-input').value);
        timePerQuestion = parseInt(document.getElementById('time-per-question-input').value);
        
        // Validate inputs (with fixed parentheses)
        if (isNaN(totalQuestions)) {
            totalQuestions = 5;
            document.getElementById('total-questions-input').value = 5;
        }
        
        if (isNaN(timePerQuestion)) {
            timePerQuestion = 30;
            document.getElementById('time-per-question-input').value = 30;
        }
        
        // Rest of your function remains the same...
        // Ensure values are within allowed range
        totalQuestions = Math.max(1, Math.min(20, totalQuestions));
        timePerQuestion = Math.max(10, Math.min(120, timePerQuestion));
        
        const response = await fetch(`${API_BASE_URL}/game/start?userId=1&totalQuestions=${totalQuestions}&timePerQuestion=${timePerQuestion}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });
        
        if (response.ok) {
            gameSessionId = await response.text();
            gamePlayArea.style.display = 'block';
            document.getElementById('game-settings').style.display = 'none';
            questionsAnswered = 0;
            
            // Update UI with the selected values
            questionCountDisplay.textContent = '0';
            totalQuestionsDisplay.textContent = totalQuestions;
            totalScoreDisplay.textContent = '0';
            correctCountDisplay.textContent = '0';
            incorrectCountDisplay.textContent = '0';
            
            // Start first question
            nextQuestion();
        } else {
            alert('Failed to start game: ' + await response.text());
        }
    } catch (error) {
        alert('Error starting game: ' + error.message);
        console.error('Error starting game:', error);
    }
}

async function nextQuestion() {
    answerFeedback.style.display = 'none';
    questionsAnswered++;
    
    if (questionsAnswered > totalQuestions) {
        endGame();
        return;
    }
    
    questionCountDisplay.textContent = questionsAnswered;
    
    try {
        const response = await fetch(`${API_BASE_URL}/game/question/next`, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });
        
        if (response.ok) {
            currentQuestion = await response.json();
            
            // Display question
            clueText.textContent = currentQuestion.clue;
            
            // Display options
            optionsContainer.innerHTML = '';
            currentQuestion.options.forEach(option => {
                const button = document.createElement('button');
                button.className = 'option-btn';
                button.textContent = option;
                button.onclick = function() {
                    // Remove selected class from all options
                    document.querySelectorAll('.option-btn').forEach(btn => {
                        btn.classList.remove('selected');
                    });
                    
                    // Add selected class to clicked option
                    button.classList.add('selected');
                    selectedOption = option;
                    document.getElementById('submit-answer-btn').disabled = false;
                };
                optionsContainer.appendChild(button);
            });
            
            // Reset submit button
            document.getElementById('submit-answer-btn').disabled = true;
            
            // Start timer
            if (timer) clearInterval(timer);
            timer = startTimer(timePerQuestion, timerDisplay, function() {
                // Time's up, auto-submit
                if (selectedOption) {
                    submitAnswer();
                } else {
                    // No answer selected, submit empty
                    submitAnswer(true);
                }
            });
        } else {
            alert('Failed to get next question');
        }
    } catch (error) {
        alert('Error getting next question: ' + error.message);
    }
}

async function getClue() {
    if (!currentQuestion) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/game/question/clue?questionId=${currentQuestion.questionId}&clueLevel=${currentQuestion.clueLevel + 1}&sessionId=${gameSessionId}`, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });
        
        if (response.ok) {
            const newClue = await response.text();
            currentQuestion.clue = newClue;
            currentQuestion.clueLevel++;
            clueText.textContent = newClue;
        } else {
            alert('Failed to get clue');
        }
    } catch (error) {
        alert('Error getting clue: ' + error.message);
    }
}

async function submitAnswer(timeout = false) {
    if (!currentQuestion || (!selectedOption && !timeout)) return;
    
    if (timer) clearInterval(timer);
    
    const timeTaken = timeout ? timePerQuestion : timePerQuestion - parseInt(timerDisplay.textContent);
    
    try {
        const response = await fetch(`${API_BASE_URL}/game/question/answer?sessionId=${gameSessionId}&questionId=${currentQuestion.questionId}&selectedCity=${encodeURIComponent(selectedOption || '')}&timeTaken=${timeTaken}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // Display feedback
            answerFeedback.style.display = 'block';
            answerFeedback.className = result.correct ? 'correct' : 'incorrect';
            feedbackTitle.textContent = result.correct ? '✅ Correct Answer!' : '❌ Incorrect Answer';
            funFactDisplay.textContent = result.funFacts.join(' ');
            pointsEarnedDisplay.textContent = `Points earned: ${result.pointsEarned}`;
            
            // Update scores
            totalScoreDisplay.textContent = result.totalScore;
            correctCountDisplay.textContent = result.correctCount;
            incorrectCountDisplay.textContent = result.incorrectCount;
            
            // Reset for next question
            selectedOption = null;
        } else {
            alert('Failed to submit answer');
        }
    } catch (error) {
        alert('Error submitting answer: ' + error.message);
    }
}

async function endGame() {
    try {
        await fetch(`${API_BASE_URL}/game/end/${gameSessionId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });
        
        // Reset game state
        gamePlayArea.style.display = 'none';
        document.getElementById('start-game-btn').style.display = 'block';
        answerFeedback.style.display = 'none';
    } catch (error) {
        alert('Error ending game: ' + error.message);
    }
}

async function createChallenge() {
    const friendUsername = document.getElementById('friend-username').value;
    const totalQuestions = parseInt(document.getElementById('challenge-total-questions').value);
    const timePerQuestion = parseInt(document.getElementById('challenge-time-per-question').value);

    // Validate inputs
    if (!friendUsername) {
        alert('Please enter your friend\'s username');
        return;
    }

    if (isNaN(totalQuestions)) {  // Added missing closing parenthesis here
        alert('Please enter a valid number of questions');
        return;
    }

    if (isNaN(timePerQuestion)) {
        alert('Please enter valid time per question');
        return;
    }

    try {
        // Show loading state
        const challengeBtn = document.querySelector('#challenge-form button[onclick="createChallenge()"]');
        challengeBtn.disabled = true;
        challengeBtn.textContent = 'Creating...';

        const response = await fetch(`${API_BASE_URL}/game/challenge?inviterUsername=${currentUser}&inviteeUsername=${friendUsername}&totalQuestions=${totalQuestions}&timePerQuestion=${timePerQuestion}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });

        if (response.ok) {
            const challengeCode = await response.text();
            
            // Create shareable link
            const challengeLink = `${window.location.origin}${window.location.pathname}?challenge=${challengeCode}`;
            
            // Show success message with challenge code
            alert(`Challenge created successfully!\n\nChallenge Code: ${challengeCode}\n\nShare this link with your friend:\n${challengeLink}`);
            
            // Hide the challenge form
            hideChallengeForm();
        } else {
            const error = await response.text();
            alert('Failed to create challenge: ' + error);
        }
    } catch (error) {
        alert('Error creating challenge: ' + error.message);
        console.error('Challenge creation error:', error);
    } finally {
        // Reset button state
        const challengeBtn = document.querySelector('#challenge-form button[onclick="createChallenge()"]');
        if (challengeBtn) {
            challengeBtn.disabled = false;
            challengeBtn.textContent = 'Send Challenge';
        }
    }
}

let currentChallenge = null;

async function acceptChallenge() {
    if (!jwtToken) {
        alert('Please login first');
        return;
    }

    const challengeCode = prompt("Enter the challenge code you received:");
    if (!challengeCode) return;

    try {
        const acceptBtn = document.getElementById('accept-challenge-btn');
        acceptBtn.disabled = true;
        acceptBtn.textContent = 'Accepting...';

        const response = await fetch(`${API_BASE_URL}/game/challenge/accept?challengeCode=${encodeURIComponent(challengeCode)}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("Hi");
        
        const result = await response.json();

        console.log(result);
        
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to accept challenge');
        }

        // Store challenge configuration
        currentChallenge = {
            code: challengeCode,
            totalQuestions: result.totalQuestions,
            timePerQuestion: result.timeLimitPerQuestion
        };

        // Update UI
        document.getElementById('challenge-questions').textContent = result.totalQuestions;
        document.getElementById('challenge-time').textContent = result.timeLimitPerQuestion;
        document.getElementById('challenge-info').style.display = 'block';

        // Start game
        await startChallengeGame(result.totalQuestions, result.timeLimitPerQuestion);
        
    } catch (error) {
        alert('Error accepting challenge: ' + error.message);
        console.error('Challenge acceptance error:', error);
    } finally {
        const acceptBtn = document.getElementById('accept-challenge-btn');
        if (acceptBtn) {
            acceptBtn.disabled = false;
            acceptBtn.textContent = 'Accept Challenge';
        }
    }
}

async function startChallengeGame(totalQuestions, timePerQuestion) {
    try {
        // Start game session with challenge settings
        const response = await fetch(`${API_BASE_URL}/game/start?userId=1&totalQuestions=${totalQuestions}&timePerQuestion=${timePerQuestion}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        gameSessionId = await response.text();
        
        // Hide settings, show game area
        document.getElementById('game-settings').style.display = 'none';
        gamePlayArea.style.display = 'block';
        questionsAnswered = 0;
        
        // Update UI with challenge settings
        totalQuestionsDisplay.textContent = totalQuestions;
        totalScoreDisplay.textContent = '0';
        correctCountDisplay.textContent = '0';
        incorrectCountDisplay.textContent = '0';
        
        // Start first question
        nextQuestion();
    } catch (error) {
        alert('Error starting challenge game: ' + error.message);
        console.error('Challenge game start error:', error);
    }
}

// Add these functions to your app.js

function showGameHistory() {
    if (!currentUser) {
        alert('Please login to view your game history');
        return;
    }
    
    fetchGameHistory();
    document.getElementById('history-modal').style.display = 'block';
}

function closeHistoryModal() {
    document.getElementById('history-modal').style.display = 'none';
}

async function fetchGameHistory() {
    try {
        // Get user ID - in a real app, you'd get this from your user object
        // For now, we'll assume userId=1 as in your other endpoints
        const userId = 1;
        
        const response = await fetch(`${API_BASE_URL}/game/history/${userId}`, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });
        
        if (response.ok) {
            const history = await response.json();
            displayGameHistory(history);
        } else {
            throw new Error('Failed to fetch game history');
        }
    } catch (error) {
        console.error('Error fetching game history:', error);
        document.getElementById('history-results').innerHTML = 
            '<p>Error loading game history. Please try again.</p>';
    }
}

function displayGameHistory(history) {
    const historyContainer = document.getElementById('history-results');
    
    if (history.length === 0) {
        historyContainer.innerHTML = '<p>No game history available.</p>';
        return;
    }
    
    let html = '';
    history.forEach(game => {
        const date = new Date(game.playedAt).toLocaleString();
        html += `
            <div class="game-history-item">
                <h4>Game on ${date}</h4>
                <p><strong>Score:</strong> ${game.score}</p>
                <p><strong>Correct Answers:</strong> ${game.correctAnswers}</p>
                <p><strong>Incorrect Answers:</strong> ${game.incorrectAnswers}</p>
            </div>
        `;
    });
    
    // Add total games count
    fetchTotalGamesCount().then(count => {
        html += `<p><strong>Total Games Played:</strong> ${count}</p>`;
        historyContainer.innerHTML = html;
    });
}

async function fetchTotalGamesCount() {
    try {
        const userId = 1; // Again, use actual user ID in real app
        const response = await fetch(`${API_BASE_URL}/game/history/${userId}/count`, {
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });
        
        if (response.ok) {
            return await response.text();
        }
        return 'N/A';
    } catch (error) {
        console.error('Error fetching total games count:', error);
        return 'N/A';
    }
}

// Helper function to show modal
function showModal(title, content) {
    const modal = document.getElementById('results-modal');
    document.getElementById('results-content').innerHTML = `
        <h3>${title}</h3>
        <p>${content}</p>
    `;
    modal.style.display = 'block';
}

// Helper function to close modal
function closeModal() {
    document.getElementById('results-modal').style.display = 'none';
}

// Initialize app
function init() {
    // Check if user is already logged in
    const storedToken = localStorage.getItem('jwtToken');
    const storedUsername = localStorage.getItem('username');
    
    if (storedToken && storedUsername) {
        jwtToken = storedToken;
        currentUser = storedUsername;
        authSection.style.display = 'none';
        gameSection.style.display = 'block';
    }

    const urlParams = new URLSearchParams(window.location.search);
    const challengeCode = urlParams.get('challenge');
    
    if (challengeCode) {
        // Remove challenge from URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Show accept challenge dialog
        setTimeout(() => {
            if (confirm(`You've been invited to a challenge! Accept now?`)) {
                acceptChallenge(challengeCode);
            }
        }, 500);
    }
    window.onclick = function(event) {
    const modal = document.getElementById('history-modal');
    if (event.target == modal) {
        closeHistoryModal();
    }
};
}

// Initialize when page loads
window.onload = init;