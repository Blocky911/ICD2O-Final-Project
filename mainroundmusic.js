let gameplayAudioCtx = null;
let masterGameplayVolumeNode = null;
let musicGainNode = null;
let sfxGainNode = null;
let guitarDistortionNode = null;
let snareNoiseBuffer = null;
let gameplayMusicInterval = null;
let isGameplayMusicPlaying = false;

let chaseTempoBpm = 142; 
let gameplayStepIndex = 0;
let lastSprintTimestamp = 0; // Throttles footstep sounds

function generateDistortionCurve(amount = 45) {
    let k = typeof amount === 'number' ? amount : 50;
    let n_samples = 44100;
    let curve = new Float32Array(n_samples);
    let deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
        let x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
}

function createNoiseBuffer() {
    let bufferSize = 44100 * 0.4;
    let buffer = gameplayAudioCtx.createBuffer(1, bufferSize, gameplayAudioCtx.sampleRate);
    let data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
}

const intenseBassMelody = [
    110.00, 110.00, 130.81, 103.83, 116.54, 116.54, 98.00, 103.83,
    110.00, 110.00, 146.83, 130.81, 164.81, 164.81, 130.81, 146.83,
    87.31,  87.31,  103.83, 92.50,  98.00,  98.00,  77.78, 87.31,
    73.42,  73.42,  87.31,  82.41,  98.00,  110.00, 123.47, 103.83
];

const guitarLeadMelody = [
    440.00, 440.00, 523.25, 493.88, 587.33, 523.25, 440.00, 493.88,
    440.00, 587.33, 659.25, 698.46, 659.25, 587.33, 523.25, 587.33,
    698.46, 698.46, 783.99, 659.25, 587.33, 587.33, 523.25, 493.88,
    440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 987.77, 1046.50
];

const rapidArpeggioNotes = [
    880.00, 1046.50, 1318.51, 1046.50, 783.99, 987.77, 1174.66, 987.77,
    1396.91, 1174.66, 1046.50, 880.00, 987.77, 1318.51, 1567.98, 1318.51,
    880.00, 1318.51, 1046.50, 1174.66, 1396.91, 1567.98, 1760.00, 1318.51,
    1174.66, 987.77, 880.00, 1046.50, 1174.66, 1318.51, 1567.98, 1975.53
];

function initGameplayAudio() {
    if (!gameplayAudioCtx) {
        gameplayAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        masterGameplayVolumeNode = gameplayAudioCtx.createGain();
        musicGainNode = gameplayAudioCtx.createGain();
        sfxGainNode = gameplayAudioCtx.createGain();
        const savedSettings = window.gameSettings || JSON.parse(localStorage.getItem('tagRoyaleSettings') || '{}');
        const masterVolume = savedSettings.masterVolume ?? 80;
        const musicVolume = savedSettings.musicVolume ?? 50;
        const sfxVolume = savedSettings.sfxVolume ?? 70;

        masterGameplayVolumeNode.gain.setValueAtTime(masterVolume / 100 * 0.08, gameplayAudioCtx.currentTime);
        musicGainNode.gain.setValueAtTime(musicVolume / 100, gameplayAudioCtx.currentTime);
        sfxGainNode.gain.setValueAtTime(sfxVolume / 100, gameplayAudioCtx.currentTime);
        
        guitarDistortionNode = gameplayAudioCtx.createWaveShaper();
        guitarDistortionNode.curve = generateDistortionCurve(68);
        guitarDistortionNode.oversample = '4x';

        snareNoiseBuffer = createNoiseBuffer();

        musicGainNode.connect(masterGameplayVolumeNode);
        sfxGainNode.connect(masterGameplayVolumeNode);
        guitarDistortionNode.connect(musicGainNode);
        masterGameplayVolumeNode.connect(gameplayAudioCtx.destination);
    }
    if (gameplayAudioCtx.state === 'suspended') {
        gameplayAudioCtx.resume();
    }
}

// ==========================================================
// DYNAMIC AUDIO GAMEPLAY SFX ENGINES
// ==========================================================

/**
 * Trigger a fast low thud sound effect whenever sprinting.
 * Throttled to 180ms intervals to emulate speed steps perfectly.
 */
function playSprintSound() {
    if (!gameplayAudioCtx) initGameplayAudio();
    let now = Date.now();
    if (now - lastSprintTimestamp < 180) return; 
    lastSprintTimestamp = now;

    let playTime = gameplayAudioCtx.currentTime;
    let osc = gameplayAudioCtx.createOscillator();
    let gain = gameplayAudioCtx.createGain();
    let filter = gameplayAudioCtx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(85, playTime);
    osc.frequency.linearRampToValueAtTime(30, playTime + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, playTime);

    // Independent volume routing bypasses master music slider room
    gain.gain.setValueAtTime(0.15, playTime);
    gain.gain.exponentialRampToValueAtTime(0.001, playTime + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGainNode);

    osc.start(playTime);
    osc.stop(playTime + 0.1);
}

/**
 * Trigger a sweeping retro laser sound effect whenever an item is used.
 */
function playItemUseSound() {
    if (!gameplayAudioCtx) initGameplayAudio();
    let playTime = gameplayAudioCtx.currentTime;
    
    let osc = gameplayAudioCtx.createOscillator();
    let gain = gameplayAudioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, playTime);
    osc.frequency.exponentialRampToValueAtTime(1200, playTime + 0.25);

    gain.gain.setValueAtTime(0.08, playTime);
    gain.gain.exponentialRampToValueAtTime(0.001, playTime + 0.28);

    osc.connect(gain);
    gain.connect(sfxGainNode);

    osc.start(playTime);
    osc.stop(playTime + 0.3);
}

/**
 * Trigger a high-pitch triumphant chime sequence when claiming the crown.
 */
function playCrownCatchSound() {
    if (!gameplayAudioCtx) initGameplayAudio();
    let playTime = gameplayAudioCtx.currentTime;
    
    // Generate a shining 3-note major arpeggio accord spread over split milliseconds
    const chimeNotes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    chimeNotes.forEach((freq, idx) => {
        let noteTime = playTime + (idx * 0.05);
        let osc = gameplayAudioCtx.createOscillator();
        let gain = gameplayAudioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.12, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);

        osc.connect(gain);
        gain.connect(sfxGainNode);

        osc.start(noteTime);
        osc.stop(noteTime + 0.45);
    });
}

// ==========================================================
// MUSIC CORE RHYTHM SECTIONS
// ==========================================================
function triggerSynthKick(playTime, duration) {
    let osc = gameplayAudioCtx.createOscillator();
    let gain = gameplayAudioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, playTime);
    osc.frequency.exponentialRampToValueAtTime(45, playTime + 0.12);
    gain.gain.setValueAtTime(0.8, playTime);
    gain.gain.exponentialRampToValueAtTime(0.001, playTime + duration * 1.2);
    osc.connect(gain);
    gain.connect(musicGainNode);
    osc.start(playTime);
    osc.stop(playTime + duration * 1.2);
}

function triggerSynthSnare(playTime, duration) {
    let noiseNode = gameplayAudioCtx.createBufferSource();
    let noiseFilter = gameplayAudioCtx.createBiquadFilter();
    let noiseGain = gameplayAudioCtx.createGain();
    noiseNode.buffer = snareNoiseBuffer;
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1000, playTime);
    noiseGain.gain.setValueAtTime(0.35, playTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, playTime + duration * 0.95);
    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(musicGainNode);

    let osc = gameplayAudioCtx.createOscillator();
    let oscGain = gameplayAudioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, playTime);
    oscGain.gain.setValueAtTime(0.4, playTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, playTime + 0.08);
    osc.connect(oscGain);
    oscGain.connect(musicGainNode);

    noiseNode.start(playTime);
    osc.start(playTime);
    noiseNode.stop(playTime + duration * 0.95);
    osc.stop(playTime + 0.08);
}

function playGameplayStep() {
    let stepDuration = 60 / chaseTempoBpm / 2; 
    let playTime = gameplayAudioCtx.currentTime + 0.01;
    let localBarStep = gameplayStepIndex % 16;

    if (localBarStep === 0 || localBarStep === 4 || localBarStep === 8 || localBarStep === 10 || localBarStep === 12) {
        triggerSynthKick(playTime, stepDuration);
    }
    if (localBarStep === 2 || localBarStep === 6 || localBarStep === 14) {
        triggerSynthSnare(playTime, stepDuration);
    }

    let bassOsc = gameplayAudioCtx.createOscillator();
    let bassGain = gameplayAudioCtx.createGain();
    let bassFilter = gameplayAudioCtx.createBiquadFilter();
    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(intenseBassMelody[gameplayStepIndex], playTime);
    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(420, playTime);
    bassGain.gain.setValueAtTime(0.32, playTime);
    bassGain.gain.exponentialRampToValueAtTime(0.01, playTime + stepDuration - 0.01);
    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(musicGainNode);
    bassOsc.start(playTime);
    bassOsc.stop(playTime + stepDuration);

    let shouldGuitarPlay = (gameplayStepIndex % 2 === 0) || (localBarStep === 12) || (localBarStep === 14);
    if (shouldGuitarPlay) {
        let guitarOsc = gameplayAudioCtx.createOscillator();
        let guitarGain = gameplayAudioCtx.createGain();
        let guitarFilter = gameplayAudioCtx.createBiquadFilter();
        
        guitarOsc.type = 'sawtooth';
        let baseFreq = guitarLeadMelody[gameplayStepIndex];
        guitarOsc.frequency.setValueAtTime(baseFreq, playTime);
        guitarOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.985, playTime + stepDuration * 1.4);

        guitarFilter.type = 'bandpass';
        if (localBarStep === 12 || localBarStep === 14) {
            guitarFilter.frequency.setValueAtTime(1650, playTime);
            guitarFilter.Q.setValueAtTime(4.5, playTime);
        } else {
            guitarFilter.frequency.setValueAtTime(1150, playTime);
            guitarFilter.Q.setValueAtTime(2.2, playTime);
        }

        guitarGain.gain.setValueAtTime(0.25, playTime);
        guitarGain.gain.linearRampToValueAtTime(0.18, playTime + 0.025);
        guitarGain.gain.exponentialRampToValueAtTime(0.002, playTime + stepDuration * 1.8);

        guitarOsc.connect(guitarFilter);
        guitarFilter.connect(guitarGain);
        guitarGain.connect(guitarDistortionNode);
        guitarOsc.start(playTime);
        guitarOsc.stop(playTime + stepDuration * 1.8);
    }

    if (gameplayStepIndex % 4 === 1 || gameplayStepIndex % 6 === 3) {
        let arpOsc = gameplayAudioCtx.createOscillator();
        let arpGain = gameplayAudioCtx.createGain();
        arpOsc.type = 'triangle';
        let arpNote = rapidArpeggioNotes[gameplayStepIndex];
        arpOsc.frequency.setValueAtTime(arpNote, playTime);
        arpGain.gain.setValueAtTime(0.04, playTime);
        arpGain.gain.exponentialRampToValueAtTime(0.001, playTime + stepDuration * 0.85);
        arpOsc.connect(arpGain);
        arpGain.connect(musicGainNode);
        arpOsc.start(playTime);
        arpOsc.stop(playTime + stepDuration * 0.85);
    }

    gameplayStepIndex = (gameplayStepIndex + 1) % 32;
}

function startChaseSoundtrack() {
    if (isGameplayMusicPlaying) return;
    initGameplayAudio();
    isGameplayMusicPlaying = true;
    let intervalMs = (60 / chaseTempoBpm / 2) * 1000;
    gameplayMusicInterval = setInterval(playGameplayStep, intervalMs);
}

window.addEventListener('DOMContentLoaded', () => { startChaseSoundtrack(); });
document.body.addEventListener('click', () => { startChaseSoundtrack(); }, { once: false });