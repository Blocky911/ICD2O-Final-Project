// ==========================================
// 1. DATA SYNCING FROM LOCALSTORAGE
// ==========================================

// Load values directly from the shared browser storage
let playerCoins = parseInt(localStorage.getItem('playerCoins')) || 100; 

let playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || {
    items: {
        energy_bar: 0,
        tomatoes: 0,
        gummy_bears: 0,
        fart_bomb: 0,
        potion: 0
    },
    skins: ['skin_default_red', 'bot_default_blue'] // Starter defaults
};

let equippedItems = JSON.parse(localStorage.getItem('equippedItems')) || {
    playerSkin: 'skin_default_red',
    botSkin: 'bot_default_blue'
};

// Save changes back to browser memory
function saveInventoryData() {
    localStorage.setItem('playerInventory', JSON.stringify(playerInventory));
    localStorage.setItem('equippedItems', JSON.stringify(equippedItems));
}

// ==========================================
// 2. RENDER THE CONTENT TO THE SCREEN
// ==========================================

function updateInventoryUI() {
    // 1. Sync the coins counter display at the top
    const coinDisplay = document.getElementById('player-coins');
    if (coinDisplay) {
        coinDisplay.innerText = playerCoins;
    }

    // 2. Scan and update quantity indicators for items/boosts
    // Looks for elements with IDs formatted like: id="inv-energy_bar"
    for (const itemId in playerInventory.items) {
        const itemTextElement = document.getElementById(`inv-${itemId}`);
        if (itemTextElement) {
            itemTextElement.innerText = `x${playerInventory.items[itemId]}`;
        }
    }

    // 3. Process action button states (EQUIPPED / EQUIP / LOCKED)
    updateSkinButtons();
}

function updateSkinButtons() {
    const buyButtons = document.querySelectorAll('.buy-btn');
    
    buyButtons.forEach(button => {
        // Read the onclick function to check which item string this card manages
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
                button.onclick = null; // Do nothing if clicked
            } else if (isOwned) {
                button.innerText = "EQUIP";
                button.className = "buy-btn owned"; 
                // Override button action to run our customization equip function
                button.onclick = function() { equipSkin(id); };
            } else {
                button.innerText = "LOCKED";
                button.className = "buy-btn locked"; 
                button.onclick = function() { alert("🔒 Purchase this skin from the shop first!"); };
            }
        }
    });
}

// ==========================================
// 3. SELECTION & EQUIPPING SYSTEM
// ==========================================

function equipSkin(id) {
    // Safety verification check
    if (!playerInventory.skins.includes(id)) {
        alert("Skin locked!");
        return;
    }

    // Route selection to the correct assignment key
    if (id.startsWith('skin_')) {
        equippedItems.playerSkin = id;
    } else if (id.startsWith('bot_')) {
        equippedItems.botSkin = id;
    }
    
    saveInventoryData();
    
    // Instantly refresh the UI to update active states cleanly
    updateInventoryUI();
}

// ==========================================
// 4. AUTOMATIC EXECUTION
// ==========================================
window.onload = function() {
    updateInventoryUI();
};