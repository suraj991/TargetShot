// Game state
let gameState = {
    score: 0,
    timeLeft: 30,
    isPlaying: false,
    targets: [],
    targetId: 0,
    spawnInterval: null,
    gameTimer: null
};

// DOM elements
const gameArea = document.getElementById('game-area');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const finalScoreDisplay = document.getElementById('final-score');
const leaderboardList = document.getElementById('leaderboard-list');

// Target types
const targetTypes = ['ufo', 'balloon', 'monster'];

// Initialize game
function init() {
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    gameArea.addEventListener('click', handleGameAreaClick);
    gameArea.addEventListener('touchend', handleGameAreaTouch);
    // Prevent scrolling on mobile
    gameArea.addEventListener('touchstart', (e) => {
        if (gameState.isPlaying) {
            e.preventDefault();
        }
    }, { passive: false });
    loadLeaderboard();
}

// Start the game
function startGame() {
    // Reset game state
    gameState.score = 0;
    gameState.timeLeft = 30;
    gameState.isPlaying = true;
    gameState.targets = [];
    gameState.targetId = 0;
    
    // Hide screens
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    
    // Clear game area
    clearAllTargets();
    
    // Update display
    updateScore();
    updateTimer();
    
    // Start spawning targets
    spawnTarget();
    gameState.spawnInterval = setInterval(spawnTarget, 1500); // Spawn every 1.5 seconds
    
    // Start timer
    gameState.gameTimer = setInterval(() => {
        gameState.timeLeft--;
        updateTimer();
        
        if (gameState.timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

// Spawn a new target
function spawnTarget() {
    if (!gameState.isPlaying) return;
    
    const target = document.createElement('div');
    target.className = `target ${targetTypes[Math.floor(Math.random() * targetTypes.length)]}`;
    target.id = `target-${gameState.targetId++}`;
    
    // Random position (avoid edges)
    const margin = 50;
    const x = margin + Math.random() * (gameArea.offsetWidth - 2 * margin - 80);
    const y = margin + Math.random() * (gameArea.offsetHeight - 2 * margin - 80);
    
    target.style.left = `${x}px`;
    target.style.top = `${y}px`;
    
    // Store target data
    const targetData = {
        element: target,
        id: target.id,
        x: x,
        y: y
    };
    
    gameState.targets.push(targetData);
    gameArea.appendChild(target);
    
    // Auto-remove target after 3 seconds if not hit
    setTimeout(() => {
        removeTarget(targetData.id);
    }, 3000);
}

// Handle click on game area
function handleGameAreaClick(event) {
    if (!gameState.isPlaying) return;
    
    const clickX = event.clientX - gameArea.getBoundingClientRect().left;
    const clickY = event.clientY - gameArea.getBoundingClientRect().top;
    processShot(clickX, clickY);
}

// Handle touch on game area
function handleGameAreaTouch(event) {
    if (!gameState.isPlaying) return;
    
    event.preventDefault();
    
    const touch = event.changedTouches[0];
    const clickX = touch.clientX - gameArea.getBoundingClientRect().left;
    const clickY = touch.clientY - gameArea.getBoundingClientRect().top;
    processShot(clickX, clickY);
}

// Process shot at coordinates
function processShot(clickX, clickY) {
    let hit = false;
    
    // Check if click hit any target
    for (let i = gameState.targets.length - 1; i >= 0; i--) {
        const target = gameState.targets[i];
        const targetElement = target.element;
        const targetRect = targetElement.getBoundingClientRect();
        const gameAreaRect = gameArea.getBoundingClientRect();
        
        const targetX = targetRect.left - gameAreaRect.left;
        const targetY = targetRect.top - gameAreaRect.top;
        const targetWidth = targetRect.width;
        const targetHeight = targetRect.height;
        
        // Check if click is within target bounds
        if (clickX >= targetX && clickX <= targetX + targetWidth &&
            clickY >= targetY && clickY <= targetY + targetHeight) {
            // Hit!
            hitTarget(target.id);
            hit = true;
            break;
        }
    }
    
    // If no target was hit, it's a miss
    if (!hit) {
        handleMiss(clickX, clickY);
    }
}

// Handle target hit
function hitTarget(targetId) {
    const targetIndex = gameState.targets.findIndex(t => t.id === targetId);
    if (targetIndex === -1) return;
    
    const target = gameState.targets[targetIndex];
    const targetElement = target.element;
    
    // Add hit animation
    targetElement.classList.add('hit');
    
    // Show hit indicator
    showIndicator(target.x + 40, target.y + 40, '+1', 'hit');
    
    // Update score
    gameState.score++;
    updateScore();
    
    // Remove target
    setTimeout(() => {
        removeTarget(targetId);
    }, 300);
}

// Handle miss
function handleMiss(x, y) {
    // Show miss indicator
    showIndicator(x, y, '-1', 'miss');
    
    // Update score
    gameState.score = Math.max(0, gameState.score - 1);
    updateScore();
}

// Show hit/miss indicator
function showIndicator(x, y, text, type) {
    const indicator = document.createElement('div');
    indicator.className = type === 'hit' ? 'hit-indicator' : 'miss-indicator';
    indicator.textContent = text;
    indicator.style.left = `${x}px`;
    indicator.style.top = `${y}px`;
    gameArea.appendChild(indicator);
    
    // Remove indicator after animation
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }, 800);
}

// Remove target
function removeTarget(targetId) {
    const targetIndex = gameState.targets.findIndex(t => t.id === targetId);
    if (targetIndex === -1) return;
    
    const target = gameState.targets[targetIndex];
    const targetElement = target.element;
    
    if (targetElement.parentNode) {
        targetElement.parentNode.removeChild(targetElement);
    }
    
    gameState.targets.splice(targetIndex, 1);
}

// Clear all targets
function clearAllTargets() {
    gameState.targets.forEach(target => {
        if (target.element.parentNode) {
            target.element.parentNode.removeChild(target.element);
        }
    });
    gameState.targets = [];
    
    // Also clear any indicators
    const indicators = gameArea.querySelectorAll('.hit-indicator, .miss-indicator');
    indicators.forEach(indicator => {
        if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    });
}

// Update score display
function updateScore() {
    scoreDisplay.textContent = gameState.score;
}

// Update timer display
function updateTimer() {
    timerDisplay.textContent = gameState.timeLeft;
    
    // Add warning style when time is running out
    if (gameState.timeLeft <= 10) {
        timerDisplay.classList.add('timer-warning');
    } else {
        timerDisplay.classList.remove('timer-warning');
    }
}

// End game
function endGame() {
    gameState.isPlaying = false;
    
    // Clear intervals
    if (gameState.spawnInterval) {
        clearInterval(gameState.spawnInterval);
    }
    if (gameState.gameTimer) {
        clearInterval(gameState.gameTimer);
    }
    
    // Clear all targets
    clearAllTargets();
    
    // Save score to leaderboard
    saveScore(gameState.score);
    
    // Show game over screen
    finalScoreDisplay.textContent = gameState.score;
    displayLeaderboard();
    gameOverScreen.style.display = 'flex';
}

// Save score to leaderboard
function saveScore(score) {
    let leaderboard = JSON.parse(localStorage.getItem('targetshot-leaderboard') || '[]');
    
    // Add new score with timestamp
    leaderboard.push({
        score: score,
        date: new Date().toISOString()
    });
    
    // Sort by score (descending)
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Keep only top 10
    leaderboard = leaderboard.slice(0, 10);
    
    // Save to localStorage
    localStorage.setItem('targetshot-leaderboard', JSON.stringify(leaderboard));
}

// Load leaderboard
function loadLeaderboard() {
    displayLeaderboard();
}

// Display leaderboard
function displayLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('targetshot-leaderboard') || '[]');
    
    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = '<p style="opacity: 0.7; text-align: center; padding: 20px;">No scores yet. Be the first!</p>';
        return;
    }
    
    leaderboardList.innerHTML = leaderboard.map((entry, index) => {
        const date = new Date(entry.date);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        
        return `
            <div class="leaderboard-item">
                <div>
                    <span class="leaderboard-rank">${medal}</span>
                    <span>${dateStr}</span>
                </div>
                <span class="leaderboard-score">${entry.score} pts</span>
            </div>
        `;
    }).join('');
}

// Initialize on page load
init();

