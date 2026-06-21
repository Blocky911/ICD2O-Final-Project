/**
 * Handles difficulty selection and redirects to the main game round
 * @param {string} level - The chosen difficulty ('easy', 'medium', 'hard')
 */
function selectDifficulty(level) {
    console.log("Difficulty chosen:", level);
    // Redirects to mainround.html, passing the choice dynamically via query parameters
    window.location.href = "mainround.html?diff=" + level; // parameter name 'diff' is used to identify the difficulty level in the next page
}