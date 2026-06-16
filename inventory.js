// --- 1. LOAD DATA (SHARED FROM THE SHOP) ---
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

// --- 2. SAVE INVENTORY SELECTIONS ---
function saveInventoryData() {
    localStorage.setItem('playerInventory', JSON.stringify(playerInventory));
    localStorage.setItem('equippedItems', JSON.stringify(equippedItems));
}

// --- 3. UPDATE INVENTORY UI ---
function updateInventoryUI() {
    // Sync coins display
    const coinDisplay = document.getElementById('player-coins');
    if (coinDisplay) coinDisplay.innerText = playerCoins;

    // Sync item quantities on your inventory cards (targets id="inv-energy_bar", etc.)
    for (const itemId in playerInventory.items) {
        const itemTextElement = document.getElementById(`inv-${itemId}`);
        if (itemTextElement) {
            itemTextElement.innerText = `x${playerInventory.items[itemId]}`;
        }
    }

    // Handle button text switching (EQUIPPED / EQUIP / LOCKED)
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
                button.onclick = null; // Do nothing if already active
            } else if (isOwned) {
                button.innerText = "EQUIP";
                button.className = "buy-btn owned";
                // Changes the click action to run the equip function instead of buying
                button.onclick = function() { equipSkin(id); };
            } else {
                button.innerText = "LOCKED";
                button.className = "buy-btn locked";
                button.onclick = function() { alert("🔒 Unlock this skin in the shop first!"); };
            }
        }
    });
}

// --- 4. EQUIP SELECTION LOGIC ---
function equipSkin(id) {
    if (!playerInventory.skins.includes(id)) return;

    if (id.startsWith('skin_')) {
        equippedItems.playerSkin = id;
        alert("👤 Character skin equipped!");
    } else if (id.startsWith('bot_')) {
        equippedItems.botSkin = id;
        alert("🤖 Bot skin equipped!");
    }

    saveInventoryData();
    updateInventoryUI(); // Refreshes text states smoothly
}

// Run when inventory page opens
window.onload = function() {
    updateInventoryUI();
};