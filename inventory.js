// --- 1. DEFINE BASE ITEM DATABASE DATA WITH SPRITESHEET POSITIONING ---
// item_spritesheet.png items are mapped assuming a 3x3 layout (~32x32px source frames)
// game_skins.png characters are mapped assuming an 8x8 layout (32x32px source frames)
const GAME_ITEM_DATABASE = {
    // Consumables (images/item_spritesheet.png)
    'energy_bar': { name: 'Energy Bar', type: 'item', desc: 'Provides a quick burst of speed during matches!', sheet: 'items', row: 0, col: 0 },
    'tomatoes': { name: 'Rotten Tomatoes', type: 'item', desc: 'Throw it to slow down the runner bot!', sheet: 'items', row: 0, col: 1 },
    'gummy_bears': { name: 'Gummy Bears', type: 'item', desc: 'A tasty treat that keeps your stamina restored.', sheet: 'items', row: 0, col: 2 },
    'fart_bomb': { name: 'Fart Bomb', type: 'item', desc: 'Blasts your opponents backward with area knockback!', sheet: 'items', row: 1, col: 2 },
    'potion': { name: 'Untagable Potion', type: 'item', desc: 'Makes you completely immune to tags for a short time.', sheet: 'items', row: 2, col: 0 },
    
    // Player Skins (images/game_skins.png)
    'skin_default_red': { name: 'Default Red', type: 'playerSkin', desc: 'Your base starter character model.', sheet: 'skins', row: 1, col: 0 },
    'skin_nugget': { name: 'Nugget', type: 'playerSkin', desc: 'A legendary crispy chicken cosmetic skin.', sheet: 'skins', row: 2, col: 0 },
    'skin_george': { name: 'George Monkey', type: 'playerSkin', desc: 'Go bananas and outrun everyone with this look.', sheet: 'skins', row: 4, col: 0 },
    'skin_john': { name: 'John Pork', type: 'playerSkin', desc: 'The internet icon pig skin is calling you.', sheet: 'skins', row: 6, col: 0 },
    
    // Bot Skins (images/game_skins.png)
    'bot_default_blue': { name: 'Default Blue', type: 'botSkin', desc: 'The classic, base enemy bot look.', sheet: 'skins', row: 0, col: 0 },
    'bot_stealer': { name: 'Food Stealer', type: 'botSkin', desc: 'Transform your bot tracker into a sneaky raccoon.', sheet: 'skins', row: 7, col: 0 },
    'bot_mcrae': { name: 'Mr. McRae', type: 'botSkin', desc: 'Give your opponent bot a sophisticated school teacher look.', sheet: 'skins', row: 5, col: 0 },
    'bot_evil': { name: 'Evil Nugget', type: 'botSkin', desc: 'Turn your hunter bot into a menacing spicy nugget.', sheet: 'skins', row: 3, col: 0 }
};

// --- 2. RETRIEVE STORAGE PERSISTENCE ---
let playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || {
    items: { energy_bar: 5, tomatoes: 2, gummy_bears: 3, fart_bomb: 1, potion: 1 }, // Added default sample quantities
    skins: ['skin_default_red', 'bot_default_blue']
};

let equippedItems = JSON.parse(localStorage.getItem('equippedItems')) || {
    playerSkin: 'skin_default_red',
    botSkin: 'bot_default_blue'
};

let selectedItemId = null; // Track currently highlighted grid element

// Helper function to set up dynamic sprite background styles
function applySpriteStyle(element, item, isLargePreview = false) {
    const sheetSrc = item.sheet === 'skins' ? 'images/game_skins.png' : 'images/item_spritesheet.png';
    element.style.backgroundImage = `url('${sheetSrc}')`;
    element.style.backgroundRepeat = 'no-repeat';
    element.style.imageRendering = 'pixelated';
    
    // Base tile dimension configuration
    const baseSize = 32; 
    const displaySize = isLargePreview ? 64 : 32;
    const scale = displaySize / baseSize;
    
    // Calculate accurate position maps based on row and columns
    const posX = item.col * baseSize * scale;
    const posY = item.row * baseSize * scale;
    
    // Sheet total dimensions to scale grid lookups precisely
    if (item.sheet === 'skins') {
        element.style.backgroundSize = `${256 * scale}px ${256 * scale}px`;
    } else {
        element.style.backgroundSize = `${96 * scale}px ${96 * scale}px`;
    }
    
    element.style.width = `${displaySize}px`;
    element.style.height = `${displaySize}px`;
    element.style.backgroundPosition = `-${posX}px -${posY}px`;
}

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

        // Setup clean nodes programmatically to apply style layers cleanly
        const artDiv = document.createElement('div');
        artDiv.className = 'box-art';
        applySpriteStyle(artDiv, itemInfo, false);

        const nameDiv = document.createElement('div');
        nameDiv.className = 'box-name';
        nameDiv.innerText = itemInfo.name;

        const badgeSpan = document.createElement('span');
        badgeSpan.className = 'box-badge';
        badgeSpan.innerText = overlayText;

        slotDiv.appendChild(artDiv);
        slotDiv.appendChild(nameDiv);
        slotDiv.appendChild(badgeSpan);
        
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
    const targetedBox = document.getElementById(`grid-box-${id}`);
    if (targetedBox) targetedBox.classList.add('active-selection');

    // Update dynamic background sprites instead of writing raw text
    const previewArt = document.getElementById('preview-art');
    if (previewArt) {
        previewArt.innerText = ''; // Clear fallback artifacts
        applySpriteStyle(previewArt, item, true);
    }
    
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