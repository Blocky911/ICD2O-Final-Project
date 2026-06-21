/**
 * Handles difficulty selection and redirects to the main game round
 * @param {string} level - The chosen difficulty ('easy', 'medium', 'hard')
 */
function showToast(message, duration = 3200) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, { once: true });
    }, duration);
}

function isImpossibleUnlocked() {
    const achievements = JSON.parse(localStorage.getItem('gameAchievements')) || { unlockedAchievements: [] };
    return Array.isArray(achievements.unlockedAchievements) && achievements.unlockedAchievements.includes('hard-wins-5');
}

function selectDifficulty(level) {
    if (level === 'impossible' && !isImpossibleUnlocked()) {
        showToast('Impossible mode is locked. Win 5 hard rounds to unlock it.');
        return;
    }
    console.log("Difficulty chosen:", level);
    // Redirects to mainround.html, passing the choice dynamically via query parameters
    window.location.href = "mainround.html?diff=" + level; // parameter name 'diff' is used to identify the difficulty level in the next page
}

document.addEventListener('DOMContentLoaded', () => {
    const impossibleCard = document.querySelector('.diff-card.impossible');
    const impossibleBtn = document.querySelector('.diff-btn.impossible');
    if (!impossibleCard || !impossibleBtn) return;
    if (!isImpossibleUnlocked()) {
        impossibleCard.classList.add('locked');
        // keep the button clickable so `selectDifficulty` can show the toast
        impossibleBtn.removeAttribute('disabled');
        impossibleBtn.setAttribute('aria-disabled', 'true');
        impossibleBtn.title = 'Locked: Win 5 hard rounds to unlock';
    } else {
        impossibleCard.classList.remove('locked');
        impossibleBtn.removeAttribute('aria-disabled');
        impossibleBtn.title = '';
    }
});