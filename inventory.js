// --- 1. DEFINE BASE ITEM DATABASE DATA WITH SPRITESHEET POSITIONING ---
// item_spritesheet.png items are mapped assuming a 3x3 layout (~32x32px source frames)
// game_skins.png characters are mapped assuming an 8x8 layout (32x32px source frames)
const GAME_ITEM_DATABASE = {
    // Consumables (images/item_spritesheet.png)
    'energy_bar': { name: 'Energy Bar', type: 'item', desc: 'Restores your stamina bar completely and removes exhaustion.', sheet: 'items', row: 0, col: 0 },
    'tomatoes': { name: 'Rotten Tomatoes', type: 'item', desc: 'Stuns your opponent for 6 seconds, preventing them from moving or tagging.', sheet: 'items', row: 0, col: 1 },
    'gummy_bears': { name: 'Gummy Bears', type: 'item', desc: 'Grants a 15-second speed boost followed by a slowdown period.', sheet: 'items', row: 0, col: 2 },
    'fart_bomb': { name: 'Fart Bomb', type: 'item', desc: 'Stuns your opponent for 15 seconds. Much more powerful than tomatoes!', sheet: 'items', row: 1, col: 2 },
    'potion': { name: 'Untaggable Potion', type: 'item', desc: 'Makes you immune to one tag. Wears off after you get tagged.', sheet: 'items', row: 2, col: 0 },
    
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
    items: { energy_bar: 5, tomatoes: 0, gummy_bears: 3, fart_bomb: 1, potion: 1 }, 
    skins: ['skin_default_red', 'bot_default_blue']
};

let equippedItems = JSON.parse(localStorage.getItem('equippedItems')) || {
    playerSkin: 'skin_default_red',
    botSkin: 'bot_default_blue'
};

// State array to manage our 5 hotbar slots
let hotbarItems = JSON.parse(localStorage.getItem('hotbarItems')) || [null, null, null, null, null];

let selectedItemId = null; 

// Helper function to set up dynamic sprite background styles
function applySpriteStyle(element, item, isLargePreview = false) {
    const sheetSrc = item.sheet === 'skins' ? 'images/game_skins.png' : 'images/item_spritesheet.png';
    element.style.backgroundImage = `url('${sheetSrc}')`;
    element.style.backgroundRepeat = 'no-repeat';
    element.style.imageRendering = 'pixelated';
    
    const baseSize = 32; 
    const displaySize = isLargePreview ? 64 : 32;
    const scale = displaySize / baseSize;
    
    const posX = item.col * baseSize * scale;
    const posY = item.row * baseSize * scale;
    
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
    
    gridContainer.innerHTML = ''; 

    for (const id in GAME_ITEM_DATABASE) {
        const itemInfo = GAME_ITEM_DATABASE[id];
        
        const slotDiv = document.createElement('div');
        slotDiv.className = 'grid-item-box';
        slotDiv.id = `grid-box-${id}`;
        
        let overlayText = '';
        let isDraggable = true;

        if (itemInfo.type === 'item') {
            const currentCount = playerInventory.items[id] || 0;
            overlayText = `x${currentCount}`;
            // Prevent dragging if inventory count is 0
            if (currentCount <= 0) {
                isDraggable = false;
            }
        } else {
            const isOwned = playerInventory.skins.includes(id);
            const isEquipped = (equippedItems.playerSkin === id || equippedItems.botSkin === id);
            
            if (isEquipped) overlayText = 'E';
            else if (!isOwned) overlayText = '🔒';
            
            // Skins are purely cosmetic and non-draggable
            isDraggable = false;
        }

        // Apply drag attributes and customized dynamic ghost-card visuals
        if (isDraggable) {
            slotDiv.setAttribute('draggable', true);
            slotDiv.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', id);
                
                // Create a temporary isolated container to act as the drag preview
                let ghostContainer = document.getElementById('drag-ghost-container');
                if (!ghostContainer) {
                    ghostContainer = document.createElement('div');
                    ghostContainer.id = 'drag-ghost-container';
                    ghostContainer.style.position = 'absolute';
                    ghostContainer.style.top = '-1000px';
                    ghostContainer.style.left = '-1000px';
                    ghostContainer.style.pointerEvents = 'none';
                    document.body.appendChild(ghostContainer);
                }
                
                ghostContainer.innerHTML = ''; // Wipe past reference instances
                
                // Generate JUST the pure graphic icon node (no borders, no backgrounds, no text)
                const pureIconDiv = document.createElement('div');
                applySpriteStyle(pureIconDiv, itemInfo, false);
                
                ghostContainer.appendChild(pureIconDiv);
                
                // Anchor layout feedback target precisely to the cursor center point (16px offset for 32x32px icon)
                e.dataTransfer.setDragImage(ghostContainer, 16, 16);
            });
        } else {
            slotDiv.setAttribute('draggable', false);
        }

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
        
        slotDiv.onclick = () => selectItem(id);
        gridContainer.appendChild(slotDiv);
    }
}

// --- 4. QUICK ACCESS HOTBAR INITIALIZATION & EVENT LOGIC ---
function initializeHotbar() {
    const slots = document.querySelectorAll('.hotbar-slot');
    
    slots.forEach(slot => {
        slot.addEventListener('dragover', (e) => {
            e.preventDefault();
            slot.classList.add('hotbar-slot-hover');
        });

        slot.addEventListener('dragleave', () => {
            slot.classList.remove('hotbar-slot-hover');
        });

        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            slot.classList.remove('hotbar-slot-hover');
            
            const itemId = e.dataTransfer.getData('text/plain');
            const slotIndex = parseInt(slot.getAttribute('data-slot'), 10);
            
            if (GAME_ITEM_DATABASE[itemId]) {
                const itemInfo = GAME_ITEM_DATABASE[itemId];
                if (itemInfo.type !== 'item') return;

                // Return overwritten slots back to standard stockpile quantities
                const oldItemId = hotbarItems[slotIndex];
                if (oldItemId && GAME_ITEM_DATABASE[oldItemId] && GAME_ITEM_DATABASE[oldItemId].type === 'item') {
                    playerInventory.items[oldItemId] = (playerInventory.items[oldItemId] || 0) + 1;
                }

                if ((playerInventory.items[itemId] || 0) <= 0) return; 
                playerInventory.items[itemId] -= 1;

                hotbarItems[slotIndex] = itemId;
                localStorage.setItem('hotbarItems', JSON.stringify(hotbarItems));
                localStorage.setItem('playerInventory', JSON.stringify(playerInventory));
                
                populateInventoryGrid();
                renderHotbar();
                if (selectedItemId === itemId) selectItem(itemId);
            }
        });

        // Click a hotbar item to remove it and return it to the total inventory count
        slot.onclick = () => {
            const slotIndex = parseInt(slot.getAttribute('data-slot'), 10);
            const itemId = hotbarItems[slotIndex];
            
            if (itemId !== null) {
                if (GAME_ITEM_DATABASE[itemId] && GAME_ITEM_DATABASE[itemId].type === 'item') {
                    playerInventory.items[itemId] = (playerInventory.items[itemId] || 0) + 1;
                }

                hotbarItems[slotIndex] = null;
                localStorage.setItem('hotbarItems', JSON.stringify(hotbarItems));
                localStorage.setItem('playerInventory', JSON.stringify(playerInventory));
                
                populateInventoryGrid();
                renderHotbar();
                if (selectedItemId === itemId) selectItem(itemId);
            }
        };
    });
    
    renderHotbar();
}

function renderHotbar() {
    const slots = document.querySelectorAll('.hotbar-slot');
    slots.forEach((slot, index) => {
        slot.innerHTML = ''; 
        const itemId = hotbarItems[index];
        
        if (itemId && GAME_ITEM_DATABASE[itemId]) {
            const itemInfo = GAME_ITEM_DATABASE[itemId];
            
            const artDiv = document.createElement('div');
            artDiv.className = 'hotbar-art';
            applySpriteStyle(artDiv, itemInfo, false);
            
            slot.appendChild(artDiv);
            slot.title = `${itemInfo.name} (Click to remove)`;
        } else {
            slot.title = "Empty Slot (Drag items here)";
        }
    });
}

// --- 5. DETAILS PANELS UPDATE LOGIC ---
function selectItem(id) {
    selectedItemId = id;
    const item = GAME_ITEM_DATABASE[id];
    
    document.querySelectorAll('.grid-item-box').forEach(box => box.classList.remove('active-selection'));
    const targetedBox = document.getElementById(`grid-box-${id}`);
    if (targetedBox) targetedBox.classList.add('active-selection');

    const previewArt = document.getElementById('preview-art');
    if (previewArt) {
        previewArt.innerText = ''; 
        applySpriteStyle(previewArt, item, true);
    }
    
    document.getElementById('preview-title').innerText = item.name;
    document.getElementById('preview-desc').innerText = item.desc;

    const actionBtn = document.getElementById('inventory-action-btn');
    const statsContainer = document.getElementById('preview-stats');

    if (item.type === 'item') {
        const count = playerInventory.items[id] || 0;
        statsContainer.innerText = `Stockpile Account: ${count} owned`;
        actionBtn.innerText = "CONSUMABLE BOOST";
        actionBtn.className = "action-btn-utility";
        actionBtn.disabled = true; 
    } else {
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
    
    populateInventoryGrid();
    selectItem(id);
}

window.onload = () => {
    populateInventoryGrid();
    initializeHotbar();
};

// Fix the "X" / restriction cursor from showing up while dragging across the screen
window.addEventListener('dragover', (e) => {
    e.preventDefault();
});

window.addEventListener('drop', (e) => {
    e.preventDefault();
});