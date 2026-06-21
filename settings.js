// ==========================================
// SETTINGS / STORAGE MANAGEMENT ARCHITECTURE
// ==========================================

// Default structural fallbacks
const DEFAULT_SETTINGS = {
    masterVolume: 80,
    musicVolume: 50,
    sfxVolume: 70,
    deafMode: false,
    staminaColor: "#00ffcc",     // Default Normal Colour
    lowStaminaColor: "#ff007f",  // Default Low Colour
    exhaustionColor: "#ff5e00",  // Default Exhaustion Colour
    showTimer: true,
    showItems: true
};

// Global helper to extract active settings profile anywhere
function loadGameSettings() {
    const stored = localStorage.getItem('tagRoyaleSettings');
    if (!stored) return DEFAULT_SETTINGS;
    try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch (e) {
        return DEFAULT_SETTINGS;
    }
}

// Check if we are currently sitting on the options interface page before execution
document.addEventListener("DOMContentLoaded", () => {
    const masterSlider = document.getElementById('master-vol');
    if (!masterSlider) return; // Not on settings page, safe break exit

    const musicSlider = document.getElementById('music-vol');
    const sfxSlider = document.getElementById('sfx-vol');
    const scoreCheck = document.getElementById('show-score');
    const timerCheck = document.getElementById('show-timer');
    const itemsCheck = document.getElementById('show-items');
    
    // Custom Native Color Picker Elements
    const staminaColorPicker = document.getElementById('stamina-color');
    const lowStaminaColorPicker = document.getElementById('low-stamina-color');
    const exhaustionColorPicker = document.getElementById('exhaustion-color');

    const resetBtn = document.querySelector('.btn-reset');
    const acceptBtn = document.querySelector('.btn-accept');
    const cancelBtn = document.querySelector('.btn-cancel');

    let audioCtx = null;
    let previewMasterGain = null;

    function initializePreviewAudio() {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        previewMasterGain = audioCtx.createGain();
        previewMasterGain.gain.setValueAtTime(1, audioCtx.currentTime);
        previewMasterGain.connect(audioCtx.destination);
    }

    function playPreviewSound(volume) {
        if (!window.AudioContext && !window.webkitAudioContext) return;
        initializePreviewAudio();

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

        osc.connect(gainNode).connect(previewMasterGain);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.12);
    }

    function getPreviewVolume(slider, sliderType) {
        const masterLevel = Number(masterSlider.value) / 100;
        const sliderLevel = Number(slider.value) / 100;

        if (sliderType === 'master') {
            return Math.max(0.01, masterLevel * 0.7);
        }
        return Math.max(0.01, masterLevel * sliderLevel * 0.8);
    }

    // Helper function to dynamically map an incoming settings block into the DOM controls
    function applySettingsToUI(settings) {
        masterSlider.value = settings.masterVolume;
        musicSlider.value = settings.musicVolume;
        sfxSlider.value = settings.sfxVolume;
        scoreCheck.checked = settings.showScore;
        timerCheck.checked = settings.showTimer;
        itemsCheck.checked = settings.showItems;

        if (staminaColorPicker) staminaColorPicker.value = settings.staminaColor;
        if (lowStaminaColorPicker) lowStaminaColorPicker.value = settings.lowStaminaColor;
        if (exhaustionColorPicker) exhaustionColorPicker.value = settings.exhaustionColor;
    }

    // Populate interface elements from current local profile logs on load
    const currentSettings = loadGameSettings();
    applySettingsToUI(currentSettings);

    masterSlider.addEventListener('input', (event) => {
        playPreviewSound(getPreviewVolume(event.target, 'master'));
    });
    musicSlider.addEventListener('input', (event) => {
        playPreviewSound(getPreviewVolume(event.target, 'music'));
    });
    sfxSlider.addEventListener('input', (event) => {
        playPreviewSound(getPreviewVolume(event.target, 'sfx'));
    });

    // Dynamic Reset back to original baseline configuration state
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            applySettingsToUI(DEFAULT_SETTINGS);
            playPreviewSound(getPreviewVolume(masterSlider, 'master'));
        });
    }

    // Save active UI state modifications into localStorage
    acceptBtn.addEventListener('click', () => {
        const payload = {
            masterVolume: parseInt(masterSlider.value, 10),
            musicVolume: parseInt(musicSlider.value, 10),
            sfxVolume: parseInt(sfxSlider.value, 10),
            staminaColor: staminaColorPicker ? staminaColorPicker.value : DEFAULT_SETTINGS.staminaColor,
            lowStaminaColor: lowStaminaColorPicker ? lowStaminaColorPicker.value : DEFAULT_SETTINGS.lowStaminaColor,
            exhaustionColor: exhaustionColorPicker ? exhaustionColorPicker.value : DEFAULT_SETTINGS.exhaustionColor,
            showScore: scoreCheck.checked,
            showTimer: timerCheck.checked,
            showItems: itemsCheck.checked
        };
        localStorage.setItem('tagRoyaleSettings', JSON.stringify(payload));
        window.location.href = 'index.html';
    });

    cancelBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
});