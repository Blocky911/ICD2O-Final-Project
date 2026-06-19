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
let gameActive = false; // Note: Ensure your startup UI toggles this to true to kick off calculations

// Speed variables (Synchronized perfectly as a base)
const NORMAL_SPEED = 8;
const MUD_SPEED = 3;
const CROWN_SPEED_BOOST = 1.2; // Slightly faster modifier when holding the crown
let currentSpeed = NORMAL_SPEED;

// --- MATCH TIMER & SCORE RETRIEVAL ENTITIES ---
let gameTimeRemaining = 150; // 2 minutes and 30 seconds total (In seconds)
let playerScore = 0;
let scoreAccumulationTimer = 0; // Track engine cycles to increment every 0.1s (6 frames at 60 FPS)

// Track active keyboard inputs
const keys = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false
};
let obstacles = [];
const mapSize = 5000;

// Role state variables for the loop mechanics
let isPlayerIt = false; // Starts with the bot chasing you (Bot is It, Player has Crown)
let tagCooldownTimer = 0; // Buffer window to manage freeze states (60 frames = 1 second)
const TAG_COOLDOWN_FRAMES = 60;

// Crown element configuration (Slightly Bigger Matrix dimensions)
let crownElement = null;

// Dynamic HUD Displays Creator
let hudContainer = null;
let timerDisplayElement = null;
let scoreDisplayElement = null;

function setupGameHUD() {
    // Check if HUD already exists to avoid duplication
    if (document.getElementById('game-hud-overlay')) return;

    hudContainer = document.createElement('div');
    hudContainer.id = 'game-hud-overlay';
    hudContainer.style.position = 'fixed';
    hudContainer.style.top = '20px';
    hudContainer.style.left = '50%';
    hudContainer.style.transform = 'translateX(-50%)';
    hudContainer.style.display = 'flex';
    hudContainer.style.gap = '40px';
    hudContainer.style.backgroundColor = 'rgba(11, 15, 25, 0.85)';
    hudContainer.style.padding = '12px 30px';
    hudContainer.style.borderRadius = '30px';
    hudContainer.style.border = '2px solid #ffcc00';
    hudContainer.style.boxShadow = '0 0 15px rgba(0,0,0,0.5)';
    hudContainer.style.zIndex = '1000';
    hudContainer.style.fontFamily = "'Bebas Neue', 'Segoe UI', sans-serif";
    hudContainer.style.fontSize = '24px';
    hudContainer.style.letterSpacing = '1px';

    timerDisplayElement = document.createElement('div');
    timerDisplayElement.id = 'hud-timer';
    timerDisplayElement.style.color = '#ffffff';
    timerDisplayElement.innerHTML = 'TIME: <span style="color: #ffcc00;">2:30</span>';

    scoreDisplayElement = document.createElement('div');
    scoreDisplayElement.id = 'hud-score';
    scoreDisplayElement.style.color = '#ffffff';
    scoreDisplayElement.innerHTML = 'SCORE: <span style="color: #00ff00;">0000</span>';

    hudContainer.appendChild(timerDisplayElement);
    hudContainer.appendChild(scoreDisplayElement);
    document.body.appendChild(hudContainer);

    // Setup an interval to drop the clock down every second ticking natively
    setInterval(() => {
        if (!gameActive || gameTimeRemaining <= 0) return;
        
        gameTimeRemaining--;
        
        // Calculate format readouts
        let minutes = Math.floor(gameTimeRemaining / 60);
        let seconds = gameTimeRemaining % 60;
        if (seconds < 10) seconds = '0' + seconds;
        
        timerDisplayElement.innerHTML = `TIME: <span style="color: #ffcc00;">${minutes}:${seconds}</span>`;

        if (gameTimeRemaining <= 0) {
            gameActive = false;

            // --- POINTS TO COINS CONVERSION SYSTEM ---
            // Load existing persistent data (defaulting to 0)
            let currentCoins = localStorage.getItem('playerCoins') !== null ? parseInt(localStorage.getItem('playerCoins')) : 0;
            let currentPoints = localStorage.getItem('playerPoints') !== null ? parseInt(localStorage.getItem('playerPoints')) : 0;

            // Add the points earned this round to the absolute total reservoir
            let totalPointsPool = currentPoints + playerScore;
            
            // Calculate new coins generated (1 coin per 50 points)
            let coinsEarned = Math.floor(totalPointsPool / 50);
            let leftoverPoints = totalPointsPool % 50;

            // Save new calculations back into LocalStorage
            localStorage.setItem('playerCoins', currentCoins + coinsEarned);
            localStorage.setItem('playerPoints', leftoverPoints);

            // Create a styled end game modal popup dynamically
            const modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.top = '0'; modal.style.left = '0';
            modal.style.width = '100vw'; modal.style.height = '100vh';
            modal.style.backgroundColor = 'rgba(11, 15, 25, 0.95)';
            modal.style.display = 'flex'; modal.style.flexDirection = 'column';
            modal.style.justifyContent = 'center'; modal.style.alignItems = 'center';
            modal.style.zIndex = '10000';
            modal.style.fontFamily = "'Bebas Neue', sans-serif";
            modal.style.color = '#ffffff';

            modal.innerHTML = `
                <h1 style="font-size: 64px; color: #ffcc00; margin-bottom: 10px; letter-spacing: 2px;">ROUND OVER!</h1>
                <div style="font-size: 28px; margin-bottom: 25px; font-family: 'DM Sans', sans-serif; text-align: center; line-height: 1.6;">
                    <p>Points Scored This Match: <span style="color: #00ff00; font-weight: bold;">+${playerScore}</span></p>
                    <p style="font-size: 32px; margin: 15px 0; color: #ffcc00;">[ ${playerScore} Points ➔ 🪙 ${coinsEarned} Coins ]</p>
                    <p style="font-size: 20px; color: #aaaaaa;">Leftover points banked towards next coin: ${leftoverPoints}/50</p>
                </div>
                <button id="menu-redirect-btn" style="padding: 12px 40px; font-size: 24px; background-color: #ffcc00; border: none; border-radius: 25px; cursor: pointer; font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; transition: transform 0.1s;">
                    RETURN TO MAIN MENU
                </button>
            `;
            
            document.body.appendChild(modal);

            document.getElementById('menu-redirect-btn').onclick = () => {
                window.location.href = 'index.html';
            };
        }
    }, 1000);
}

function createCrown() {
    crownElement = document.createElement('div');
    crownElement.className = 'game-crown';
    crownElement.style.position = 'absolute';
    crownElement.style.width = '55px'; 
    crownElement.style.height = '55px'; 
    crownElement.style.backgroundImage = "url('images/game_crown.png')";
    crownElement.style.backgroundSize = 'contain';
    crownElement.style.backgroundRepeat = 'no-repeat';
    crownElement.style.zIndex = '30';
    map.appendChild(crownElement);
}

function updateCrownPosition() {
    if (!crownElement) return;
    
    if (!isPlayerIt) {
        crownElement.style.left = (playerX + 32.5) + 'px';
        crownElement.style.top = (playerY - 10) + 'px';
    } else {
        crownElement.style.left = (botX + 32.5) + 'px';
        crownElement.style.top = (botY - 10) + 'px';
    }
}

// Bot Tracker Arrow Setup
let trackerArrow = null;

function createTrackerArrow() {
    trackerArrow = document.createElement('div');
    trackerArrow.id = 'bot-tracker-arrow';
    trackerArrow.style.position = 'fixed';
    trackerArrow.style.width = '0';
    trackerArrow.style.height = '0';
    trackerArrow.style.borderLeft = '15px solid transparent';
    trackerArrow.style.borderRight = '15px solid transparent';
    trackerArrow.style.borderBottom = '25px solid #ffcc00'; 
    trackerArrow.style.filter = 'drop-shadow(0px 0px 6px rgba(255,204,0,0.8))';
    trackerArrow.style.zIndex = '200';
    trackerArrow.style.display = 'none'; 
    document.body.appendChild(trackerArrow);
}

function updateTrackerArrowPosition() {
    if (!trackerArrow || !botElement) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const botScreenX = botX - viewport.scrollLeft + 60; 
    const botScreenY = botY - viewport.scrollTop + 60;
    const padding = 35;

    if (botScreenX < 0 || botScreenX > vw || botScreenY < 0 || botScreenY > vh) {
        trackerArrow.style.display = 'block';

        const centerX = vw / 2;
        const centerY = vh / 2;

        const dx = botScreenX - centerX;
        const dy = botScreenY - centerY;
        const angle = Math.atan2(dy, dx);

        let arrowX = centerX;
        let arrowY = centerY;

        if (dx !== 0) {
            const slope = dy / dx;
            if (dx > 0) {
                arrowX = vw - padding;
                arrowY = centerY + (vw / 2 - padding) * slope;
            } else {
                arrowX = padding;
                arrowY = centerY - (vw / 2 - padding) * slope;
            }
        }

        if (arrowY < padding) {
            arrowY = padding;
            if (dy !== 0) arrowX = centerX + (padding - centerY) / (dy / dx);
        } else if (arrowY > vh - padding) {
            arrowY = vh - padding;
            if (dy !== 0) arrowX = centerX + (vh - padding - centerY) / (dy / dx);
        }

        if (arrowX < padding) arrowX = padding;
        if (arrowX > vw - padding) arrowX = vw - padding;

        trackerArrow.style.left = (arrowX - 15) + 'px';
        trackerArrow.style.top = (arrowY - 12.5) + 'px';

        const rotationDegrees = (angle * 180 / Math.PI) + 90;
        trackerArrow.style.transform = `rotate(${rotationDegrees}deg)`;
    } else {
        trackerArrow.style.display = 'none';
    }
}

// ==========================================
// 1b. 8x8 SPRITESHEET MATRIX SELECTIONS
// ==========================================
const SKIN_ROW_MAPPING = {
    'skin_default_red': 1, 
    'bot_default_blue': 0, 
    'skin_nugget': 2,      
    'bot_evil': 3,         
    'skin_george': 4,      
    'bot_mcrae': 5,        
    'skin_john': 6,        
    'bot_stealer': 7       
};

const SPRITE_COLUMNS = {
    FRONT: 0, FRONT_WALK: 1,
    RIGHT: 4, RIGHT_WALK: 5,
    LEFT: 2,  LEFT_WALK: 3,
    BACK: 6,  BACK_WALK: 7
};

const equippedItems = JSON.parse(localStorage.getItem('equippedItems')) || {
    playerSkin: 'skin_default_red',
    botSkin: 'bot_default_blue'
};

let currentDirectionCol = SPRITE_COLUMNS.FRONT;
let isWalkingFrame = false;
let animationToggleTimer = 0;

const playerRowIndex = SKIN_ROW_MAPPING[equippedItems.playerSkin] ?? 1;

function updateCharacterSpriteFrame() {
    if (!player) return;
    const xOffset = currentDirectionCol * -120;
    const yOffset = playerRowIndex * -120;
    player.style.backgroundPosition = `${xOffset}px ${yOffset}px`;
}

updateCharacterSpriteFrame();

// ==========================================
// 1c. BOT ARCHITECTURE & CONFIGURATION
// ==========================================
let botElement = null;
let botX = playerX; 
let botY = playerY - 250; 
let botSpeed = NORMAL_SPEED; 
let botDirectionCol = SPRITE_COLUMNS.FRONT;
let botIsWalkingFrame = false;
let botAnimTimer = 0;

let botSpawnTimer = 0; 
const BOT_DELAY_FRAMES = 300; 

const botRowIndex = SKIN_ROW_MAPPING[equippedItems.botSkin] ?? 0;
const urlParams = new URLSearchParams(window.location.search);
const gameDifficulty = urlParams.get('diff') || 'medium';

function createBot() {
    botElement = document.createElement('div');
    botElement.className = 'character bot-character';
    
    botElement.style.position = 'absolute';
    botElement.style.width = '120px';
    botElement.style.height = '120px';
    botElement.style.zIndex = '24';
    botElement.style.backgroundImage = "url('images/game_skins.png')";
    botElement.style.backgroundRepeat = 'no-repeat';
    botElement.style.backgroundSize = '960px 960px';
    botElement.style.left = botX + 'px';
    botElement.style.top = botY + 'px';
    
    map.appendChild(botElement);
    updateBotSpriteFrame();
}

function updateBotSpriteFrame() {
    if (!botElement) return;
    const xOffset = botDirectionCol * -120;
    const yOffset = botRowIndex * -120;
    botElement.style.backgroundPosition = `${xOffset}px ${yOffset}px`;
}

function setupDifficultyParameters() {
    botSpeed = NORMAL_SPEED; 
}

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
    const px = targetX + playerOffset;
    const py = targetY + playerOffset;
    const pw = playerSize;
    const ph = playerSize;
    const pCenterX = px + pw / 2;
    const pCenterY = py + ph / 2;

    if (px < 130 || px + pw > 4870 || py < 130 || py + ph > 4870) return true;
    for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        if (obs.type === 'rect') {
            if (obs.isPoolWater && checkWalkboardPlatformSafety(targetX, targetY)) continue;
            if (px < obs.x + obs.w && px + pw > obs.x && py < obs.y + obs.h && py + ph > obs.y) return true;
        } else if (obs.type === 'circle') {
            const distX = pCenterX - obs.x;
            const distY = pCenterY - obs.y;
            if (Math.sqrt(distX * distX + distY * distY) < (pw / 2) + obs.radius) return true;
        }
    }
    return false;
}

// ==========================================
// 3b. BOT AI BRAIN MATRIX IMPLEMENTATION
// ==========================================
function executeBotIntelligence() {
    if (!botElement) return;

    if (botSpawnTimer < BOT_DELAY_FRAMES) {
        botSpawnTimer++;
        botDirectionCol = SPRITE_COLUMNS.FRONT;
        updateBotSpriteFrame();
        updateCrownPosition();
        updateTrackerArrowPosition();
        return; 
    }

    if (tagCooldownTimer > 0) {
        tagCooldownTimer--;
    }

    if (isPlayerIt === false && tagCooldownTimer > 0) {
        botElement.style.filter = "drop-shadow(0px 0px 10px #ff0000) brightness(0.5) sepia(1)"; 
        updateCrownPosition();
        updateTrackerArrowPosition();
        return; 
    }

    let localSpeed = botSpeed;
    if (checkMudCollision(botX, botY)) {
        localSpeed = MUD_SPEED;
        botElement.style.filter = "sepia(0.6) brightness(0.75)";
    } else {
        if (isPlayerIt) {
            localSpeed = botSpeed + CROWN_SPEED_BOOST; 
            botElement.style.filter = "drop-shadow(0px 0px 8px #00ff00)"; 
        } else {
            localSpeed = botSpeed;
            botElement.style.filter = "drop-shadow(0px 0px 8px #ff0000)"; 
        }
    }

    let playerCenterX = playerX + 60;
    let playerCenterY = playerY + 60;
    let botImgCenterX = botX + 60;
    let botImgCenterY = botY + 60;

    let dx = playerCenterX - botImgCenterX;
    let dy = playerCenterY - botImgCenterY;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 55 && tagCooldownTimer === 0) {
        isPlayerIt = !isPlayerIt;
        tagCooldownTimer = TAG_COOLDOWN_FRAMES; 
        return;
    }

    let moveX = 0;
    let moveY = 0;
    let factor = isPlayerIt ? -1 : 1; 

    if (distance > 0) {
        let preferredX = (dx / distance) * localSpeed * factor;
        let preferredY = (dy / distance) * localSpeed * factor;

        let pushX = 0;
        let pushY = 0;
        
        let safetyBubbleDist = 110; 
        let forceIntensity = 2.8;

        if (gameDifficulty === 'medium') {
            safetyBubbleDist = 75;
            forceIntensity = 1.8;
        } else if (gameDifficulty === 'easy') {
            safetyBubbleDist = 45;
            forceIntensity = 0.6;
        }

        const botPx = botX + playerOffset + 25;
        const botPy = botY + playerOffset + 25;
        if (botPx < 130 + safetyBubbleDist) pushX += forceIntensity;
        if (botPx > 4870 - safetyBubbleDist) pushX -= forceIntensity;
        if (botPy < 130 + safetyBubbleDist) pushY += forceIntensity;
        if (botPy > 4870 - safetyBubbleDist) pushY -= forceIntensity;

        for (let i = 0; i < obstacles.length; i++) {
            const obs = obstacles[i];
            if (obs.type === 'circle') {
                let vX = botPx - obs.x;
                let vY = botPy - obs.y;
                let distToCircle = Math.sqrt(vX * vX + vY * vY);
                let triggerRange = obs.radius + safetyBubbleDist;
                if (distToCircle < triggerRange && distToCircle > 0) {
                    let weight = (triggerRange - distToCircle) / triggerRange;
                    pushX += (vX / distToCircle) * forceIntensity * weight * 1.5;
                    pushY += (vY / distToCircle) * forceIntensity * weight * 1.5;
                }
            } else if (obs.type === 'rect') {
                let closestX = Math.max(obs.x, Math.min(botPx, obs.x + obs.w));
                let closestY = Math.max(obs.y, Math.min(botPy, obs.y + obs.h));
                let vX = botPx - closestX;
                let vY = botPy - closestY;
                let distToRect = Math.sqrt(vX * vX + vY * vY);
                if (distToRect < safetyBubbleDist && distToRect > 0) {
                    let weight = (safetyBubbleDist - distToRect) / safetyBubbleDist;
                    pushX += (vX / distToRect) * forceIntensity * weight;
                    pushY += (vY / distToRect) * forceIntensity * weight;
                }
            }
        }

        moveX = preferredX + pushX;
        moveY = preferredY + pushY;

        let totalMoveDist = Math.sqrt(moveX * moveX + moveY * moveY);
        if (totalMoveDist > localSpeed) {
            moveX = (moveX / totalMoveDist) * localSpeed;
            moveY = (moveY / totalMoveDist) * localSpeed;
        }

        if (processEnvironmentIntersection(botX + moveX, botY + moveY)) {
            let pathFound = false;
            let maxAngle = 180;
            let angleStep = 15; 

            if (gameDifficulty === 'medium') angleStep = 30;
            if (gameDifficulty === 'easy') angleStep = 75;

            for (let angleOffset = angleStep; angleOffset <= maxAngle; angleOffset += angleStep) {
                let radPositive = (angleOffset * Math.PI) / 180;
                let radNegative = (-angleOffset * Math.PI) / 180;

                let txPos = Math.cos(radPositive) * moveX - Math.sin(radPositive) * moveY;
                let tyPos = Math.sin(radPositive) * moveX + Math.cos(radPositive) * moveY;
                if (!processEnvironmentIntersection(botX + txPos, botY + tyPos)) {
                    moveX = txPos; moveY = tyPos;
                    pathFound = true;
                    break;
                }

                let txNeg = Math.cos(radNegative) * moveX - Math.sin(radNegative) * moveY;
                let tyNeg = Math.sin(radNegative) * moveX + Math.cos(radNegative) * moveY;
                if (!processEnvironmentIntersection(botX + txNeg, botY + tyNeg)) {
                    moveX = txNeg; moveY = tyNeg;
                    pathFound = true;
                    break;
                }
            }

            if (!pathFound) {
                if (gameDifficulty === 'easy' && Math.random() < 0.6) {
                    moveX *= -0.2; moveY *= -0.2;
                } else {
                    if (!processEnvironmentIntersection(botX + moveX, botY)) {
                        moveY = 0;
                    } else if (!processEnvironmentIntersection(botX, botY + moveY)) {
                        moveX = 0;
                    } else {
                        moveX = -preferredX * 0.4;
                        moveY = -preferredY * 0.4;
                    }
                }
            }
        }
    }

    let botNextX = botX + moveX;
    let botNextY = botY + moveY;

    let botIsMoving = Math.abs(moveX) > 0.1 || Math.abs(moveY) > 0.1;
    let targetBotDirCol = botDirectionCol;

    if (botIsMoving) {
        if (Math.abs(moveY) > Math.abs(moveX)) {
            targetBotDirCol = moveY < 0 ? SPRITE_COLUMNS.BACK : SPRITE_COLUMNS.FRONT;
        } else {
            targetBotDirCol = moveX < 0 ? SPRITE_COLUMNS.LEFT : SPRITE_COLUMNS.RIGHT;
        }

        botAnimTimer++;
        if (botAnimTimer >= 10) {
            botIsWalkingFrame = !botIsWalkingFrame;
            botAnimTimer = 0;
        }
        botDirectionCol = botIsWalkingFrame ? (targetBotDirCol + 1) : targetBotDirCol;
    } else {
        if (botDirectionCol % 2 !== 0) botDirectionCol -= 1;
        botAnimTimer = 0;
    }

    if (!processEnvironmentIntersection(botNextX, botY)) botX = botNextX;
    if (!processEnvironmentIntersection(botX, botNextY)) botY = botNextY;

    botElement.style.left = botX + 'px';
    botElement.style.top = botY + 'px';
    
    updateBotSpriteFrame();
    updateCrownPosition();
    updateTrackerArrowPosition();
}

// ==========================================
// 4. MAIN GAME LOOP (MOVEMENT & CAMERA)
// ==========================================
function coreExecutionEngine() {
    if (!gameActive) return;

    // --- ONLY ACCUMULATE SCORE EVERY 0.1s IF PLAYER HAS CROWN (isPlayerIt === false) ---
    if (!isPlayerIt) {
        scoreAccumulationTimer++;
        if (scoreAccumulationTimer >= 6) { // ~6 frames at 60 FPS equals 0.1 seconds
            playerScore += 1;
            scoreDisplayElement.innerHTML = `SCORE: <span style="color: #00ff00;">${String(playerScore).padStart(4, '0')}</span>`;
            scoreAccumulationTimer = 0;
        }
    } else {
        scoreAccumulationTimer = 0; // Reset tracking cycles when tagged
    }
    
    if (checkMudCollision(playerX, playerY)) {
        currentSpeed = MUD_SPEED;
        player.style.filter = "sepia(0.6) brightness(0.75)";
    } else {
        if (isPlayerIt) {
            currentSpeed = NORMAL_SPEED;
            player.style.filter = "drop-shadow(0px 0px 8px #ff0000)"; 
        } else {
            currentSpeed = NORMAL_SPEED + CROWN_SPEED_BOOST; 
            player.style.filter = "drop-shadow(0px 0px 8px #00ff00)"; 
        }
    }

    if (isPlayerIt === true && tagCooldownTimer > 0) {
        player.style.filter = "drop-shadow(0px 0px 10px #ff0000) brightness(0.5) sepia(1)";
        executeBotIntelligence();
        viewport.scrollLeft = playerX - (window.innerWidth / 2) + 60;
        viewport.scrollTop = playerY - (window.innerHeight / 2) + 60;
        requestAnimationFrame(coreExecutionEngine);
        return;
    }

    let moveX = 0;
    let moveY = 0;
    let isMoving = false;
    let targetDirectionCol = currentDirectionCol;

    if (keys.w || keys.ArrowUp) {
        moveY -= 1;
        targetDirectionCol = SPRITE_COLUMNS.BACK;
        isMoving = true;
    }
    if (keys.s || keys.ArrowDown) {
        moveY += 1;
        targetDirectionCol = SPRITE_COLUMNS.FRONT;
        isMoving = true;
    }
    if (keys.a || keys.ArrowLeft) {
        moveX -= 1;
        targetDirectionCol = SPRITE_COLUMNS.LEFT;
        isMoving = true;
    }
    if (keys.d || keys.ArrowRight) {
        moveX += 1;
        targetDirectionCol = SPRITE_COLUMNS.RIGHT;
        isMoving = true;
    }

    if (moveX !== 0 && moveY !== 0) {
        const length = Math.sqrt(moveX * moveX + moveY * moveY);
        moveX /= length;
        moveY /= length;
    }

    let nextX = playerX + (moveX * currentSpeed);
    let nextY = playerY + (moveY * currentSpeed);

    if (isMoving) {
        animationToggleTimer++;
        if (animationToggleTimer >= 10) { 
            isWalkingFrame = !isWalkingFrame;
            animationToggleTimer = 0;
        }
        currentDirectionCol = isWalkingFrame ? (targetDirectionCol + 1) : targetDirectionCol;
    } else {
        if (currentDirectionCol % 2 !== 0) {
            currentDirectionCol -= 1;
        }
        animationToggleTimer = 0;
    }

    if (!processEnvironmentIntersection(nextX, playerY)) playerX = nextX;
    if (!processEnvironmentIntersection(playerX, nextY)) playerY = nextY;

    player.style.left = playerX + 'px';
    player.style.top = playerY + 'px';
    
    updateCharacterSpriteFrame();
    executeBotIntelligence();

    viewport.scrollLeft = playerX - (window.innerWidth / 2) + 60;
    viewport.scrollTop = playerY - (window.innerHeight / 2) + 60;

    requestAnimationFrame(coreExecutionEngine);
}

// Hook setup into layout preparation sequence
setupDifficultyParameters();
setupGameHUD();
createBot();
createCrown();
createTrackerArrow();