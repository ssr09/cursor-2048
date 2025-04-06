let grid = [];
let score = 0;
let isSoundEnabled = true;
let undoStates = [];
let undosRemaining = 3;
let audioInitialized = false;

// Update the sounds object with more pleasant sound effects
const sounds = {
    // Soft click sound for movement
    move: new Audio('https://assets.mixkit.co/active_storage/sfx/2945/2945-preview.mp3'),
    // Pleasant pop sound for merging
    merge: new Audio(),
    // Gentle chord for game over
    gameOver: new Audio('https://assets.mixkit.co/active_storage/sfx/213/213-preview.mp3'),
    // Add new startup sound - a pleasant chime
    startup: new Audio('https://assets.mixkit.co/active_storage/sfx/2920/2920-preview.mp3')
};

// Add volume adjustment to make sounds more subtle
Object.values(sounds).forEach(sound => {
    sound.volume = 0.3; // Reduce volume to 30%
});

function initializeGrid(playStartup = false) {
    const gridElement = document.querySelector('.grid');
    gridElement.innerHTML = '';
    grid = Array(4).fill().map(() => Array(4).fill(0));
    
    // Create grid cells
    for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        gridElement.appendChild(cell);
    }
    
    // Play startup sound only if explicitly requested
    if (playStartup && isSoundEnabled) {
        playSound('startup');
    }
    
    // Add initial tiles with a slight delay for the sound to be heard
    setTimeout(() => {
        addNewTile();
        addNewTile();
        updateDisplay();
    }, 200);
}

function addNewTile() {
    const emptyCells = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (grid[i][j] === 0) {
                emptyCells.push({x: i, y: j});
            }
        }
    }
    
    if (emptyCells.length > 0) {
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        grid[randomCell.x][randomCell.y] = Math.random() < 0.9 ? 2 : 4;
        
        // Add animation class to new tile
        const cells = document.querySelectorAll('.cell');
        const cell = cells[randomCell.x * 4 + randomCell.y];
        cell.classList.add('cell-new');
        setTimeout(() => cell.classList.remove('cell-new'), 200);
    }
}

function updateDisplay() {
    const cells = document.querySelectorAll('.cell');
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const value = grid[i][j];
            const cell = cells[i * 4 + j];
            const previousValue = cell.getAttribute('data-value');
            
            cell.textContent = value || '';
            cell.setAttribute('data-value', value);
            
            // Add merge animation if value doubled
            if (value && previousValue && value === 2 * parseInt(previousValue)) {
                cell.classList.add('cell-merged');
                playSound('merge');
                setTimeout(() => cell.classList.remove('cell-merged'), 200);
            }
        }
    }
    document.getElementById('score').textContent = score;
}

function move(direction) {
    const previousGrid = JSON.parse(JSON.stringify(grid));
    saveState();
    let moved = false;
    
    // Helper function to handle a single row or column
    function handleLine(line, reverse) {
        // Remove zeros and optionally reverse
        let nonZeros = line.filter(val => val !== 0);
        if (reverse) nonZeros.reverse();
        
        // Merge adjacent equal values
        for (let i = 0; i < nonZeros.length - 1; i++) {
            if (nonZeros[i] === nonZeros[i + 1]) {
                nonZeros[i] *= 2;
                score += nonZeros[i];
                nonZeros.splice(i + 1, 1);
            }
        }
        
        // Pad with zeros
        while (nonZeros.length < 4) {
            nonZeros.push(0);
        }
        
        // Reverse back if needed
        if (reverse) nonZeros.reverse();
        
        return nonZeros;
    }
    
    // Process rows (left/right)
    if (direction === 'ArrowLeft' || direction === 'ArrowRight') {
        const reverse = direction === 'ArrowRight';
        
        for (let i = 0; i < 4; i++) {
            grid[i] = handleLine([...grid[i]], reverse);
        }
    }
    // Process columns (up/down)
    else if (direction === 'ArrowUp' || direction === 'ArrowDown') {
        const reverse = direction === 'ArrowDown';
        
        for (let j = 0; j < 4; j++) {
            const column = grid.map(row => row[j]);
            const newColumn = handleLine(column, reverse);
            
            // Update the grid with the new column values
            for (let i = 0; i < 4; i++) {
                grid[i][j] = newColumn[i];
            }
        }
    }
    
    // Check if the grid changed
    moved = JSON.stringify(previousGrid) !== JSON.stringify(grid);
    
    // After movement logic, add these changes:
    if (moved) {
        playSound('move');
        addNewTile();
        updateDisplay();
    }
    
    if (isGameOver()) {
        setTimeout(() => {
            playSound('gameOver');
            alert('Game Over! Your score: ' + score);
        }, 100);
    }
}

function isGameOver() {
    // Check for empty cells
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (grid[i][j] === 0) return false;
        }
    }

    // Check for possible merges
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
            if (grid[i][j] === grid[i][j + 1]) return false;
        }
    }
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
            if (grid[i][j] === grid[i + 1][j]) return false;
        }
    }

    return true;
}

function resetGame() {
    score = 0;
    undoStates = [];
    undosRemaining = 3;
    const undoButton = document.getElementById('undoButton');
    undoButton.textContent = `Undo (${undosRemaining})`;
    undoButton.disabled = false;
    initializeGrid(true);
}

// Add undo functionality
function saveState() {
    if (undosRemaining > 0) {
        undoStates.push({
            grid: JSON.parse(JSON.stringify(grid)),
            score: score
        });
    }
}

function undo() {
    if (undosRemaining > 0 && undoStates.length > 0) {
        const previousState = undoStates.pop();
        grid = previousState.grid;
        score = previousState.score;
        undosRemaining--;
        
        // Update undo button count
        const undoCount = document.getElementById('undoCount');
        undoCount.textContent = undosRemaining;
        
        if (undosRemaining === 0) {
            const undoButton = document.getElementById('undoButton');
            undoButton.disabled = true;
        }
        
        updateDisplay();
    }
}

// Sound control functions
function toggleSound() {
    isSoundEnabled = !isSoundEnabled;
    const soundButton = document.getElementById('soundToggle');
    
    // Use a data attribute for CSS styling
    soundButton.setAttribute('data-sound-enabled', isSoundEnabled);
    
    // No need to change text content as we're using separate spans
}

function initializeAudio() {
    if (!audioInitialized) {
        // Create a context if possible
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            const audioCtx = new AudioContext();
            // Just creating the context is enough to enable audio
        }
        
        // Load sounds explicitly (needed for iOS)
        Object.values(sounds).forEach(sound => {
            // A tiny silent sound
            sound.play().then(() => {
                sound.pause();
                sound.currentTime = 0;
            }).catch(e => {
                // Ignore errors - this is just a warm-up
            });
        });
        
        audioInitialized = true;
    }
}

function playSound(soundName) {
    if (isSoundEnabled && sounds[soundName]) {
        // Try to initialize audio first
        initializeAudio();
        
        // Now try to play the sound
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(e => {
            // Silently catch errors, as sound is not critical
            console.log("Unable to play sound: " + soundName);
        });
    }
}

// Variables to track if we're currently handling a grid touch
let touchInProgress = false;

// Function to prevent page scrolling during grid interaction
function preventScroll(e) {
    if (touchInProgress) {
        e.preventDefault();
    }
}

// Add a global touch handler to prevent scrolling during grid touches
document.addEventListener('touchmove', preventScroll, { passive: false });

// Add touch controls for mobile
const gridElement = document.querySelector('.grid');

gridElement.addEventListener('touchstart', function(e) {
    touchInProgress = true;
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    e.preventDefault();
    e.stopPropagation();
}, { passive: false });

gridElement.addEventListener('touchmove', function(e) {
    if (touchInProgress) {
        e.preventDefault();
        e.stopPropagation();
    }
}, { passive: false });

gridElement.addEventListener('touchend', function(e) {
    if (touchInProgress) {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
        e.preventDefault();
        e.stopPropagation();
        touchInProgress = false;
    }
}, { passive: false });

gridElement.addEventListener('touchcancel', function(e) {
    touchInProgress = false;
}, { passive: false });

function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Minimum distance for a swipe
    const minSwipeDistance = 30;
    
    // Determine if horizontal or vertical swipe
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                move('ArrowRight');
            } else {
                move('ArrowLeft');
            }
        }
    } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0) {
                move('ArrowDown');
            } else {
                move('ArrowUp');
            }
        }
    }
}

// Modify the initialization at the bottom of the file
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the game with a slight delay, but don't play startup sound here
    setTimeout(() => {
        initializeGrid(false); // Pass false here to prevent startup sound on initial load
    }, 200);
    
    // Add keyboard event listener
    document.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            move(e.key);
        }
    });
    
    // Add these event listeners for first interaction
    document.addEventListener('click', initializeAudio, { once: true });
    document.addEventListener('touchstart', initializeAudio, { once: true });
    
    // Initialize sound button state when page loads
    const soundButton = document.getElementById('soundToggle');
    soundButton.setAttribute('data-sound-enabled', isSoundEnabled);
}); 