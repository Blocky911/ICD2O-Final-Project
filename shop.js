// --- 1. LOAD SAVED DATA ---
let playerCoins = parseInt(localStorage.getItem('playerCoins')) || 100;

let playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || {
    items: {
        energy_bar: 0,
        tomatoes: 0,
        gummy_bears: 0,
        fart_bomb: 0,
        potion: 0
    },
    skins: ['skin_default_red', 'bot_default_blue'] // Starter skins
};

let equippedItems = JSON.parse(localStorage.getItem('equippedItems')) || {
    playerSkin: 'skin_default_red',
    botSkin: 'bot_default_blue'
};

// --- 2. SAVE DATA FUNCTION ---
function saveGameData() {
    localStorage.setItem('playerCoins', playerCoins);
    localStorage.setItem('playerInventory', JSON.stringify(playerInventory));
    localStorage.setItem('equippedItems', JSON.stringify(equippedItems));
}

// --- 3. UPDATE SHOP UI ---
function updateShopUI() {
    // Update coin display
    const coinDisplay = document.getElementById('player-coins');
    if (coinDisplay) coinDisplay.innerText = playerCoins;

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

    // If it's a skin they already bought, don't charge them again
    if (isSkin && playerInventory.skins.includes(id)) {
        alert("You already own this skin! Check your inventory to equip it.");
        return;
    }

    // Check if player can afford it
    if (playerCoins < price) {
        alert("❌ Not enough coins!");
        return;
    }

    // Deduct coins
    playerCoins -= price;

    if (isSkin) {
        // Add skin permanently
        playerInventory.skins.push(id);
        alert("🎉 Skin purchased! It is now available in your Inventory.");
    } else {
        // Add consumable item count
        playerInventory.items[id] = (playerInventory.items[id] || 0) + 1;
        alert(`🛒 Item purchased! Sent to your Inventory (Total: ${playerInventory.items[id]}).`);
    }

    // Save and refresh UI
    saveGameData();
    updateShopUI();
}

// Run when shop page opens
window.onload = function() {
    updateShopUI();
};