let shopAudioCtx = null;
let shopMasterVolume = null;
let shopMusicGain = null;
let shopSfxGain = null;
let shopMusicInterval = null;
let isShopMusicPlaying = false;

let shopTempoBpm = 115; 
let shopStepIndex = 0;

const DEFAULT_SHOP_VOLUME_SETTINGS = {
    masterVolume: 80,
    musicVolume: 50,
    sfxVolume: 70
};

function loadShopVolumeSettings() {
    const stored = localStorage.getItem('tagRoyaleSettings');
    if (!stored) return DEFAULT_SHOP_VOLUME_SETTINGS;
    try {
    return { ...DEFAULT_SHOP_VOLUME_SETTINGS, ...JSON.parse(stored) };
    } catch (err) {
    return DEFAULT_SHOP_VOLUME_SETTINGS;
    }
}

const shopBassNotes = [
    130.81, 130.81, 130.81, 130.81,  
    146.83, 146.83, 146.83, 146.83,  
    174.61, 174.61, 174.61, 174.61,  
    220.00, 220.00, 196.00, 164.81   
];

const shopMelodyNotes = [
    261.63, 329.63, 392.00, 523.25,  
    293.66, 349.23, 440.00, 587.33,  
    349.23, 440.00, 523.25, 698.46,  
    440.00, 523.25, 392.00, 329.63   
];

function initShopAudio() {
    try {
        if (!shopAudioCtx) {
            shopAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const settings = loadShopVolumeSettings();

            shopMasterVolume = shopAudioCtx.createGain();
            shopMusicGain = shopAudioCtx.createGain();
            shopSfxGain = shopAudioCtx.createGain();

            shopMasterVolume.gain.setValueAtTime(settings.masterVolume / 100, shopAudioCtx.currentTime);
            shopMusicGain.gain.setValueAtTime((settings.musicVolume / 100) * 0.25, shopAudioCtx.currentTime);
            shopSfxGain.gain.setValueAtTime(settings.sfxVolume / 100, shopAudioCtx.currentTime);

            shopMusicGain.connect(shopMasterVolume);
            shopSfxGain.connect(shopMasterVolume);
            shopMasterVolume.connect(shopAudioCtx.destination);
        }
        if (shopAudioCtx.state === 'suspended') {
            shopAudioCtx.resume();
        }
    } catch(e) {
        console.error("Audio Context failed to initialize:", e);
    }
}

function playCoinBuySound() {
    initShopAudio();
    if (!shopAudioCtx) return;
    
    let playTime = shopAudioCtx.currentTime;

    let osc1 = shopAudioCtx.createOscillator();
    let gain1 = shopAudioCtx.createGain();
    osc1.type = 'square'; 
    osc1.frequency.setValueAtTime(987.77, playTime); 
    gain1.gain.setValueAtTime(0.06, playTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, playTime + 0.08);
    osc1.connect(gain1);
    gain1.connect(shopSfxGain);

    let osc2 = shopAudioCtx.createOscillator();
    let gain2 = shopAudioCtx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1318.51, playTime + 0.07); 
    gain2.gain.setValueAtTime(0.06, playTime + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.001, playTime + 0.35);
    osc2.connect(gain2);
    gain2.connect(shopSfxGain);

    osc1.start(playTime);
    osc1.stop(playTime + 0.09);
    osc2.start(playTime + 0.07);
    osc2.stop(playTime + 0.36);
}

function playShopStep() {
    if (!shopAudioCtx || shopAudioCtx.state === 'suspended') return;

    let stepDuration = 60 / shopTempoBpm; 
    let playTime = shopAudioCtx.currentTime + 0.01;

    let bassOsc = shopAudioCtx.createOscillator();
    let bassGain = shopAudioCtx.createGain();
    let bassFilter = shopAudioCtx.createBiquadFilter();
    bassOsc.type = 'triangle'; 
    bassOsc.frequency.setValueAtTime(shopBassNotes[shopStepIndex % 16], playTime);
    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(350, playTime); 
    bassGain.gain.setValueAtTime(0.35, playTime);
    bassGain.gain.exponentialRampToValueAtTime(0.001, playTime + stepDuration - 0.05);
    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(shopMusicGain);
    bassOsc.start(playTime);
    bassOsc.stop(playTime + stepDuration);

    if (shopStepIndex % 2 === 0) {
        let synthOsc = shopAudioCtx.createOscillator();
        let synthGain = shopAudioCtx.createGain();
        synthOsc.type = 'sine'; 
        let noteSelection = shopMelodyNotes[(shopStepIndex + 4) % 16];
        synthOsc.frequency.setValueAtTime(noteSelection, playTime);
        synthGain.gain.setValueAtTime(0.12, playTime);
        synthGain.gain.exponentialRampToValueAtTime(0.001, playTime + stepDuration * 1.5);
        synthOsc.connect(synthGain);
        synthGain.connect(shopMusicGain);
        synthOsc.start(playTime);
        synthOsc.stop(playTime + stepDuration * 1.5);
    }

    if (shopStepIndex % 4 !== 0) {
        let tickOsc = shopAudioCtx.createOscillator();
        let tickGain = shopAudioCtx.createGain();
        tickOsc.type = 'triangle';
        tickOsc.frequency.setValueAtTime(8000, playTime); 
        tickGain.gain.setValueAtTime(0.015, playTime);
        tickGain.gain.exponentialRampToValueAtTime(0.0001, playTime + 0.03);
        tickOsc.connect(tickGain);
        tickGain.connect(shopMusicGain);
        tickOsc.start(playTime);
        tickOsc.stop(playTime + 0.04);
    }

    shopStepIndex = (shopStepIndex + 1) % 16;
}

function startShopSoundtrack() {
    initShopAudio();
    if (isShopMusicPlaying) return;
    isShopMusicPlaying = true;
    let intervalMs = (60 / shopTempoBpm) * 1000;
    shopMusicInterval = setInterval(playShopStep, intervalMs);
}

window.addEventListener('DOMContentLoaded', startShopSoundtrack);
window.addEventListener('load', startShopSoundtrack);
document.addEventListener('click', startShopSoundtrack, { once: false });
document.addEventListener('keydown', startShopSoundtrack, { once: false });