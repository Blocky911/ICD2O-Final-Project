// ==========================================
// 1. GAME CONFIGURATION & VARIABLES
// ==========================================
const map = document.getElementById('main-map');
const viewport = document.getElementById('viewport');
const player = document.querySelector('.character');
const mudPatches = document.querySelectorAll('.mud-patch');

// Player starting positions (Centered near the house)
let playerX = 2000;
let playerY = 2100;

// Speed variables
const NORMAL_SPEED = 8;
const MUD_SPEED = 3;
let currentSpeed = NORMAL_SPEED;

// Track active keyboard inputs
const keys = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false
};

// ==========================================
// 2. INPUT LISTENERS
// ==========================================
window.addEventListener('keydown', (e) => {
    if (e.key in keys) {
        keys[e.key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key in keys) {
        keys[e.key] = false;
    }
});

// ==========================================
// 3. COLLISION / COLLIDER DETECTIONS
// ==========================================

/**
 * Checks if the player's center point is inside a specific mud patch zone
 */
function checkMudCollision(x, y) {
    // Player dimensions are 120x120, getting center point
    const playerCenterX = x + 60;
    const playerCenterY = y + 60;
    let isSlowing = false;

    mudPatches.forEach(patch => {
        // Parse position and dimensions from inline styles or style sheets
        const patchX = parseInt(patch.style.left);
        const patchY = parseInt(patch.style.top);
        const patchW = parseInt(patch.style.width);
        const patchH = parseInt(patch.style.height);

        // Simple AABB bounding box check for the player center point inside mud
        if (playerCenterX >= patchX && playerCenterX <= (patchX + patchW) &&
            playerCenterY >= patchY && playerCenterY <= (patchY + patchH)) {
            isSlowing = true;
        }
    });

    return isSlowing;
}

// ==========================================
// 4. MAIN GAME LOOP (MOVEMENT & CAMERA)
// ==========================================
function gameLoop() {
    // 1. Check if player is stuck in mud to modify speed attributes
    if (checkMudCollision(playerX, playerY)) {
        currentSpeed = MUD_SPEED;
        player.style.opacity = "0.85"; // Visual cue for stuck in mud
    } else {
        currentSpeed = NORMAL_SPEED;
        player.style.opacity = "1";
    }

    // 2. Process vertical movement & map boundaries (Keep inside 5000x5000 map)
    if (keys.w || keys.ArrowUp) {
        playerY -= currentSpeed;
        if (playerY < 120) playerY = 120; // Blocked by outer border tree lines
    }
    if (keys.s || keys.ArrowDown) {
        playerY += currentSpeed;
        if (playerY > 4760) playerY = 4760;
    }

    // 3. Process horizontal movement & map boundaries
    if (keys.a || keys.ArrowLeft) {
        playerX -= currentSpeed;
        if (playerX < 120) playerX = 120;
    }
    if (keys.d || keys.ArrowRight) {
        playerX += currentSpeed;
        if (playerX > 4760) playerX = 4760;
    }

    // 4. Render updated player position on the CSS map
    player.style.left = playerX + 'px';
    player.style.top = playerY + 'px';

    // 5. Update Camera Scroll Viewport to lock center onto player position
    // Formula: Player position minus half the screen dimensions keeps player dead center
    viewport.scrollLeft = playerX - (window.innerWidth / 2) + 60;
    viewport.scrollTop = playerY - (window.innerHeight / 2) + 60;

    // Run loop smoothly at standard monitor refresh rates (60fps+)
    requestAnimationFrame(gameLoop);
}

// Start the game loop
requestAnimationFrame(gameLoop);