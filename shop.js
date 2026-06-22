// --- 1. LOAD SAVED DATA (Fixed: Default to 0, strict validation avoids resetting 0 coins) ---
let playerCoins = localStorage.getItem('playerCoins') !== null ? parseInt(localStorage.getItem('playerCoins')) : 0;
let playerPoints = localStorage.getItem('playerPoints') !== null ? parseInt(localStorage.getItem('playerPoints')) : 0;

function loadStoredInventory() {
    let stored = {};
    try {
        stored = JSON.parse(localStorage.getItem('playerInventory') || '{}');
    } catch (err) {
        console.warn('Invalid playerInventory data, resetting defaults.', err);
        stored = {};
    }

    return {
        items: { /* FIXED: default values don't line up with values in inventory.js (was all 0)  */
            energy_bar: 5,     
            tomatoes: 0,
            gummy_bears: 3,    
            fart_bomb: 1,      
            potion: 1,         
            ...((stored.items && typeof stored.items === 'object') ? stored.items : {})
        },
        skins: Array.isArray(stored.skins) ? stored.skins : ['skin_default_red', 'bot_default_blue']
    };
}

function loadStoredEquippedItems() {
    let stored = {};
    try {
        stored = JSON.parse(localStorage.getItem('equippedItems') || '{}');
    } catch (err) {
        console.warn('Invalid equippedItems data, resetting defaults.', err);
        stored = {};
    }

    return {
        playerSkin: typeof stored.playerSkin === 'string' ? stored.playerSkin : 'skin_default_red',
        botSkin: typeof stored.botSkin === 'string' ? stored.botSkin : 'bot_default_blue'
    };
}

let playerInventory = loadStoredInventory();
let equippedItems = loadStoredEquippedItems();

// --- 2. SAVE DATA FUNCTION ---
function saveGameData() {
    localStorage.setItem('playerCoins', playerCoins);
    localStorage.setItem('playerPoints', playerPoints);
    localStorage.setItem('playerInventory', JSON.stringify(playerInventory));
    localStorage.setItem('equippedItems', JSON.stringify(equippedItems));
}

// --- 2a. TOAST HELPERS ---
function showToast(message, type = 'info', duration = 3200) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️'}</div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" aria-label="Close">×</button>
    `;

    const removeToast = () => {
        toast.style.animation = 'toast-out 0.18s ease forwards';
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };

    toast.querySelector('.toast-close').onclick = (event) => {
        event.stopPropagation();
        removeToast();
    };

    container.appendChild(toast);
    setTimeout(removeToast, duration);
}

// --- 3. UPDATE SHOP UI ---
// --- Shop item descriptions (copied from inventory) ---
const SHOP_ITEM_DESCRIPTIONS = {
    energy_bar: 'Restores your stamina bar completely and removes exhaustion.',
    tomatoes: 'Stuns your opponent for 6 seconds, preventing them from moving or tagging.',
    gummy_bears: 'Grants a 15-second speed boost followed by a slowdown period.',
    fart_bomb: 'Stuns your opponent for 15 seconds. Much more powerful than tomatoes!',
    potion: 'Makes you immune to one tag. Wears off after you get tagged.'
};

// Attach info button handlers to show descriptions via toast
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.info-btn[data-item]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-item');
            const desc = SHOP_ITEM_DESCRIPTIONS[id] || 'No description available.';
            showToast(desc, 'info', 4200);
        });
    });
});

function updateShopUI() {
    // Update coin display
    const coinDisplay = document.getElementById('player-coins');
    if (coinDisplay) coinDisplay.innerText = playerCoins;

    // Update points progress tracker display
    const pointsDisplay = document.getElementById('player-points-display');
    if (pointsDisplay) pointsDisplay.innerText = `${playerPoints}/50`;

    // Update buttons dynamically based on ownership
    const buyButtons = document.querySelectorAll('.buy-btn');
    buyButtons.forEach(button => {
        const clickAttr = button.getAttribute('onclick');
        if (!clickAttr) return;

        const match = clickAttr.match(/['"]([^'"]+)['"]/);
        if (!match) return;

        const id = match[1];
        const isSkin = id.startsWith('skin_') || id.startsWith('bot_');

        if (isSkin) {
            const isOwned = playerInventory.skins.includes(id);
            const isEquipped = (equippedItems.playerSkin === id || equippedItems.botSkin === id);

            if (isEquipped) {
                button.innerText = "EQUIPPED";
                button.className = "buy-btn equipped";
            } else if (isOwned) {
                button.innerText = "OWNED";
                button.className = "buy-btn owned";
            }
        }
    });
}

// --- 4. BUY CORE LOGIC ---
function buyItem(id, price) {
    const isSkin = id.startsWith('skin_') || id.startsWith('bot_');

    if (isSkin && playerInventory.skins.includes(id)) {
        showToast("You already own this skin! Check your inventory to equip it.", 'info');
        return;
    }

    if (playerCoins < price) {
        showToast("❌ Not enough coins!", 'error');
        return;
    }

    playerCoins -= price;

    if (isSkin) {
        playerInventory.skins.push(id);
        showToast("🎉 Skin purchased! It is now available in your Inventory.", 'success');
    } else {
        playerInventory.items[id] = (playerInventory.items[id] || 0) + 1;
        showToast(`🛒 Item purchased! Sent to your Inventory (Total: ${playerInventory.items[id]}).`, 'success');
    }

    saveGameData();
    updateShopUI();
}
if (typeof playCoinBuySound === 'function') {
    playCoinBuySound();
}
window.onload = function() {
    updateShopUI();
};