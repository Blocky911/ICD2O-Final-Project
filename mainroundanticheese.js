populateMapEnvironment();
initializeObstacleMatrix();
removeTreeObstaclesUnderPlayer();

// ==========================================
// ANTI-STUCK BOT GHOST MODE MODIFICATION
// ==========================================
let botStuckFrames = 0;
let botIsGhostMode = false;
const originalExecuteBotIntelligence = executeBotIntelligence;

// --- Back-and-Forth Pacing Detector Variables ---
let lastBotDirX = 0; // -1 for Left, 1 for Right, 0 for None
let lastBotDirY = 0; // -1 for Up, 1 for Down, 0 for None
let botReversalCounter = 0;
let reversalTimer = 0;

// Uses standard Web Audio API to synthesize a standalone ghost sound effect
function playGhostSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(550, ctx.currentTime + 0.8);
        osc.frequency.linearRampToValueAtTime(240, ctx.currentTime + 1.8);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(700, ctx.currentTime);
        
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 1.8);
    } catch (e) { console.error("Web Audio failed:", e); }
}

// Intercept AI routine to append the ghost mechanic tracking
executeBotIntelligence = function() {
    if (!botElement) return originalExecuteBotIntelligence();

    let oldX = botX;
    let oldY = botY;
    const originalIntersection = processEnvironmentIntersection;

    if (botIsGhostMode) {
        // Ignore environmental obstacles while in ghost mode
        processEnvironmentIntersection = function() { return false; };
        botElement.style.opacity = "0.45";
        botElement.style.filter = "invert(1) drop-shadow(0px 0px 18px #00ffff)";
    }

    // Run core logic inside mainround.js
    originalExecuteBotIntelligence();

    // Revert reference back instantly
    processEnvironmentIntersection = originalIntersection;

    // --- MAP BOUNDARY CLAMPING SAFETY CHECK ---
    const minBoundary = 10;
    const maxBoundary = 5000 - 130; 
    
    if (botX < minBoundary) botX = minBoundary;
    if (botX > maxBoundary) botX = maxBoundary;
    if (botY < minBoundary) botY = minBoundary;
    if (botY > maxBoundary) botY = maxBoundary;

    // Re-synchronize style variables in case the safety clamp updated coordinates
    botElement.style.left = botX + 'px';
    botElement.style.top = botY + 'px';

    if (botIsGhostMode) {
        // STAMINA PENALTY TRADE-OFF: Force bot stamina to remain entirely depleted while phasing
        if (typeof botStamina !== 'undefined') {
            botStamina = 0;
        }

        // Keep checking if the AI has completely exited all solid obstacles
        if (!originalIntersection(botX, botY)) {
            botIsGhostMode = false;
            botStuckFrames = 0;
            botReversalCounter = 0;
            botElement.style.opacity = "1";
            botElement.style.filter = "none";
        }
    } else {
        // Ensure match is running, bot is active, not stunned, and far enough from player
        let dx = (playerX + 60) - (botX + 60);
        let dy = (playerY + 60) - (botY + 60);
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (botSpawnTimer >= BOT_DELAY_FRAMES && botStunTimer <= 0 && tagCooldownTimer === 0 && distance > 55) {
            let movedDist = Math.sqrt((botX - oldX) ** 2 + (botY - oldY) ** 2);
            
            // 1. Calculate current directional states (-1, 0, or 1)
            let currentDirX = (botX - oldX) > 0.1 ? 1 : ((botX - oldX) < -0.1 ? -1 : 0);
            let currentDirY = (botY - oldY) > 0.1 ? 1 : ((botY - oldY) < -0.1 ? -1 : 0);

            // 2. Detect tracking reversals (Back and forth oscillations)
            if (currentDirX !== 0 && lastBotDirX !== 0 && currentDirX !== lastBotDirX) {
                botReversalCounter += 1;
            }
            if (currentDirY !== 0 && lastBotDirY !== 0 && currentDirY !== lastBotDirY) {
                botReversalCounter += 1;
            }

            // Save state for next tick frame evaluation
            if (currentDirX !== 0) lastBotDirX = currentDirX;
            if (currentDirY !== 0) lastBotDirY = currentDirY;

            // Decay the pacing score slowly over time so normal steering adjustments don't pile up
            reversalTimer++;
            if (reversalTimer >= 15) {
                if (botReversalCounter > 0) botReversalCounter = Math.max(0, botReversalCounter - 1);
                reversalTimer = 0;
            }

            // 3. Evaluate Trigger Conditions
            // Configured exactly to 185 back-and-forth direction switches
            let isPacingViolently = botReversalCounter >= 185; 
            let isPositionFrozen = movedDist < 0.4;

            if (isPositionFrozen || isPacingViolently) {
                botStuckFrames++;
                
                // Timings tuned for a tighter 3-second (180 frame) cutoff or pacing triggers
                if (botStuckFrames > 180 || (isPacingViolently && botStuckFrames > 120)) {
                    botIsGhostMode = true;
                    playGhostSound();
                    showItemPopup("The game thinks you're cheating or the Ai is stuck! Phasing through obstacles to get back in the game...", 3500);
                    
                    if (typeof botStamina !== 'undefined') {
                        botStamina = 0;
                    }
                }
            } else {
                botStuckFrames = Math.max(0, botStuckFrames - 1);
            }
        }
    }
};

gameActive = true;
requestAnimationFrame(coreExecutionEngine);