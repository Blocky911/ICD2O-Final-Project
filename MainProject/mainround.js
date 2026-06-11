// ==========================================
// 1. GAME CONFIGURATION & VARIABLES
// ==========================================
const map = document.getElementById('main-map');
const viewport = document.getElementById('viewport');
const player = document.querySelector('.character');
const mudPatches = document.querySelectorAll('.mud-patch');
const treeContainer = document.getElementById('tree-container');
const mapSize = 5000;

// Reads chosen difficulty query sent from difficulty selection page
const urlParams = new URLSearchParams(window.location.search);
const chosenDifficulty = urlParams.get('diff') || 'medium'; // Falls back to medium 

// Baseline movement constants adjusted dynamically by difficulty matrix selection
let NORMAL_SPEED = 8;
let MUD_SPEED = 3;

if (chosenDifficulty === 'easy') {
    NORMAL_SPEED = 11; // Increased user velocity rules
    MUD_SPEED = 5;
} else if (chosenDifficulty === 'hard') {
    NORMAL_SPEED = 6;  // Sluggish baseline speeds for high constraint gaming
    MUD_SPEED = 2;
}

let currentSpeed = NORMAL_SPEED;

// Starting character frame offset calculations
let playerX = 2000;
let playerY = 2100;

// Dynamic keyboard configuration registers
const keys = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false
};

// ==========================================
// 2. PROCEDURAL GENERATION SETUP
// ==========================================
function createTree(x, y, className) {
    const tree = document.createElement('div');
    tree.className = className;
    tree.style.left = x + 'px';
    tree.style.top = y + 'px';
    treeContainer.appendChild(tree);
}

// Generate outer defensive barrier tree blocks
for (let i = 0; i < mapSize; i += 100) {
    createTree(i, 0, 'border-tree'); 
    createTree(i, mapSize - 120, 'border-tree'); 
    createTree(0, i, 'border-tree'); 
    createTree(mapSize - 120, i, 'border-tree'); 
}

// Generate inner randomized environment maps safely out of starting area bounds
for (let i = 0; i < 60; i++) {
    let randX = Math.floor(Math.random() * (mapSize - 400)) + 200;
    let randY = Math.floor(Math.random() * (mapSize - 400)) + 200;
    
    // Boundary lock ensures trees skip rendering right over spawning structure blocks
    if (!(randX > 1900 && randX < 2700 && randY > 1900 && randY < 2700)) {
        createTree(randX, randY, 'map-tree');
    }
}

// ==========================================
// 3. INPUT HANDLING LISTENERS
// ==========================================
window.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
});

// Click and Drag Manual Camera Scrolling Layout Override Logic
let isDown = false;
let startX, startY, scrollLeft, scrollTop;

// Set default fallback anchor points
viewport.scrollLeft = 1950;
viewport.scrollTop = 1950;

viewport.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - viewport.offsetLeft;
    startY = e.pageY - viewport.offsetTop;
    scrollLeft = viewport.scrollLeft;
    scrollTop = viewport.scrollTop;
});
viewport.addEventListener('mouseleave', () => { isDown = false; });
viewport.addEventListener('mouseup', () => { isDown = false; });
viewport.addEventListener('mousemove', (e) => {
    if(!isDown) return;
    e.preventDefault();
    const x = e.pageX - viewport.offsetLeft;
    const y = e.pageY - viewport.offsetTop;
    const walkX = (x - startX) * 1.5;
    const walkY = (y - startY) * 1.5;
    viewport.scrollLeft = scrollLeft - walkX;
    viewport.scrollTop = scrollTop - walkY;
});

// ==========================================
// 4. MUD TRAP INTERACTION LOGIC
// ==========================================
function checkMudCollision(x, y) {
    const playerCenterX = x + 60;
    const playerCenterY = y + 60;
    let isSlowing = false;

    mudPatches.forEach(patch => {
        const patchX = parseInt(patch.style.left);
        const patchY = parseInt(patch.style.top);
        const patchW = parseInt(patch.style.width);
        const patchH = parseInt(patch.style.height);

        if (playerCenterX >= patchX && playerCenterX <= (patchX + patchW) &&
            playerCenterY >= patchY && playerCenterY <= (patchY + patchH)) {
            isSlowing = true;
        }
    });
    return isSlowing;
}

// ==========================================
// 5. RENDERING PIPELINE ENGINE LOOP
// ==========================================
function gameLoop() {
    // 1. Evaluate environmental status modifier conditions
    if (checkMudCollision(playerX, playerY)) {
        currentSpeed = MUD_SPEED;
        player.style.opacity = "0.85"; 
    } else {
        currentSpeed = NORMAL_SPEED;
        player.style.opacity = "1";
    }

    // 2. Map layout control processing with boundary checks
    if (keys.w || keys.ArrowUp) {
        playerY -= currentSpeed;
        if (playerY < 120) playerY = 120; 
    }
    if (keys.s || keys.ArrowDown) {
        playerY += currentSpeed;
        if (playerY > 4760) playerY = 4760;
    }
    if (keys.a || keys.ArrowLeft) {
        playerX -= currentSpeed;
        if (playerX < 120) playerX = 120;
    }
    if (keys.d || keys.ArrowRight) {
        playerX += currentSpeed;
        if (playerX > 4760) playerX = 4760;
    }

    // 3. Render tracking calculations
    player.style.left = playerX + 'px';
    player.style.top = playerY + 'px';

    // 4. Camera target node position updates (Centers window over the character)
    viewport.scrollLeft = playerX - (window.innerWidth / 2) + 60;
    viewport.scrollTop = playerY - (window.innerHeight / 2) + 60;

    requestAnimationFrame(gameLoop);
}

// Initialize calculating game context cycles
requestAnimationFrame(gameLoop);