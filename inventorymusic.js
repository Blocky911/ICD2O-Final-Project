let invAudioCtx = null;
let invMasterVolume = null;
let invMusicGain = null;
let invMusicInterval = null;
let isInvMusicPlaying = false;

let invTempoBpm = 108; // Slower, swinging lounge pacing
let invStepIndex = 0;

const DEFAULT_INVENTORY_VOLUME_SETTINGS = {
    masterVolume: 80,
    musicVolume: 50,
    sfxVolume: 70
};

function loadInventoryVolumeSettings() {
    const stored = localStorage.getItem('tagRoyaleSettings');
    if (!stored) return DEFAULT_INVENTORY_VOLUME_SETTINGS;
    try {
    return { ...DEFAULT_INVENTORY_VOLUME_SETTINGS, ...JSON.parse(stored) };
    } catch (err) {
    return DEFAULT_INVENTORY_VOLUME_SETTINGS;
    }
}

// Smooth jazz-style chord progression loop (A-minor 7 variants)
const invBassNotes = [
    110.00, 110.00, 110.00, 146.83,  
    164.81, 164.81, 196.00, 220.00,  
    110.00, 110.00, 130.81, 146.83,  
    164.81, 130.81, 98.00,  87.31    
];

const invMelodyNotes = [
    440.00, 523.25, 587.33, 659.25,  
    392.00, 493.88, 587.33, 783.99,   
    523.25, 659.25, 783.99, 987.77,  
    440.00, 392.00, 349.23, 329.63   
];

function initInventoryAudio() {
    try {
    if (!invAudioCtx) {
        invAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        const settings = loadInventoryVolumeSettings();
        invMasterVolume = invAudioCtx.createGain();
        invMusicGain = invAudioCtx.createGain();

        invMasterVolume.gain.setValueAtTime(settings.masterVolume / 100, invAudioCtx.currentTime);
        invMusicGain.gain.setValueAtTime((settings.musicVolume / 100) * 0.25, invAudioCtx.currentTime);

        invMusicGain.connect(invMasterVolume);
        invMasterVolume.connect(invAudioCtx.destination);
    }
    if (invAudioCtx.state === 'suspended') {
        invAudioCtx.resume();
    }
    } catch(e) {
    console.error("Inventory audio context failed to initialize:", e);
    }
}

function playInventoryStep() {
    if (!invAudioCtx || invAudioCtx.state === 'suspended') return;

    let stepDuration = 60 / invTempoBpm;
    let playTime = invAudioCtx.currentTime + 0.01;

    // 1. Deep Sub-Bass Walking Line
    let bassOsc = invAudioCtx.createOscillator();
    let bassGain = invAudioCtx.createGain();
    let bassFilter = invAudioCtx.createBiquadFilter();

    bassOsc.type = 'sine'; 
    bassOsc.frequency.setValueAtTime(invBassNotes[invStepIndex % 16], playTime);
    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(280, playTime); 

    bassGain.gain.setValueAtTime(0.4, playTime);
    bassGain.gain.exponentialRampToValueAtTime(0.001, playTime + stepDuration - 0.02);

    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(invMusicGain);
    bassOsc.start(playTime);
    bassOsc.stop(playTime + stepDuration);

    // 2. Chill Rhythmic Synth Melody Counterpoint
    if (invStepIndex % 4 === 0 || invStepIndex % 4 === 3) {
    let melodyOsc = invAudioCtx.createOscillator();
    let melodyGain = invAudioCtx.createGain();
    let melodyFilter = invAudioCtx.createBiquadFilter();

    melodyOsc.type = 'triangle';
    let note = invMelodyNotes[(invStepIndex + 2) % 16];
    melodyOsc.frequency.setValueAtTime(note, playTime);
    melodyFilter.type = 'lowpass';
    melodyFilter.frequency.setValueAtTime(1200, playTime);

    melodyGain.gain.setValueAtTime(0.07, playTime);
    melodyGain.gain.exponentialRampToValueAtTime(0.001, playTime + stepDuration * 1.8);

    melodyOsc.connect(melodyFilter);
    melodyFilter.connect(melodyGain);
    melodyGain.connect(invMusicGain);
    
    melodyOsc.start(playTime);
    melodyOsc.stop(playTime + stepDuration * 1.8);
    }

    // 3. High-End Shaker Beat
    if (invStepIndex % 2 === 1) {
    let shakeOsc = invAudioCtx.createOscillator();
    let shakeGain = invAudioCtx.createGain();
    
    shakeOsc.type = 'triangle';
    shakeOsc.frequency.setValueAtTime(9500, playTime); 

    shakeGain.gain.setValueAtTime(0.01, playTime);
    shakeGain.gain.exponentialRampToValueAtTime(0.0001, playTime + 0.04);

    shakeOsc.connect(shakeGain);
    shakeGain.connect(invMusicGain);
    
    shakeOsc.start(playTime);
    shakeOsc.stop(playTime + 0.05);
    }

    invStepIndex = (invStepIndex + 1) % 16;
}

function startInventorySoundtrack() {
    initInventoryAudio();
    if (isInvMusicPlaying) return;
    isInvMusicPlaying = true;
    let intervalMs = (60 / invTempoBpm) * 1000;
    invMusicInterval = setInterval(playInventoryStep, intervalMs);
}

window.addEventListener('DOMContentLoaded', startInventorySoundtrack);
window.addEventListener('load', startInventorySoundtrack);
document.addEventListener('click', startInventorySoundtrack, { once: false });
document.addEventListener('keydown', startInventorySoundtrack, { once: false });