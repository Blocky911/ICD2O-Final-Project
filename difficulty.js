/**
 * Handles difficulty selection and redirects to the main game round
 * @param {string} level - The chosen difficulty ('easy', 'medium', 'hard')
 */


function showToast(message, duration = 3200) { // this function makes a toast that disappears after a set duration, defaulting to 3.2 seconds
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

function isImpossibleUnlocked() { // checks if the player has unlocked the "Impossible" difficulty by winning 5 hard rounds
    const achievements = JSON.parse(localStorage.getItem('gameAchievements')) || { unlockedAchievements: [] };
    return Array.isArray(achievements.unlockedAchievements) && achievements.unlockedAchievements.includes('hard-wins-5');
}

function selectDifficulty(level) { // handles the difficulty selection and redirects to the main game round
    if (!['easy', 'medium', 'hard', 'impossible'].includes(level)) {
        console.error("Invalid difficulty level selected:", level);
        return;
    }
    if (level === 'impossible' && !isImpossibleUnlocked()) {
        showToast('Impossible mode is locked. Win 5 hard rounds to unlock it.');
        return;
    }
    console.log("Difficulty chosen:", level);
    // Redirects to mainround.html, passing the choice dynamically via query parameters
    window.location.href = "mainround.html?diff=" + level; // parameter name 'diff' is used to identify the difficulty level in the next page
}

document.addEventListener('DOMContentLoaded', () => { // displays the lock for impossible mode if the player hasn't unlocked it yet
    const impossibleCard = document.querySelector('.diff-card.impossible');
    const impossibleBtn = document.querySelector('.diff-btn.impossible');
    if (!impossibleCard || !impossibleBtn) return;
    if (!isImpossibleUnlocked()) {
        impossibleCard.classList.add('locked');
        impossibleBtn.removeAttribute('disabled'); /* the button has to be kept unclickable
                                                      to allow the toast to clarify the achievement to earn */
        impossibleBtn.setAttribute('aria-disabled', 'true');
        impossibleBtn.title = 'Locked: Win 5 hard rounds to unlock';
    } else {
        impossibleCard.classList.remove('locked');
        impossibleBtn.removeAttribute('aria-disabled');
        impossibleBtn.title = '';
    }
});