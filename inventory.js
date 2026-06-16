// --- 1. DEFINE BASE ITEM DATABASE DATA ---
const GAME_ITEM_DATABASE = {
    // Consumables
    'energy_bar': { name: 'Energy Bar', type: 'item', art: '🔋', desc: 'Provides a quick burst of speed during matches!' },
    'tomatoes': { name: 'Rotten Tomatoes', type: 'item', art: '🍅', desc: 'Throw it to slow down the runner bot!' },
    'gummy_bears': { name: 'Gummy Bears', type: 'item', art: '🧸', desc: 'A tasty treat that keeps your stamina restored.' },
    'fart_bomb': { name: 'Fart Bomb', type: 'item', art: '💣', desc: 'Blasts your opponents backward with area knockback!' },
    'potion': { name: 'Untagable Potion', type: 'item', art: '🧪', desc: 'Makes you completely immune to tags for a short time.' },
    
    // Player Skins
    'skin_default_red': { name: 'Default Red', type: 'playerSkin', art: '🔴', desc: 'Your base starter character model.' },
    'skin_nugget': { name: 'Nugget', type: 'playerSkin', art: '🍗', desc: 'A legendary crispy chicken cosmetic skin.' },
    'skin_george': { name: 'George Monkey', type: 'playerSkin', art: '🐒', desc: 'Go bananas and outrun everyone with this look.' },
    'skin_john': { name: 'John Pork', type: 'playerSkin', art: '🐷', desc: 'The internet icon pig skin is calling you.' },
    
    // Bot Skins
    'bot_default_blue': { name: 'Default Blue', type: 'botSkin', art: '🔵', desc: 'The classic, base enemy bot look.' },
    'bot_stealer': { name: 'Food Stealer', type: 'botSkin', art: '🦝', desc: 'Transform your bot tracker into a sneaky raccoon.' },
    'bot_mcrae': { name: 'Mr. McRae', type: 'botSkin', art: '👨‍🏫', desc: 'Give your opponent bot a sophisticated school teacher look.' },
    'bot_evil': { name: 'Evil Nugget', type: 'botSkin', art: '😈', desc: 'Turn your hunter bot into a menacing spicy nugget.' }
};

// --- 2. RETRIEVE STORAGE PERSISTENCE ---
let playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || {
    items: { energy_bar: 0, tomatoes: 0, gummy_bears: 0, fart_bomb: 0, potion: 0 },
    skins: ['skin_default_red', 'bot_default_blue']
};

let equippedItems = JSON.parse(localStorage.getItem('equippedItems')) || {
    playerSkin: 'skin_default_red',
    botSkin: 'bot_default_blue'
};

let selectedItemId = null; // Track currently highlighted grid element

// --- 3. CONSTRUCT THE GRID VIEW ---
function populateInventoryGrid() {
    const gridContainer = document.getElementById('items-scroll-grid');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = ''; // Clear view

    // Loop through all defined global items to draw them into grid boxes
    for (const id in GAME_ITEM_DATABASE) {
        const itemInfo = GAME_ITEM_DATABASE[id];
        
        const slotDiv = document.createElement('div');
        slotDiv.className = 'grid-item-box';
        slotDiv.id = `grid-box-${id}`;
        
        // Determine lock/count status layer
        let overlayText = '';
        if (itemInfo.type === 'item') {
            overlayText = `x${playerInventory.items[id] || 0}`;
        } else {
            const isOwned = playerInventory.skins.includes(id);
            const isEquipped = (equippedItems.playerSkin === id || equippedItems.botSkin === id);
            if (isEquipped) overlayText = 'E';
            else if (!isOwned) overlayText = '🔒';
        }

        slotDiv.innerHTML = `
            <div class="box-art">${itemInfo.art}</div>
            <div class="box-name">${itemInfo.name}</div>
            <span class="box-badge">${overlayText}</span>
        `;
        
        // Add item selection action listener
        slotDiv.onclick = () => selectItem(id);
        gridContainer.appendChild(slotDiv);
    }
}

// --- 4. DETAILS PANELS UPDATE LOGIC ---
function selectItem(id) {
    selectedItemId = id;
    const item = GAME_ITEM_DATABASE[id];
    
    // Highlight selected cell item on screen visually
    document.querySelectorAll('.grid-item-box').forEach(box => box.classList.remove('active-selection'));
    document.getElementById(`grid-box-${id}`).classList.add('active-selection');

    // Swap texts out dynamically
    document.getElementById('preview-art').innerText = item.art;
    document.getElementById('preview-title').innerText = item.name;
    document.getElementById('preview-desc').innerText = item.desc;

    const actionBtn = document.getElementById('inventory-action-btn');
    const statsContainer = document.getElementById('preview-stats');

    // Handle button behavior conditional branching logic
    if (item.type === 'item') {
        const count = playerInventory.items[id] || 0;
        statsContainer.innerText = `Stockpile Account: ${count} owned`;
        actionBtn.innerText = "CONSUMABLE BOOST";
        actionBtn.className = "action-btn-utility";
        actionBtn.disabled = true; // Consumables get activated inside active matches instead!
    } else {
        // Handle cosmetic skins
        const isOwned = playerInventory.skins.includes(id);
        const isEquipped = (equippedItems.playerSkin === id || equippedItems.botSkin === id);

        if (isEquipped) {
            statsContainer.innerText = "Current Active Selection";
            actionBtn.innerText = "EQUIPPED";
            actionBtn.className = "action-btn-active";
            actionBtn.disabled = true;
        } else if (isOwned) {
            statsContainer.innerText = "Status: Unlocked";
            actionBtn.innerText = "EQUIP LOOK";
            actionBtn.className = "action-btn-ready";
            actionBtn.disabled = false;
            actionBtn.onclick = () => equipSelection(id);
        } else {
            statsContainer.innerText = "Status: Locked";
            actionBtn.innerText = "GO TO SHOP";
            actionBtn.className = "action-btn-locked";
            actionBtn.disabled = false;
            actionBtn.onclick = () => window.location.href = 'shop.html';
        }
    }
}

function equipSelection(id) {
    if (id.startsWith('skin_')) equippedItems.playerSkin = id;
    else if (id.startsWith('bot_')) equippedItems.botSkin = id;

    localStorage.setItem('equippedItems', JSON.stringify(equippedItems));
    
    // Rerender grids and selections to project updates seamlessly
    populateInventoryGrid();
    selectItem(id);
}

// Start rendering operations instantly upon window initialization routines
window.onload = () => {
    populateInventoryGrid();
};