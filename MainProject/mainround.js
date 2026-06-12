const menu = document.getElementById('menu');
const container = document.getElementById('game-container');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Map Dimensions
const MAP_WIDTH = 2500;
const MAP_HEIGHT = 2000;

// Inputs & Engine Loops
let gameLoopId;
const keys = {};

// Player (Slightly custom base properties)
const player = {
    x: 300,
    y: 400,
    radius: 20,
    baseSpeed: 4,
    speed: 4,
    color: '#e0a96d'
};

// Object Data Pools
const environment = {
    houses: [],
    pools: [],
    poolMats: [],
    mudPatches: [],
    rocks: [],
    trees: [],
    spikes: []
};

// Event Hooks for Desktop Movement
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function startGame(difficulty) {
    menu.style.display = 'none';
    container.style.display = 'block';

    canvas.width = MAP_WIDTH;
    canvas.height = MAP_HEIGHT;

    generateMapLayout(difficulty);
    
    // Jump camera position immediately over player initialization 
    container.scrollLeft = player.x - container.clientWidth / 2;
    container.scrollTop = player.y - container.clientHeight / 2;

    if(gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoopId = requestAnimationFrame(gameLoop);
}

function generateMapLayout(difficulty) {
    // 1. Recreating the Long L-Shaped House layout
    environment.houses = [
        { x: 150, y: 150, width: 160, height: 450 }, // Vertical layout wing
        { x: 150, y: 150, width: 400, height: 160 }  // Horizontal layout wing
    ];

    // 2. Deep pool boundaries
    environment.pools = [
        { x: 600, y: 200, width: 250, height: 150 }
    ];
    // Safe bridge paths across pools
    environment.poolMats = [
        { x: 650, y: 200, width: 50, height: 150 },
        { x: 750, y: 200, width: 50, height: 150 }
    ];

    // 3. Mud zones (Triggers speed dampening)
    environment.mudPatches = [
        { x: 800, y: 600, r: 90 },
        { x: 1400, y: 300, r: 120 },
        { x: 400, y: 1200, r: 100 }
    ];

    // 4. Ground Trap Spikes
    environment.spikes = [
        { x: 700, y: 450, width: 120, height: 30 },
        { x: 1100, y: 900, width: 30, height: 150 }
    ];

    // 5. Hard Obstacle Rocks
    environment.rocks = [
        { x: 900, y: 250, r: 35 },
        { x: 200, y: 800, r: 45 },
        { x: 1600, y: 1300, r: 55 }
    ];

    // 6. Tree Borders & Obstacle Placement
    environment.trees = [];
    for (let x = 0; x < MAP_WIDTH; x += 80) {
        environment.trees.push({ x: x, y: 40, r: 35 });
        environment.trees.push({ x: x, y: MAP_HEIGHT - 40, r: 35 });
    }
    for (let y = 40; y < MAP_HEIGHT; y += 80) {
        environment.trees.push({ x: 40, y: y, r: 35 });
        environment.trees.push({ x: MAP_WIDTH - 40, y: y, r: 35 });
    }
    // Arena inner foliage lines
    environment.trees.push({ x: 1200, y: 500, r: 40 }, { x: 1300, y: 550, r: 40 });
}

// --- MATHEMATICAL COLLISION UTILITIES ---
function checkCircleRectCollision(circle, rect) {
    let closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    let closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    let dx = circle.x - closestX;
    let dy = circle.y - closestY;
    return (dx * dx + dy * dy) < (circle.radius * circle.radius);
}

function checkCircleCircleCollision(c1, c2) {
    let dx = c1.x - c2.x;
    let dy = c1.y - c2.y;
    return Math.sqrt(dx * dx + dy * dy) < (c1.radius + c2.r);
}

function isCollidingWithObstacles(projectedPos) {
    for (let house of environment.houses) {
        if (checkCircleRectCollision(projectedPos, house)) return true;
    }
    for (let pool of environment.pools) {
        if (checkCircleRectCollision(projectedPos, pool)) {
            let safeOnMat = false;
            for (let mat of environment.poolMats) {
                if (checkCircleRectCollision(projectedPos, mat)) {
                    safeOnMat = true;
                    break;
                }
            }
            if (!safeOnMat) return true; // Direct contact with water drops blocks you
        }
    }
    for (let tree of environment.trees) {
        if (checkCircleCircleCollision(projectedPos, tree)) return true;
    }
    for (let rock of environment.rocks) {
        if (checkCircleCircleCollision(projectedPos, rock)) return true;
    }
    return false;
}

// --- PHYSICS TICK UPDATE ---
function update() {
    let inMud = false;
    for (let mud of environment.mudPatches) {
        let dx = player.x - mud.x;
        let dy = player.y - mud.y;
        if (Math.sqrt(dx * dx + dy * dy) < mud.r) {
            inMud = true;
            break;
        }
    }
    player.speed = inMud ? player.baseSpeed * 0.4 : player.baseSpeed;

    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy = -player.speed;
    if (keys['s'] || keys['arrowdown']) dy = player.speed;
    if (keys['a'] || keys['arrowleft']) dx = -player.speed;
    if (keys['d'] || keys['arrowright']) dx = player.speed;

    if (dx !== 0) {
        let testX = { x: player.x + dx, y: player.y, radius: player.radius };
        if (!isCollidingWithObstacles(testX)) player.x += dx;
    }
    if (dy !== 0) {
        let testY = { x: player.x, y: player.y + dy, radius: player.radius };
        if (!isCollidingWithObstacles(testY)) player.y += dy;
    }

    player.x = Math.max(player.radius, Math.min(MAP_WIDTH - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(MAP_HEIGHT - player.radius, player.y));

    // Automated linear viewport follow calculations
    let targetLeft = player.x - container.clientWidth / 2;
    let targetTop = player.y - container.clientHeight / 2;
    container.scrollLeft += (targetLeft - container.scrollLeft) * 0.1;
    container.scrollTop += (targetTop - container.scrollTop) * 0.1;
}

// --- VISUAL GRAPHICS ENGINE ---
function drawGrassTexture() {
    ctx.fillStyle = '#557a2b';
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    ctx.strokeStyle = '#4d6e27';
    ctx.lineWidth = 2;
    for (let i = 0; i < MAP_WIDTH; i += 120) {
        for (let j = 0; j < MAP_HEIGHT; j += 120) {
            ctx.beginPath();
            ctx.moveTo(i, j); ctx.lineTo(i - 5, j - 15);
            ctx.moveTo(i, j); ctx.lineTo(i + 5, j - 12);
            ctx.stroke();
        }
    }
}

function drawCharacter(char) {
    ctx.save();
    
    // Legs (2 circles)
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(char.x - 8, char.y + 12, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(char.x + 8, char.y + 12, 6, 0, Math.PI * 2); ctx.fill();
}

function gameLoop() {
    update();
    draw();
    gameLoopId = requestAnimationFrame(gameLoop);
}

function draw() {
    drawGrassTexture();
    drawEnvironment();

    // Player and HUD
    drawCharacter(player);
    drawHUD();
}

function drawEnvironment() {
    // Houses
    ctx.fillStyle = '#8b6f50';
    environment.houses.forEach(house => ctx.fillRect(house.x, house.y, house.width, house.height));

    // Pools
    ctx.fillStyle = '#2f6dd3';
    environment.pools.forEach(pool => ctx.fillRect(pool.x, pool.y, pool.width, pool.height));
    ctx.fillStyle = '#bbd7ff';
    environment.poolMats.forEach(mat => ctx.fillRect(mat.x, mat.y, mat.width, mat.height));

    // Mud
    ctx.fillStyle = 'rgba(101, 67, 33, 0.7)';
    environment.mudPatches.forEach(mud => {
        ctx.beginPath();
        ctx.arc(mud.x, mud.y, mud.r, 0, Math.PI * 2);
        ctx.fill();
    });

    // Spikes
    ctx.fillStyle = '#666';
    environment.spikes.forEach(spike => ctx.fillRect(spike.x, spike.y, spike.width, spike.height));

    // Rocks
    ctx.fillStyle = '#444';
    environment.rocks.forEach(rock => {
        ctx.beginPath();
        ctx.arc(rock.x, rock.y, rock.r, 0, Math.PI * 2);
        ctx.fill();
    });

    // Trees
    ctx.fillStyle = '#2b4820';
    environment.trees.forEach(tree => {
        ctx.beginPath();
        ctx.arc(tree.x, tree.y, tree.r, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawHUD() {
    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.fillText('Position: ' + Math.round(player.x) + ', ' + Math.round(player.y), player.x - 40, player.y - 40);
}

window.onload = () => {
    document.getElementById('start-button').onclick = () => startGame('normal');
};