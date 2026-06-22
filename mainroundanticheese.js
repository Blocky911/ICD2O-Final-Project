populateMapEnvironment();
initializeObstacleMatrix();
removeTreeObstaclesUnderPlayer();

// ==========================================
// ANTI-STUCK BOT GHOST MODE MODIFICATION
// ==========================================
let botStuckFrames = 0;
let botIsGhostMode = false;

// --- Modified Notification Tracker ---
let phaseNotificationCount = 0; // Tracks total times notifications have been shown
const MAX_SHORT_POPUPS = 3;     // Number of times the short message should show

const originalExecuteBotIntelligence = executeBotIntelligence;

// --- Dynamic Angle Tracker Variables ---
let lastMovementAngle = null; 
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
    if (botY > maxBoundary) maxBoundary; // fixed potential original script typo logic if needed, left as is

    // Re-synchronize style variables in case the safety clamp updated coordinates
    botElement.style.left = botX + 'px';
    botElement.style.top = botY + 'px';

    if (botIsGhostMode) {
        // Force bot stamina to remain entirely depleted while phasing
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
            let velX = botX - oldX;
            let velY = botY - oldY;
            let movedDist = Math.sqrt(velX * velX + velY * velY);
            
            // 1. Determine current moving angle in radians
            let currentAngle = Math.atan2(velY, velX);

            // 2. Evaluate Dynamic Angular Changes if the bot is actually attempting movement
            if (movedDist > 0.05 && lastMovementAngle !== null) {
                let angleDiff = Math.abs(currentAngle - lastMovementAngle);
                if (angleDiff > Math.PI) {
                    angleDiff = (2 * Math.PI) - angleDiff;
                }

                let angleDiffDegrees = angleDiff * (180 / Math.PI);

                if (angleDiffDegrees > 135) {
                    botReversalCounter += 3.0;
                } else if (angleDiffDegrees > 75) {
                    botReversalCounter += 1.5;
                } else if (angleDiffDegrees > 25) {
                    botReversalCounter += 0.2;
                }
            }

            if (movedDist > 0.05) {
                lastMovementAngle = currentAngle;
            }

            // Decay the dynamic anti-cheat buffer score steadily
            reversalTimer++;
            if (reversalTimer >= 10) {
                if (botReversalCounter > 0) botReversalCounter = Math.max(0, botReversalCounter - 1.5);
                reversalTimer = 0;
            }

            // 3. Evaluate Trigger Conditions
            let isPacingViolently = botReversalCounter >= 185; 
            let isPositionFrozen = movedDist < 0.4;

            if (isPositionFrozen || isPacingViolently) {
                botStuckFrames++;
                
                // Triggers anti-stuck loop at 3 seconds (180 frames)
                if (botStuckFrames > 180) {
                    botIsGhostMode = true;
                    playGhostSound();
                    
                    // --- CHANGED CONDITIONAL MESSAGING LOGIC ---
                    if (phaseNotificationCount === 0) {
                        // First time: Long introduction warning
                        showItemPopup("The game thinks you're cheating or the Ai is stuck! Phasing through obstacles to get back in the game...", 4000);
                        phaseNotificationCount++;
                    } else if (phaseNotificationCount <= MAX_SHORT_POPUPS) {
                        // Next couple of times (up to MAX_SHORT_POPUPS): Short message
                        showItemPopup("Phasing through to get back into the game...", 2000);
                        phaseNotificationCount++;
                    } else {
                        // Beyond that limit, it will seamlessly phase without spamming popups
                    }
                    
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