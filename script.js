let grid = [];
let score = 0;

function initializeGrid() {
    const gridElement = document.querySelector('.grid');
    gridElement.innerHTML = '';
    grid = Array(4).fill().map(() => Array(4).fill(0));
    
    // Create grid cells
    for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        gridElement.appendChild(cell);
    }
    
    // Add initial tiles
    addNewTile();
    addNewTile();
    updateDisplay();
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
    }
}

function updateDisplay() {
    const cells = document.querySelectorAll('.cell');
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const value = grid[i][j];
            const cell = cells[i * 4 + j];
            cell.textContent = value || '';
            cell.setAttribute('data-value', value);
        }
    }
    document.getElementById('score').textContent = score;
}

function move(direction) {
    // Create a deep copy of the grid to check if anything moved
    const previousGrid = JSON.parse(JSON.stringify(grid));
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
    
    // Add a new tile and update display if something moved
    if (moved) {
        addNewTile();
        updateDisplay();
    }
    
    // Check for game over
    if (isGameOver()) {
        setTimeout(() => {
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
    initializeGrid();
}

// Initialize game
document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        move(e.key);
    }
});

initializeGrid(); 