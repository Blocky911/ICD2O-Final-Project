// --- 1. LOAD SHARED GAME DATA ---
let playerCoins = parseInt(localStorage.getItem('playerCoins')) || 100;

let playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || {
    items: {
        energy_bar: 0,
        tomatoes: 0,
        gummy_bears: 0,
        fart_bomb: 0,
        potion: 0
    },
    skins: ['skin_default_red', 'bot_default_blue']
};

let equippedItems = JSON.parse(localStorage.getItem('equippedItems')) || {
    playerSkin: 'skin_default_red',
    botSkin: 'bot_default_blue'
};

function saveInventoryData() {
    localStorage.setItem('playerInventory', JSON.stringify(playerInventory));
    localStorage.setItem('equippedItems', JSON.stringify(equippedItems));
}

// --- 2. UPDATE SCREEN STATE ---
function updateInventoryUI() {
    // Coins indicator
    const coinDisplay = document.getElementById('player-coins');
    if (coinDisplay) coinDisplay.innerText = playerCoins;

    // Item counters text update
    for (const itemId in playerInventory.items) {
        const itemTextElement = document.getElementById(`inv-${itemId}`);
        if (itemTextElement) {
            itemTextElement.innerText = `x${playerInventory.items[itemId]}`;
        }
    }

    // Process selection buttons for skins
    const actionButtons = document.querySelectorAll('.buy-btn');
    actionButtons.forEach(button => {
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
                button.onclick = null; 
            } else if (isOwned) {
                button.innerText = "EQUIP";
                button.className = "buy-btn owned";
                button.onclick = function() { equipSkin(id); };
            } else {
                button.innerText = "LOCKED";
                button.className = "buy-btn locked";
                button.onclick = function() { alert("🔒 Unlock this customization in the Shop."); };
            }
        }
    });
}

// --- 3. EQUIP CONFIGURATION ---
function equipSkin(id) {
    if (!playerInventory.skins.includes(id)) return;

    if (id.startsWith('skin_')) {
        equippedItems.playerSkin = id;
    } else if (id.startsWith('bot_')) {
        equippedItems.botSkin = id;
    }

    saveInventoryData();
    updateInventoryUI();
}

// Run on view load
window.onload = function() {
    updateInventoryUI();
};