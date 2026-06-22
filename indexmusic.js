// --- SYNTHETIC GAME AUDIO ENGINE (Web Audio API Synthesizer) ---
let audioCtx = null;
let masterGainNode = null;
let musicGainNode = null;
let sfxGainNode = null;
let musicPlaybackInterval = null;
let isMusicPlaying = false;
let currentTempoBpm = 125;

const DEFAULT_MENU_VOLUME_SETTINGS = {
    masterVolume: 80,
    musicVolume: 50,
    sfxVolume: 70
};

function loadMenuVolumeSettings() {
    const stored = localStorage.getItem('tagRoyaleSettings');
    if (!stored) return DEFAULT_MENU_VOLUME_SETTINGS;
    try {
    return { ...DEFAULT_MENU_VOLUME_SETTINGS, ...JSON.parse(stored) };
    } catch (err) {
    return DEFAULT_MENU_VOLUME_SETTINGS;
    }
}

function initAudio() {
    if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGainNode = audioCtx.createGain();
    musicGainNode = audioCtx.createGain();
    sfxGainNode = audioCtx.createGain();

    const settings = loadMenuVolumeSettings();
    masterGainNode.gain.setValueAtTime((settings.masterVolume / 100), audioCtx.currentTime);
    musicGainNode.gain.setValueAtTime((settings.musicVolume / 100) * 0.25, audioCtx.currentTime);
    sfxGainNode.gain.setValueAtTime(settings.sfxVolume / 100, audioCtx.currentTime);

    musicGainNode.connect(masterGainNode);
    sfxGainNode.connect(masterGainNode);
    masterGainNode.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
    audioCtx.resume();
    }
}

function playHoverSound() {
    initAudio();
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = 'square';
    nodeFrequency = 600;
    osc.frequency.setValueAtTime(nodeFrequency, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.04);
    
    gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
    
    osc.connect(gain);
    gain.connect(sfxGainNode);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
}

function playSelectSound() {
    initAudio();
    if (!audioCtx) return;

    let now = audioCtx.currentTime;
    let osc1 = audioCtx.createOscillator();
    let gain1 = audioCtx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(523.25, now); 
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc1.connect(gain1);
    gain1.connect(sfxGainNode);
    osc1.start(now);
    osc1.stop(now + 0.08);

    let osc2 = audioCtx.createOscillator();
    let gain2 = audioCtx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(783.99, now + 0.05);
    gain2.gain.setValueAtTime(0.08, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc2.connect(gain2);
    gain2.connect(sfxGainNode);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.18);
}

function playWooshSound() {
    initAudio();
    if (!audioCtx) return;

    let now = audioCtx.currentTime;
    let duration = 0.55;
    let bufferSize = audioCtx.sampleRate * duration;
    let buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    let data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
    }
    
    let source = audioCtx.createBufferSource();
    source.buffer = buffer;
    let resonanceFilter = audioCtx.createBiquadFilter();
    resonanceFilter.type = 'lowpass';
    resonanceFilter.frequency.setValueAtTime(180, now);
    resonanceFilter.frequency.exponentialRampToValueAtTime(3800, now + duration * 0.7);
    
    let gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.22, now + duration * 0.25);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    source.connect(resonanceFilter);
    resonanceFilter.connect(gainNode);
    gainNode.connect(sfxGainNode);
    
    source.start(now);
    source.stop(now + duration);
}

// --- CHIPTUNE SYNTH TRACK MAIN SCHEDULER LOOP ---
const basslineMelodyFrequencies = [110.00, 110.00, 130.81, 146.83, 98.00, 98.00, 110.00, 116.54];
const leadArpeggioMelodyNotes = [440.00, 523.25, 659.25, 783.99, 587.33, 698.46, 880.00, 1046.50];
let currentStepIndex = 0;
function soundTrackSchedulerLoop() {
    let stepLengthTime = 60 / currentTempoBpm / 2;
    let playTime = audioCtx.currentTime + 0.02;

    let bassOsc = audioCtx.createOscillator();
    let bassGain = audioCtx.createGain();
    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(basslineMelodyFrequencies[currentStepIndex % basslineMelodyFrequencies.length], playTime);
    
    let bassFilter = audioCtx.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(600, playTime);

    bassGain.gain.setValueAtTime(0.35, playTime);
    bassGain.gain.exponentialRampToValueAtTime(0.01, playTime + stepLengthTime - 0.02);

    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(musicGainNode);
    bassOsc.start(playTime);
    bassOsc.stop(playTime + stepLengthTime);
    if (currentStepIndex % 2 === 0 || currentStepIndex % 3 === 0) {
    let leadOsc = audioCtx.createOscillator();
    let leadGain = audioCtx.createGain();
    leadOsc.type = 'triangle';
    
    let noteChoice = leadArpeggioMelodyNotes[(currentStepIndex + 2) % leadArpeggioMelodyNotes.length];
    leadOsc.frequency.setValueAtTime(noteChoice, playTime);

    leadGain.gain.setValueAtTime(0.18, playTime);
    leadGain.gain.exponentialRampToValueAtTime(0.001, playTime + stepLengthTime * 1.5);

    leadOsc.connect(leadGain);
    leadGain.connect(musicGainNode);
    leadOsc.start(playTime);
    leadOsc.stop(playTime + stepLengthTime * 1.5);
    }
    currentStepIndex = (currentStepIndex + 1) % 16;
}

function beginSoundtrackPlaybackLoop() {
    if (isMusicPlaying) return;
    initAudio();
    isMusicPlaying = true;
    let speedMs = (60 / currentTempoBpm / 2) * 1000;
    musicPlaybackInterval = setInterval(soundTrackSchedulerLoop, speedMs);
}

// --- INTERACTIVE SYSTEM MOUSE AND PARALLAX EVENT CAPTURES ---
const customCursor = document.getElementById('customCursor');
const parallaxBgContainer = document.getElementById('parallaxBgContainer');

document.addEventListener('mousemove', (e) => {
    customCursor.style.left = e.clientX + 'px';
    customCursor.style.top = e.clientY + 'px';
});
window.addEventListener('scroll', () => {
    let scrolledAmount = window.scrollY;
    parallaxBgContainer.style.transform = `translateY(${scrolledAmount * 0.18}px)`;
});
document.addEventListener('mousedown', () => { customCursor.classList.add('clicking'); });
document.addEventListener('mouseup', () => { customCursor.classList.remove('clicking'); });
document.querySelectorAll('.target-box').forEach(box => {
    box.addEventListener('mouseenter', () => { playHoverSound(); });
});

// --- INITIAL INTRO SPLASH WINDOW LOGIC TIMELINES ---
const openingScreen = document.getElementById('openingScreen');
const textStage = document.getElementById('textStage');
const openingText = document.getElementById('openingText');
const loadingBar = document.getElementById('loadingBar');
const progressBarFill = document.getElementById('progressBarFill');
const flashOverlay = document.getElementById('flashOverlay');
const exitShade = document.getElementById('exitShade');
const achievementsPanel = document.getElementById('achievementsPanel');

window.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('introPlayed') === 'true') {
    openingScreen.style.display = 'none';
    document.body.classList.add('stage-logo-reveal', 'stage-menu-reveal');
    exitShade.classList.add('slide-in-active');
    beginSoundtrackPlaybackLoop();
    } else {
    progressBarFill.classList.add('animate-progress');

    setTimeout(() => {
        textStage.style.opacity = '0';
        textStage.style.transform = 'scale(0.95)';
    }, 2000);

    setTimeout(() => {
        loadingBar.style.display = 'none'; 
        openingText.innerText = 'BLOCKY STUDIO PRESENTS';
        textStage.style.opacity = '1';
        textStage.style.transform = 'scale(1)';
    }, 2500);

    setTimeout(() => { textStage.style.opacity = '0'; }, 4500);

    setTimeout(() => {
        flashOverlay.classList.add('flash-active');
        openingScreen.style.display = 'none';
        document.body.classList.add('stage-logo-reveal');
        sessionStorage.setItem('introPlayed', 'true');
        beginSoundtrackPlaybackLoop();
    }, 5000);

    setTimeout(() => { document.body.classList.add('stage-menu-reveal'); }, 6200);
    }
});
document.body.addEventListener('click', () => { beginSoundtrackPlaybackLoop(); }, { once: false });
// --- OUTBOUND NAVIGATION LINKS ---
document.addEventListener('click', function(e) {
    const targetLink = e.target.closest('.nav-link');
    if (targetLink) {
    e.preventDefault();
    const targetUrl = targetLink.getAttribute('href');

    if (targetUrl) {
        playSelectSound();
        
        setTimeout(() => {
        playWooshSound();
        exitShade.className = 'exit-shade'; 
        void exitShade.offsetWidth; 
        exitShade.classList.add('slide-out-active');
        }, 80);

        setTimeout(() => { window.location.href = targetUrl; }, 680);
    }
    }
});
// --- INTERACTIVE BUTTON TOGGLES FOR THE ACHIEVEMENT OVERLAY PANEL ---
const openPanelBtn = document.getElementById('openPanelBtn');
const closePanelBtn = document.getElementById('closePanelBtn');

openPanelBtn.addEventListener('click', () => {
    playSelectSound();
    achievementsPanel.classList.add('panel-active');
});
closePanelBtn.addEventListener('click', () => {
    playSelectSound();
    achievementsPanel.classList.remove('panel-active');
});

// --- LOAD AND DISPLAY ACHIEVEMENTS ---
function updateAchievementUI() {
    const achievements = JSON.parse(localStorage.getItem('gameAchievements')) || { hardRoundWins: 0, unlockedAchievements: [] };
    
    // Update achievement statuses
    const achHardWins = document.getElementById('ach-hard-wins');
    if (achHardWins) {
    if (achievements.unlockedAchievements.includes('hard-wins-5')) {
        achHardWins.innerText = 'UNLOCKED ✓';
        achHardWins.style.color = '#00ff00';
    } else {
        achHardWins.innerText = `LOCKED (${achievements.hardRoundWins}/5)`;
        achHardWins.style.color = '#aaaaaa';
    }
    }

    const achLongChase = document.getElementById('ach-long-chase');
    if (achLongChase) {
    if (achievements.unlockedAchievements.includes('long-chase')) {
        achLongChase.innerText = 'UNLOCKED ✓';
        achLongChase.style.color = '#00ff00';
    } else {
        achLongChase.innerText = 'LOCKED';
        achLongChase.style.color = '#aaaaaa';
    }
    }

    const achKing = document.getElementById('ach-king');
    if (achKing) {
    if (achievements.unlockedAchievements.includes('long-live-king')) {
        achKing.innerText = 'UNLOCKED ✓';
        achKing.style.color = '#00ff00';
    } else {
        achKing.innerText = 'LOCKED';
        achKing.style.color = '#aaaaaa';
    }
    }

    const achPerfect = document.getElementById('ach-perfect');
    if (achPerfect) {
    if (achievements.unlockedAchievements.includes('perfect-run')) {
        achPerfect.innerText = 'UNLOCKED ✓';
        achPerfect.style.color = '#00ff00';
    } else {
        achPerfect.innerText = 'LOCKED';
        achPerfect.style.color = '#aaaaaa';
    }
    }
}

window.addEventListener('DOMContentLoaded', updateAchievementUI);
window.addEventListener('load', updateAchievementUI);
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) updateAchievementUI();
});