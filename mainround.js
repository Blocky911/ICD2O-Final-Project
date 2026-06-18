// ==========================================
// 1. GAME CONFIGURATION & VARIABLES
// ==========================================
const map = document.getElementById('main-map');
const viewport = document.getElementById('viewport');
const player = document.querySelector('.character');
const mudPatches = document.querySelectorAll('.mud-patch');
const treeContainer = document.getElementById('tree-container');

// Player starting positions
let playerX = 1900;
let playerY = 1900;
const playerSize = 50; 
const playerOffset = 35;
let gameActive = false;

// Speed variables
const NORMAL_SPEED = 8;
const MUD_SPEED = 3;
let currentSpeed = NORMAL_SPEED;

// Track active keyboard inputs
const keys = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false
};
let obstacles = [];
const mapSize = 5000;

// ==========================================
// 1b. 8x8 SPRITESHEET MATRIX SELECTIONS
// ==========================================
const SKIN_ROW_MAPPING = {
    'skin_default_red': 0, // Red
    'bot_default_blue': 1, // Blue
    'skin_nugget': 2,      // Nugget
    'bot_evil': 3,         // Evil Nugget
    'skin_george': 4,      // George the monkey
    'bot_mcrae': 5,        // Mr. Mcrae
    'skin_john': 6,        // John Pork
    'bot_stealer': 7       // Food stealer
};

const SPRITE_COLUMNS = {
    FRONT: 0, FRONT_WALK: 1,
    RIGHT: 4, RIGHT_WALK: 5,
    LEFT: 2,  LEFT_WALK: 3,
    BACK: 6,  BACK_WALK: 7
};

// Retrieve matching keys updated via inventory engine
const equippedItems = JSON.parse(localStorage.getItem('equippedItems')) || {
    playerSkin: 'skin_default_red',
    botSkin: 'bot_default_blue'
};

let currentDirectionCol = SPRITE_COLUMNS.FRONT;
let isWalkingFrame = false;
let animationToggleTimer = 0;

// Establish persistent active player matrix row index
const playerRowIndex = SKIN_ROW_MAPPING[equippedItems.playerSkin] ?? 0;

// Updates positioning coordinates directly on the DOM
function updateCharacterSpriteFrame() {
    if (!player) return;
    const xOffset = currentDirectionCol * -120;
    const yOffset = playerRowIndex * -120;
    player.style.backgroundPosition = `${xOffset}px ${yOffset}px`;
}

// Perform initial render call to display the character immediately
updateCharacterSpriteFrame();

// ==========================================
// 2. INPUT LISTENERS
// ==========================================
window.addEventListener('keydown', (e) => { if (e.key in keys) keys[e.key] = true; });
window.addEventListener('keyup', (e) => { if (e.key in keys) keys[e.key] = false; });

// ==========================================
// 3. COLLISION / COLLIDER DETECTIONS
// ==========================================
function populateMapEnvironment() {
    for (let i = 0; i < mapSize; i += 100) {
        createTreeObstacle(i, 0, 'border-tree');
        createTreeObstacle(i, mapSize - 130, 'border-tree'); 
        createTreeObstacle(0, i, 'border-tree'); 
        createTreeObstacle(mapSize - 130, i, 'border-tree');
    }
    
    for (let i = 0; i < 120; i++) {
        let randX = Math.floor(Math.random() * (mapSize - 450)) + 220;
        let randY = Math.floor(Math.random() * (mapSize - 450)) + 220;

        const insidePoolZone = (randX > 1200 && randX < 2100 && randY > 2300 && randY < 3050);
        const insideHouseZone = (randX > 1950 && randX < 3450 && randY > 1550 && randY < 3050);
        const insideHedgeZone = (randX > 2500 && randY < 2500);
        const insideSpawnZone = (randX > 1750 && randX < 2050 && randY > 1750 && randY < 2050);

        if (!insidePoolZone && !insideHouseZone && !insideHedgeZone && !insideSpawnZone) {
            createTreeObstacle(randX, randY, 'map-tree');
        }
    }
}

function createTreeObstacle(x, y, className) {
    const tree = document.createElement('div');
    tree.className = className;
    tree.style.left = x + 'px';
    tree.style.top = y + 'px';
    treeContainer.appendChild(tree);
    const radius = className === 'border-tree' ? 65 : 75;
    obstacles.push({ type: 'circle', x: x + radius, y: y + radius, radius: radius - 22 });
}

function initializeObstacleMatrix() {
    obstacles.push({ type: 'rect', x: 2100, y: 1700, w: 360, h: 800 });
    obstacles.push({ type: 'rect', x: 2460, y: 1700, w: 440, h: 360 });
    obstacles.push({ type: 'rect', x: 1400, y: 2500, w: 500, h: 350, isPoolWater: true });
    
    obstacles.push({ type: 'rect', x: 3500, y: 250,  w: 1250, h: 130 });
    obstacles.push({ type: 'rect', x: 4620, y: 380,  w: 130,  h: 950 });
    obstacles.push({ type: 'rect', x: 3850, y: 600,  w: 450,  h: 110 });
    obstacles.push({ type: 'rect', x: 3500, y: 950,  w: 800,  h: 120 });
    obstacles.push({ type: 'rect', x: 4200, y: 1200, w: 150,  h: 1100 });
    obstacles.push({ type: 'rect', x: 3400, y: 1500, w: 500,  h: 140 });
    obstacles.push({ type: 'rect', x: 3000, y: 1800, w: 150,  h: 900 });
    obstacles.push({ type: 'rect', x: 2600, y: 200,  w: 700,  h: 140 });
    obstacles.push({ type: 'rect', x: 2800, y: 500,  w: 140,  h: 600 });

    document.querySelectorAll('.rock').forEach(rock => {
        obstacles.push({
            type: 'rect',
            x: parseInt(rock.style.left), y: parseInt(rock.style.top),
            w: parseInt(rock.style.width), h: parseInt(rock.style.height)
        });
    });
}

function checkMudCollision(x, y) {
    const px = x + 60, py = y + 60;
    let insideMud = false;
    mudPatches.forEach(patch => {
        const mx = parseInt(patch.style.left), my = parseInt(patch.style.top);
        const mw = parseInt(patch.style.width), mh = parseInt(patch.style.height);
        if (px >= mx && px <= (mx + mw) && py >= my && py <= (my + mh)) insideMud = true;
    });
    return insideMud;
}

function checkWalkboardPlatformSafety(x, y) {
    const px = x + playerOffset + (playerSize / 2), py = y + playerOffset + (playerSize / 2);
    const mats = [
        { x: 1430, y: 2640, w: 110, h: 65 },
        { x: 1590, y: 2640, w: 110, h: 65 },
        { x: 1750, y: 2640, w: 110, h: 65 }
    ];
    return mats.some(m => px >= m.x && px <= (m.x + m.w) && py >= m.y && py <= (m.y + m.h));
}

function processEnvironmentIntersection(targetX, targetY) {
    const px = targetX + playerOffset, py = targetY + playerOffset;
    const pw = playerSize, ph = playerSize;
    const pCenterX = px + pw / 2, pCenterY = py + ph / 2;
    if (px < 130 || px + pw > 4870 || py < 130 || py + ph > 4870) return true;
    for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        if (obs.type === 'rect') {
            if (obs.isPoolWater && checkWalkboardPlatformSafety(targetX, targetY)) continue;
            if (px < obs.x + obs.w && px + pw > obs.x && py < obs.y + obs.h && py + ph > obs.y) return true;
        } else if (obs.type === 'circle') {
            const distX = pCenterX - obs.x, distY = pCenterY - obs.y;
            if (Math.sqrt(distX * distX + distY * distY) < (pw / 2) + obs.radius) return true;
        }
    }
    return false;
}

// ==========================================
// 4. MAIN GAME LOOP (MOVEMENT & CAMERA)
// ==========================================
function coreExecutionEngine() {
    if (!gameActive) return;
    
    if (checkMudCollision(playerX, playerY)) {
        currentSpeed = MUD_SPEED;
        player.style.filter = "sepia(0.6) brightness(0.75)";
    } else {
        currentSpeed = NORMAL_SPEED;
        player.style.filter = "none";
    }

    let nextX = playerX, nextY = playerY;
    let isMoving = false;
    let targetDirectionCol = currentDirectionCol;

    // Movement direction input calculation loops
    if (keys.w || keys.ArrowUp) {
        nextY -= currentSpeed;
        targetDirectionCol = SPRITE_COLUMNS.BACK;
        isMoving = true;
    } else if (keys.s || keys.ArrowDown) {
        nextY += currentSpeed;
        targetDirectionCol = SPRITE_COLUMNS.FRONT;
        isMoving = true;
    }

    if (keys.a || keys.ArrowLeft) {
        nextX -= currentSpeed;
        targetDirectionCol = SPRITE_COLUMNS.LEFT;
        isMoving = true;
    } else if (keys.d || keys.ArrowRight) {
        nextX += currentSpeed;
        targetDirectionCol = SPRITE_COLUMNS.RIGHT;
        isMoving = true;
    }

    // Process continuous run animation toggle parameters
    if (isMoving) {
        animationToggleTimer++;
        if (animationToggleTimer >= 10) { 
            isWalkingFrame = !isWalkingFrame;
            animationToggleTimer = 0;
        }
        currentDirectionCol = isWalkingFrame ? (targetDirectionCol + 1) : targetDirectionCol;
    } else {
        // Fall back onto baseline resting directional poses instantly when player stops
        if (currentDirectionCol % 2 !== 0) {
            currentDirectionCol -= 1;
        }
        animationToggleTimer = 0;
    }

    if (!processEnvironmentIntersection(nextX, playerY)) playerX = nextX;
    if (!processEnvironmentIntersection(playerX, nextY)) playerY = nextY;

    // Direct inline rendering changes to layout bounds
    player.style.left = playerX + 'px';
    player.style.top = playerY + 'px';
    
    // Update the layout spritesheet grid values
    updateCharacterSpriteFrame();

    viewport.scrollLeft = playerX - (window.innerWidth / 2) + 60;
    viewport.scrollTop = playerY - (window.innerHeight / 2) + 60;

    requestAnimationFrame(coreExecutionEngine);
}