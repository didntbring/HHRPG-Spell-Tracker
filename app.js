const CSV_FILE_NAME = "HH Data NEW - Sheet1.csv";
const STORAGE_KEY = 'characterCreatorData';
const LEARNED_STORAGE_KEY = 'learnedRaritySpells';
const CURRENT_FP_STORAGE_KEY = 'currentFPState';
const ITEMS_STORAGE_KEY = 'characterInventory'; // NEW Storage Key

let allSpells = []; 
let mySpells = new Set(); 
let userOverrides = new Set(); 
let learnedRaritySpells = new Set(); 
let currentFP = 0; 

// NEW: Array to hold inventory items
let inventoryItems = [];

// Data for dropdowns
const HALLS = ["Arcanium", "Assassins", "Animalians", "Coterie", "Alchemists", "Stone Singers", "Oestomancers", "Metallum Nocturn", "Aura Healers", "Protectors"];
const LEVELS = Array.from({length: 20}, (_, i) => i + 1); // 1-20
const FPS = Array.from({length: 21}, (_, i) => i + 10); // 10-30
const ELEMENTS = Array.from({length: 11}, (_, i) => i); // 0-10
const STATS = Array.from({length: 13}, (_, i) => i + 8); // 8-20
const CORE_STATS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ELEMENT_STATS = ['fire', 'air', 'spirit', 'earth', 'water']; 

// =========================================================================
// 1. UTILITY FUNCTIONS (Local Storage, Select Population, and Filtering)
// =========================================================================

function populateSelect(id, values, defaultValue = null) {
    // ... (unchanged) ...
    const select = document.getElementById(id);
    if (!select) return; 

    select.innerHTML = '';
    
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = `-- Select ${id.charAt(0).toUpperCase() + id.slice(1)} --`;
    select.appendChild(placeholder);

    values.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        if (value === defaultValue) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

function saveCharacterData() {
    const data = {
        name: document.getElementById('char-name').value,
        level: document.getElementById('level').value,
        fp: document.getElementById('fp').value,
        hall: document.getElementById('hall').value,
        fire: document.getElementById('fire').value,
        air: document.getElementById('air').value,
        spirit: document.getElementById('spirit').value,
        earth: document.getElementById('earth').value,
        water: document.getElementById('water').value,
        str: document.getElementById('str').value,
        dex: document.getElementById('dex').value,
        con: document.getElementById('con').value,
        int: document.getElementById('int').value,
        wis: document.getElementById('wis').value,
        cha: document.getElementById('cha').value,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadCharacterData() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        const data = JSON.parse(savedData);
        
        document.getElementById('char-name').value = data.name || '';
        document.getElementById('level').value = data.level || '';
        document.getElementById('fp').value = data.fp || '';
        document.getElementById('hall').value = data.hall || '';
        document.getElementById('fire').value = data.fire || '';
        document.getElementById('air').value = data.air || '';
        document.getElementById('spirit').value = data.spirit || '';
        document.getElementById('earth').value = data.earth || '';
        document.getElementById('water').value = data.water || '';
        document.getElementById('str').value = data.str || '';
        document.getElementById('dex').value = data.dex || '';
        document.getElementById('con').value = data.con || '';
        document.getElementById('int').value = data.int || '';
        document.getElementById('wis').value = data.wis || '';
        document.getElementById('cha').value = data.cha || '';
    }
}

function saveLearnedSpells() {
    localStorage.setItem(LEARNED_STORAGE_KEY, JSON.stringify(Array.from(learnedRaritySpells)));
}

function loadLearnedSpells() {
    const savedData = localStorage.getItem(LEARNED_STORAGE_KEY);
    if (savedData) {
        const spellArray = JSON.parse(savedData);
        learnedRaritySpells = new Set(spellArray);
    }
}

function saveCurrentFP() {
    localStorage.setItem(CURRENT_FP_STORAGE_KEY, currentFP);
}

function loadCurrentFP() {
    const maxFP = parseInt(document.getElementById('fp').value) || 0;
    const savedFP = localStorage.getItem(CURRENT_FP_STORAGE_KEY);
    
    if (savedFP !== null && !isNaN(parseInt(savedFP))) {
        currentFP = parseInt(savedFP);
    } else {
        currentFP = maxFP;
    }
}

function updateFPDisplay() {
    const maxFP = parseInt(document.getElementById('fp').value) || 0;
    
    if (currentFP > maxFP) {
        currentFP = maxFP;
        saveCurrentFP(); 
    }
    
    const currentDisplay = document.getElementById('current-fp-display');
    const maxDisplay = document.getElementById('max-fp-display');
    
    if (currentDisplay) {
        currentDisplay.textContent = currentFP;
    }
    if (maxDisplay) {
        maxDisplay.textContent = maxFP;
    }
    
    if (currentDisplay) {
        currentDisplay.style.color = (currentFP <= (maxFP / 4) && currentFP > 0) ? 'red' : 'inherit';
        if (currentFP === 0) {
            currentDisplay.style.color = 'darkred';
        }
    }
    
    const recoverBtn = document.getElementById('fp-recover-btn');
    const useBtn = document.getElementById('fp-use-btn');
    if (recoverBtn) recoverBtn.disabled = currentFP >= maxFP;
    if (useBtn) useBtn.disabled = currentFP <= 0;
}

function handleFPChange(action) {
    const maxFP = parseInt(document.getElementById('fp').value) || 0;

    if (action === 'recover' && currentFP < maxFP) {
        currentFP++;
    } else if (action === 'use' && currentFP > 0) {
        currentFP--;
    } else if (action === 'reset') {
        currentFP = maxFP;
    }
    
    updateFPDisplay();
    saveCurrentFP();
}

// --- NEW ITEM MANAGEMENT FUNCTIONS ---

function saveInventory() {
    localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(inventoryItems));
}

function loadInventory() {
    const savedItems = localStorage.getItem(ITEMS_STORAGE_KEY);
    if (savedItems) {
        inventoryItems = JSON.parse(savedItems);
    }
}

function handleAddItemForm(event) {
    event.preventDefault();
    
    const name = document.getElementById('item-name').value.trim();
    const amount = parseInt(document.getElementById('item-amount').value);
    const description = document.getElementById('item-description').value.trim();

    if (name && amount > 0) {
        // Simple way to ensure unique ID, though not foolproof, it's fine for local storage
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2); 

        inventoryItems.push({ 
            id: id,
            name: name, 
            amount: amount, 
            description: description 
        });
        
        saveInventory();
        renderItems();
        closeModal();
        document.getElementById('item-form').reset(); // Clear form
    }
}

function handleUseItem(itemId) {
    const itemIndex = inventoryItems.findIndex(item => item.id === itemId);

    if (itemIndex > -1) {
        const item = inventoryItems[itemIndex];
        
        // Subtract 1 from amount
        item.amount--; 

        // If amount reaches 0, remove the item entirely
        if (item.amount <= 0) {
            inventoryItems.splice(itemIndex, 1);
            alert(`Used and removed: ${item.name}`);
        } else {
            alert(`Used 1 of ${item.name}. ${item.amount} remaining.`);
        }

        saveInventory();
        renderItems();
    }
}

// === Filtering Logic (unchanged) ===

function getCharacterStats() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return {};
    
    const data = JSON.parse(savedData);
    
    data.level = parseInt(data.level) || 0;
    data.fp = parseInt(data.fp) || 0;
    data.fire = parseInt(data.fire) || 0;
    data.air = parseInt(data.air) || 0;
    data.spirit = parseInt(data.spirit) || 0;
    data.earth = parseInt(data.earth) || 0;
    data.water = parseInt(data.water) || 0;
    data.str = parseInt(data.str) || 0;
    data.dex = parseInt(data.dex) || 0;
    data.con = parseInt(data.con) || 0;
    data.int = parseInt(data.int) || 0;
    data.wis = parseInt(data.wis) || 0;
    data.cha = parseInt(data.cha) || 0;
    
    return data;
}

function checkSingleRequirement(req, character) {
    const parts = req.trim().split(/\s+/);

    if (parts.length === 1 && HALLS.includes(parts[0])) {
        return character.hall === parts[0];
    }
    
    if (parts.length === 2) {
        const statName = parts[0].toLowerCase();
        const requiredValue = parseInt(parts[1]); 

        if (statName === 'any') {
            const totalElements = ELEMENT_STATS.reduce((sum, stat) => sum + character[stat], 0);
            return totalElements >= requiredValue;
        } 
        
        const characterStatValue = character[statName]; 
        return characterStatValue !== undefined && characterStatValue >= requiredValue;
    }

    return false;
}

function checkSpellRequirements(spell, character) {
    const requirementText = spell.Requirement;
    
    if (!requirementText || requirementText.trim().toLowerCase() === 'none') {
        return true;
    }

    const orClauses = requirementText.split(/\s+OR\s+/i);

    for (const orClause of orClauses) {
        const andClauses = orClause.split(/\s*\/\s*/);
        
        let meetsAndRequirements = true;

        for (const andReq of andClauses) {
            if (!checkSingleRequirement(andReq, character)) {
                meetsAndRequirements = false;
                break;
            }
        }

        if (meetsAndRequirements) {
            return true;
        }
    }
    
    return false;
}


// =========================================================================
// 2. DATA LOAD & TAB LOGIC
// =========================================================================

function loadSpells(url) {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) { resolve(results.data); },
            error: function(error) { reject(error); }
        });
    });
}

function switchTab(tabId) {
    if (tabId === 'my-spells') {
        renderMySpells(); 
    } else if (tabId === 'items') { // NEW: Render items when switching to the Items tab
        renderItems();
    }
    
    document.querySelectorAll('.tab-content').forEach(section => {
        section.classList.remove('active');
    });

    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
}

// --- MODAL CONTROLS ---
const itemModal = document.getElementById('item-modal');
const closeButton = itemModal ? itemModal.querySelector('.close-button') : null;

function openModal() {
    if (itemModal) itemModal.style.display = 'block';
}

function closeModal() {
    if (itemModal) itemModal.style.display = 'none';
}


// =========================================================================
// 3. EVENT HANDLERS & RENDERING
// =========================================================================

// Handler for the Manual Override checkbox (in All Spells tab)
function handleOverrideChange(event) {
    const checkbox = event.target;
    const spellName = checkbox.dataset.spellName;
    
    if (checkbox.checked) {
        userOverrides.add(spellName);
        switchTab('my-spells'); 
    } else {
        userOverrides.delete(spellName);
    }
    
    filterAvailableSpells();
}

// Handler for the Learn Spell checkbox (in My Spells tab)
function handleLearnRarityChange(event) {
    const checkbox = event.target;
    const spellName = checkbox.dataset.spellName;
    
    if (checkbox.checked) {
        learnedRaritySpells.add(spellName);
    } else {
        learnedRaritySpells.delete(spellName);
    }

    saveLearnedSpells();
    filterAvailableSpells(); 
    renderAllSpells(allSpells);
}


// Renders cards to a specific container ID (unchanged)
function renderSpellCards(spellsToDisplay, containerId) {
    const listContainer = document.getElementById(containerId); 
    if (!listContainer) return; 
    
    listContainer.innerHTML = ''; 

    if (spellsToDisplay.length === 0) {
        if (containerId === 'spell-list-my') {
             listContainer.innerHTML = '<p>Add spells to your list by checking "Override Reqs" or filling out your Character Info!</p>';
        } else {
             listContainer.innerHTML = '<p>No spells to display.</p>';
        }
        return;
    }

    const isMySpellsList = containerId === 'spell-list-my';
    let sortedSpells = [...spellsToDisplay];

    if (isMySpellsList) {
        sortedSpells.sort((a, b) => {
            const aIsLocked = (a.Rarity === 'Uncommon' || a.Rarity === 'Rare') && !learnedRaritySpells.has(a['Spell Name']);
            const bIsLocked = (b.Rarity === 'Uncommon' || b.Rarity === 'Rare') && !learnedRaritySpells.has(b['Spell Name']);

            if (aIsLocked && !bIsLocked) return 1; 
            if (!aIsLocked && bIsLocked) return -1; 
            return 0;
        });
    }

    sortedSpells.forEach(spell => {
        const spellName = spell['Spell Name'];
        const card = document.createElement('div');
        card.className = 'spell-card';
        
        const isRarityLocked = (spell.Rarity === 'Uncommon' || spell.Rarity === 'Rare') && !learnedRaritySpells.has(spellName);

        if (isMySpellsList && isRarityLocked) {
            card.classList.add('grayed-out');
        }

        let checkboxHTML = '';
        let isChecked = '';

        if (isMySpellsList) {
            if (spell.Rarity === 'Uncommon' || spell.Rarity === 'Rare') {
                isChecked = learnedRaritySpells.has(spellName) ? 'checked' : '';
                checkboxHTML = `
                    <div class="override-control rarity-control">
                        <input 
                            type="checkbox" 
                            id="learn-${spellName.replace(/ /g, '-')}" 
                            data-spell-name="${spellName}"
                            ${isChecked}
                        >
                        <label for="learn-${spellName.replace(/ /g, '-')}" class="override-label">${isChecked ? 'Learned' : 'Learn Spell'}</label>
                    </div>
                `;
            }
        } else {
            isChecked = userOverrides.has(spellName) ? 'checked' : '';
            checkboxHTML = `
                <div class="override-control">
                    <input 
                        type="checkbox" 
                        id="override-${spellName.replace(/ /g, '-')}" 
                        data-spell-name="${spellName}"
                        ${isChecked}
                    >
                    <label for="override-${spellName.replace(/ /g, '-')}" class="override-label">Override Reqs</label>
                </div>
            `;
        }
        
        card.innerHTML = `
            <div class="card-header">
                <h3>${spellName}</h3>
                ${checkboxHTML}
            </div>
            
            <div class="spell-detail"><strong>Requirement:</strong> ${spell.Requirement}</div>
            <div class="spell-detail"><strong>Range:</strong> ${spell.Range}</div>
            <div class="spell-detail"><strong>Cast Time:</strong> ${spell['Cast Time']}</div>
            <div class="spell-detail"><strong>FP Cost:</strong> ${spell['FP Cost']}</div>
            <div class="spell-detail"><strong>Duration:</strong> ${spell.Duration}</div>
            <div class="spell-detail"><strong>Rarity:</strong> ${spell.Rarity}</div>
            
            <div class="description-block">
                <strong>Description:</strong> 
                <p>${spell.Description}</p>
                ${spell.Escalation ? `
                    <strong>Escalation:</strong>
                    <p>${spell.Escalation}</p>
                ` : ''} 
            </div>
        `;
        listContainer.appendChild(card);
        
        if (!isMySpellsList) {
            const checkbox = card.querySelector(`[id^="override-"]`);
            if (checkbox) {
                checkbox.addEventListener('change', handleOverrideChange);
            }
        } else if (spell.Rarity === 'Uncommon' || spell.Rarity === 'Rare') {
            const checkbox = card.querySelector(`[id^="learn-"]`);
            if (checkbox) {
                checkbox.addEventListener('change', handleLearnRarityChange);
            }
        }
    });
}

function renderAllSpells(spells = allSpells) {
    document.querySelector('#all-spells h2').textContent = `All Spells (${spells.length}):`;
    renderSpellCards(spells, 'spell-list'); 
}

function filterAvailableSpells() {
    const characterStats = getCharacterStats();
    let availableSpells = [];

    allSpells.forEach(spell => {
        const spellName = spell['Spell Name'];
        const meetsRequirements = checkSpellRequirements(spell, characterStats);
        
        if (meetsRequirements || userOverrides.has(spellName)) {
            availableSpells.push(spell);
        }
    });

    mySpells.clear();
    availableSpells.forEach(spell => mySpells.add(spell['Spell Name']));

    renderMySpells();
    renderAllSpells(allSpells); 
}

function renderMySpells() {
    const mySpellList = allSpells.filter(spell => mySpells.has(spell['Spell Name']));
    
    // NOTE: This H2 update logic is now handled in the HTML side, but keeping this
    // for compatibility with potential future changes.
    // document.querySelector('#my-spells h2').textContent = `Your Spell List (${mySpellList.length} Spells):`;
    
    renderSpellCards(mySpellList, 'spell-list-my'); 
}

function filterSpellsBySearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    if (!searchTerm) {
        renderAllSpells(allSpells); 
        return;
    }
    
    const filteredSpells = allSpells.filter(spell => 
        spell['Spell Name'].toLowerCase().includes(searchTerm)
    );
    
    renderAllSpells(filteredSpells);
}

// --- NEW ITEM RENDERING ---

function renderItems() {
    const listContainer = document.getElementById('item-list');
    listContainer.innerHTML = '';
    
    if (inventoryItems.length === 0) {
        listContainer.innerHTML = '<p>No items in inventory.</p>';
        return;
    }

    inventoryItems.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';
        itemCard.innerHTML = `
            <div class="item-header">
                <h3>${item.name} (${item.amount})</h3>
                <button class="use-item-btn" data-item-id="${item.id}" title="Use 1 (Removes item if quantity is 1)">Use</button>
            </div>
            <div class="item-description-block">
                <p>${item.description || 'No description provided.'}</p>
            </div>
        `;
        listContainer.appendChild(itemCard);
    });

    // Attach 'Use' button listeners after rendering
    document.querySelectorAll('.use-item-btn').forEach(button => {
        button.addEventListener('click', (e) => handleUseItem(e.target.dataset.itemId));
    });
}


// =========================================================================
// 4. INITIALIZATION
// =========================================================================

(async function init() {
    try {
        const spellsData = await loadSpells(CSV_FILE_NAME);
        allSpells = spellsData; 
        
        // 1. Populate Dropdowns
        populateSelect('level', LEVELS);
        populateSelect('fp', FPS);
        populateSelect('hall', HALLS);
        populateSelect('fire', ELEMENTS);
        populateSelect('air', ELEMENTS);
        populateSelect('spirit', ELEMENTS);
        populateSelect('earth', ELEMENTS);
        populateSelect('water', ELEMENTS);
        CORE_STATS.forEach(stat => populateSelect(stat, STATS));

        // 2. Load saved data and attach save/filter listeners
        loadCharacterData();
        loadLearnedSpells(); 
        loadCurrentFP();
        loadInventory(); // NEW: Load Inventory

        
        const form = document.getElementById('character-form');
        form.addEventListener('change', (e) => {
            saveCharacterData();
            
            if (e.target.id === 'fp') {
                currentFP = parseInt(e.target.value) || 0;
                saveCurrentFP();
                updateFPDisplay(); 
            }
            
            filterAvailableSpells();
        });
        
        document.getElementById('char-name').addEventListener('input', saveCharacterData);


        // 3. Attach Tab listeners
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
        });

        // 4. Attach FP button listeners
        document.getElementById('fp-recover-btn').addEventListener('click', () => handleFPChange('recover'));
        document.getElementById('fp-use-btn').addEventListener('click', () => handleFPChange('use'));
        document.getElementById('fp-reset-btn').addEventListener('click', () => handleFPChange('reset'));

        // 5. NEW: Item Modal and Button Listeners
        if (document.getElementById('add-item-btn')) {
            document.getElementById('add-item-btn').addEventListener('click', openModal);
        }
        if (closeButton) {
            closeButton.addEventListener('click', closeModal);
        }
        if (itemModal) {
             window.addEventListener('click', (event) => {
                if (event.target === itemModal) {
                    closeModal();
                }
            });
        }
        if (document.getElementById('item-form')) {
            document.getElementById('item-form').addEventListener('submit', handleAddItemForm);
        }

        // 6. Initial render and display update
        filterAvailableSpells();
        renderAllSpells(allSpells); 
        updateFPDisplay(); 
        renderItems(); // Initial item render

        
        document.getElementById('search-input').addEventListener('input', filterSpellsBySearch);

        console.log("App fully initialized. Comprehensive spell filtering is now active.");

    } catch (error) {
        console.error("Critical error during loading or display:", error);
        document.getElementById('spell-list').innerHTML = `
            <p style="color: red;">Error loading data. Check the CSV file name and browser console.</p>
        `;
    }
})();
