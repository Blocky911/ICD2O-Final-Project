// ==========================================
// SETTINGS / STORAGE MANAGEMENT ARCHITECTURE
// ==========================================

// Default structural fallbacks
const DEFAULT_SETTINGS = {
    masterVolume: 80,
    musicVolume: 50,
    sfxVolume: 70,
    deafMode: false,
    staminaColor: "#00ffcc",     // Default Green/Cyan
    lowStaminaColor: "#ff007f",  // Default Hot Pink
    showScore: true,
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
    const deafCheck = document.getElementById('colorblind-toggle');
    const scoreCheck = document.getElementById('show-score');
    const timerCheck = document.getElementById('show-timer');
    const itemsCheck = document.getElementById('show-items');
    
    // Custom Native Color Picker Elements
    const staminaColorPicker = document.getElementById('stamina-color');
    const lowStaminaColorPicker = document.getElementById('low-stamina-color');

    const resetBtn = document.querySelector('.btn-reset');
    const acceptBtn = document.querySelector('.btn-accept');
    const cancelBtn = document.querySelector('.btn-cancel');

    // Helper function to dynamically map an incoming settings block into the DOM controls
    function applySettingsToUI(settings) {
        masterSlider.value = settings.masterVolume;
        musicSlider.value = settings.musicVolume;
        sfxSlider.value = settings.sfxVolume;
        deafCheck.checked = settings.deafMode;
        scoreCheck.checked = settings.showScore;
        timerCheck.checked = settings.showTimer;
        itemsCheck.checked = settings.showItems;

        if (staminaColorPicker) staminaColorPicker.value = settings.staminaColor;
        if (lowStaminaColorPicker) lowStaminaColorPicker.value = settings.lowStaminaColor;
    }

    // Populate interface elements from current local profile logs on load
    const currentSettings = loadGameSettings();
    applySettingsToUI(currentSettings);

    // Dynamic Reset back to original baseline configuration state
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            applySettingsToUI(DEFAULT_SETTINGS);
        });
    }

    // Save active UI state modifications into localStorage
    acceptBtn.addEventListener('click', () => {
        const payload = {
            masterVolume: parseInt(masterSlider.value),
            musicVolume: parseInt(musicSlider.value),
            sfxVolume: parseInt(sfxSlider.value),
            deafMode: deafCheck.checked,
            staminaColor: staminaColorPicker ? staminaColorPicker.value : DEFAULT_SETTINGS.staminaColor,
            lowStaminaColor: lowStaminaColorPicker ? lowStaminaColorPicker.value : DEFAULT_SETTINGS.lowStaminaColor,
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