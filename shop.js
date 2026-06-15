// ==========================================
// 1. INITIALIZE DATA & STORAGE
// ==========================================

// Load player coins (Default to 100 if new player)
let playerCoins = parseInt(localStorage.getItem('playerCoins')) || 100; 

// Load inventory (Consumables amounts and unlocked skin IDs)
let playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || {
    items: {
        energy_bar: 0,
        tomatoes: 0,
        gummy_bears: 0,
        fart_bomb: 0,
        potion: 0
    },
    skins: ['skin_default_red', 'bot_default_blue'] // Starter skins unlocked by default
};

// Load currently active/equipped skins
let equippedItems = JSON.parse(localStorage.getItem('equippedItems')) || {
    playerSkin: 'skin_default_red',
    botSkin: 'bot_default_blue'
};

// Save current state back to the browser storage
function saveGameData() {
    localStorage.setItem('playerCoins', playerCoins);
    localStorage.setItem('playerInventory', JSON.stringify(playerInventory));
    localStorage.setItem('equippedItems', JSON.stringify(equippedItems));
}

// ==========================================
// 2. DYNAMIC UI UPDATING
// ==========================================

function updateUI() {
    // 1. Update general coin balance on whatever page the user is viewing
    const coinDisplay = document.getElementById('player-coins');
    if (coinDisplay) {
        coinDisplay.innerText = playerCoins;
    }

    // 2. INVENTORY PAGE ONLY: Update item counts text if elements exist
    // Loops through item IDs (energy_bar, tomatoes, etc.) and looks for a matching HTML element
    for (const itemId in playerInventory.items) {
        const itemElement = document.getElementById(`inv-${itemId}`);
        if (itemElement) {
            itemElement.innerText = `x${playerInventory.items[itemId]}`;
        }
    }

    // 3. SHOP & INVENTORY PAGES: Update Skin Button States (Equipped / Equip / Buy)
    // This looks for buttons across your grids to dynamically change their text
    updateSkinButtons();
}

function updateSkinButtons() {
    // Find all item cards or purchase buttons on the page
    const buyButtons = document.querySelectorAll('.buy-btn');
    
    buyButtons.forEach(button => {
        // Find the 'onclick' attribute to see what item ID this button belongs to
        const clickAttr = button.getAttribute('onclick');
        if (!clickAttr) return;

        // Parse out the item ID from the onclick function text (e.g., "buyItem('skin_nugget', 15)")
        const match = clickAttr.match(/['"]([^'"]+)['"]/);
        if (!match) return;
        
        const id = match[1];
        const isSkin = id.startsWith('skin_') || id.startsWith('bot_');

        if (isSkin) {
            const isOwned = playerInventory.skins.includes(id);
            const isEquipped = (equippedItems.playerSkin === id || equippedItems.botSkin === id);

            if (isEquipped) {
                button.innerText = "EQUIPPED";
                button.className = "buy-btn equipped"; // Adds equipped styling class
                // Change onclick behavior temporarily to do nothing if already equipped
                button.setAttribute('data-old-onclick', clickAttr);
                button.onclick = null; 
            } else if (isOwned) {
                button.innerText = "EQUIP";
                button.className = "buy-btn owned"; // Adds owned styling class
                // Override the purchase function and allow them to equip it directly
                button.onclick = function() { equipSkin(id); };
            }
        }
    });
}

// ==========================================
// 3. ECONOMY & CORE FUNCTIONS
// ==========================================

// Main Function called when clicking a store item
function buyItem(id, price) {
    // Verify affordability
    if (playerCoins < price) {
        alert("❌ Not enough coins!");
        return;
    }

    const isSkin = id.startsWith('skin_') || id.startsWith('bot_');

    if (isSkin) {
        // Safety check if they already own it
        if (playerInventory.skins.includes(id)) {
            equipSkin(id);
            return;
        }
        
        // Process Skin Purchase
        playerCoins -= price;
        playerInventory.skins.push(id);
        saveGameData();
        alert(`🎉 Successfully purchased skin!`);
        equipSkin(id); // Instantly auto-equip upon buying
        
    } else {
        // Process Consumable Item Purchase
        playerCoins -= price;
        playerInventory.items[id] = (playerInventory.items[id] || 0) + 1;
        saveGameData();
        alert(`🛒 Item added to your inventory! Total: ${playerInventory.items[id]}`);
    }

    // Refresh UI text and buttons everywhere
    updateUI();
}

// Function to handle switching equipped characters
function equipSkin(id) {
    // Determine if it belongs to the playable character or the opponent bot
    if (id.startsWith('skin_')) {
        if (playerInventory.skins.includes(id)) {
            equippedItems.playerSkin = id;
            alert("👤 Player skin equipped!");
        }
    } else if (id.startsWith('bot_')) {
        if (playerInventory.skins.includes(id)) {
            equippedItems.botSkin = id;
            alert("🤖 Bot skin equipped!");
        }
    }
    
    saveGameData();
    
    // Hard reload button click states to make sure visual text updates smoothly
    window.location.reload(); 
}

// ==========================================
// 4. PAGE INITIALIZATION
// ==========================================

// Run every time a page loading this script finishes rendering
window.onload = function() {
    updateUI();
};