const CSV_FILE_NAME = "HH Data NEW - Sheet1.csv";
const STORAGE_KEY = 'characterCreatorData';
const LEARNED_STORAGE_KEY = 'learnedRaritySpells';
const CURRENT_FP_STORAGE_KEY = 'currentFPState';
const ITEMS_STORAGE_KEY = 'characterInventory'; 

let allSpells = []; 
let mySpells = new Set(); 
let userOverrides = new Set(); 
let learnedRaritySpells = new Set(); 
let currentFP = 0; 

let inventoryItems = [];

const HALLS = ["Arcanium", "Assassins", "Animalians", "Coterie", "Alchemists", "Stone Singers", "Oestomancers", "Metallum Nocturn", "Aura Healers", "Protectors"];
const LEVELS = Array.from({length: 20}, (_, i) => i + 1); 
const FPS = Array.from({length: 21}, (_, i) => i + 10); 
const ELEMENTS = Array.from({length: 11}, (_, i) => i); 
const STATS = Array.from({length: 13}, (_, i) => i + 8); 
const CORE_STATS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ELEMENT_STATS = ['fire', 'air', 'spirit', 'earth', 'water']; 

// =========================================================================
// 1. UTILITY FUNCTIONS
// =========================================================================

function populateSelect(id, values, defaultValue = null) {
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
        if (value === defaultValue) option.selected = true;
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
        learnedRaritySpells = new Set(JSON.parse(savedData));
    }
}

function saveCurrentFP() {
    localStorage.setItem(CURRENT_FP_STORAGE_KEY, currentFP);
}

function loadCurrentFP() {
    const maxFP = parseInt(document.getElementById('fp').value) || 0;
    const savedFP = localStorage.getItem(CURRENT_FP_STORAGE_KEY);
    currentFP = (savedFP !== null && !isNaN(parseInt(savedFP))) ? parseInt(savedFP) : maxFP;
}

function updateFPDisplay() {
    const maxFP = parseInt(document.getElementById('fp').value) || 0;
    if (currentFP > maxFP) { currentFP = maxFP; saveCurrentFP(); }
    const currentDisplay = document.getElementById('current-fp-display');
    const maxDisplay = document.getElementById('max-fp-display');
    if (currentDisplay) currentDisplay.textContent = currentFP;
    if (maxDisplay) maxDisplay.textContent = maxFP;
    if (currentDisplay) {
        currentDisplay.style.color = (currentFP <= (maxFP / 4) && currentFP > 0) ? 'red' : 'inherit';
        if (currentFP === 0) currentDisplay.style.color = 'darkred';
    }
    const recoverBtn = document.getElementById('fp-recover-btn');
    const useBtn = document.getElementById('fp-use-btn');
    if (recoverBtn) recoverBtn.disabled = currentFP >= maxFP;
    if (useBtn) useBtn.disabled = currentFP <= 0;
}

function handleFPChange(action) {
    const maxFP = parseInt(document.getElementById('fp').value) || 0;
    if (action === 'recover' && currentFP < maxFP) currentFP++;
    else if (action === 'use' && currentFP > 0) currentFP--;
    else if (action === 'reset') currentFP = maxFP;
    updateFPDisplay();
    saveCurrentFP();
}

function saveInventory() { localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(inventoryItems)); }
function loadInventory() {
    const savedItems = localStorage.getItem(ITEMS_STORAGE_KEY);
    if (savedItems) inventoryItems = JSON.parse(savedItems);
}

function handleAddItemForm(event) {
    event.preventDefault();
    const name = document.getElementById('item-name').value.trim();
    const amount = parseInt(document.getElementById('item-amount').value);
    const description = document.getElementById('item-description').value.trim();
    if (name && amount > 0) {
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2); 
        inventoryItems.push({ id, name, amount, description });
        saveInventory(); renderItems(); closeModal();
        document.getElementById('item-form').reset();
    }
}

function handleUseItem(itemId) {
    const itemIndex = inventoryItems.findIndex(item => item.id === itemId);
    if (itemIndex > -1) {
        const item = inventoryItems[itemIndex];
        item.amount--; 
        if (item.amount <= 0) {
            inventoryItems.splice(itemIndex, 1);
            alert(`Used and removed: ${item.name}`);
        } else {
            alert(`Used 1 of ${item.name}. ${item.amount} remaining.`);
        }
        saveInventory(); renderItems();
    }
}

function getCharacterStats() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return {};
    const data = JSON.parse(savedData);
    ['level', 'fp', 'fire', 'air', 'spirit', 'earth', 'water', 'str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(key => {
        data[key] = parseInt(data[key]) || 0;
    });
    return data;
}

function checkSingleRequirement(req, character) {
    const parts = req.trim().split(/\s+/);
    if (parts.length === 1 && HALLS.includes(parts[0])) return character.hall === parts[0];
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
    if (!requirementText || requirementText.trim().toLowerCase() === 'none') return true;
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
        if (meetsAndRequirements) return true;
    }
    return false;
}

// =========================================================================
// 2. DATA LOAD & TAB LOGIC
// =========================================================================

function loadSpells(url) {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true, header: true, skipEmptyLines: true,
            complete: function(results) { resolve(results.data); },
            error: function(error) { reject(error); }
        });
    });
}

function switchTab(tabId) {
    if (tabId === 'my-spells') renderMySpells(); 
    else if (tabId === 'items') renderItems();
    document.querySelectorAll('.tab-content').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
}

const itemModal = document.getElementById('item-modal');
const closeButton = itemModal ? itemModal.querySelector('.close-button') : null;
function openModal() { if (itemModal) itemModal.style.display = 'block'; }
function closeModal() { if (itemModal) itemModal.style.display = 'none'; }

// =========================================================================
// 3. EVENT HANDLERS & RENDERING
// =========================================================================

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

function handleLearnRarityChange(event) {
    const checkbox = event.target;
    const spellName = checkbox.dataset.spellName;
    if (checkbox.checked) learnedRaritySpells.add(spellName);
    else learnedRaritySpells.delete(spellName);
    saveLearnedSpells();
    filterAvailableSpells(); 
    renderAllSpells(allSpells);
}

function renderSpellCards(spellsToDisplay, containerId) {
    const listContainer = document.getElementById(containerId); 
    if (!listContainer) return; 
    listContainer.innerHTML = ''; 

    if (spellsToDisplay.length === 0) {
        listContainer.innerHTML = (containerId === 'spell-list-my') ? 
            '<p>Add spells to your list by checking "Override Reqs" or filling out your Character Info!</p>' : 
            '<p>No spells to display.</p>';
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
        
        // --- ADDED COLLAPSIBLE LOGIC ---
        if (containerId === 'spell-list') {
            card.addEventListener('click', (e) => {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'LABEL') {
                    card.classList.toggle('expanded');
                }
            });
        }

        const isRarityLocked = (spell.Rarity === 'Uncommon' || spell.Rarity === 'Rare') && !learnedRaritySpells.has(spellName);
        if (isMySpellsList && isRarityLocked) card.classList.add('grayed-out');

        let checkboxHTML = '';
        if (isMySpellsList) {
            if (spell.Rarity === 'Uncommon' || spell.Rarity === 'Rare') {
                const isChecked = learnedRaritySpells.has(spellName) ? 'checked' : '';
                checkboxHTML = `<div class="override-control rarity-control">
                    <input type="checkbox" id="learn-${spellName.replace(/ /g, '-')}" data-spell-name="${spellName}" ${isChecked}>
                    <label for="learn-${spellName.replace(/ /g, '-')}" class="override-label">${isChecked ? 'Learned' : 'Learn Spell'}</label>
                </div>`;
            }
        } else {
            const isChecked = userOverrides.has(spellName) ? 'checked' : '';
            checkboxHTML = `<div class="override-control">
                <input type="checkbox" id="override-${spellName.replace(/ /g, '-')}" data-spell-name="${spellName}" ${isChecked}>
                <label for="override-${spellName.replace(/ /g, '-')}" class="override-label">Override Reqs</label>
            </div>`;
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
                <strong>Description:</strong> <p>${spell.Description}</p>
                ${spell.Escalation ? `<strong>Escalation:</strong><p>${spell.Escalation}</p>` : ''} 
            </div>
        `;
        listContainer.appendChild(card);
        
        const checkbox = card.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.addEventListener('change', isMySpellsList ? handleLearnRarityChange : handleOverrideChange);
        }
    });
}

function renderAllSpells(spells = allSpells) {
    document.querySelector('#all-spells h2').textContent = `All Spells (${spells.length}):`;
    renderSpellCards(spells, 'spell-list'); 
}

function filterAvailableSpells() {
    const characterStats = getCharacterStats();
    let availableSpells = allSpells.filter(spell => checkSpellRequirements(spell, characterStats) || userOverrides.has(spell['Spell Name']));
    mySpells.clear();
    availableSpells.forEach(spell => mySpells.add(spell['Spell Name']));
    renderMySpells();
    renderAllSpells(allSpells); 
}

function renderMySpells() {
    const mySpellList = allSpells.filter(spell => mySpells.has(spell['Spell Name']));
    renderSpellCards(mySpellList, 'spell-list-my'); 
}

function filterSpellsBySearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    renderAllSpells(searchTerm ? allSpells.filter(s => s['Spell Name'].toLowerCase().includes(searchTerm)) : allSpells);
}

function renderItems() {
    const listContainer = document.getElementById('item-list');
    listContainer.innerHTML = inventoryItems.length ? '' : '<p>No items in inventory.</p>';
    inventoryItems.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';
        itemCard.innerHTML = `
            <div class="item-header">
                <h3>${item.name} (${item.amount})</h3>
                <button class="use-item-btn" data-item-id="${item.id}" title="Use 1">Use</button>
            </div>
            <div class="item-description-block"><p>${item.description || 'No description provided.'}</p></div>`;
        listContainer.appendChild(itemCard);
    });
    document.querySelectorAll('.use-item-btn').forEach(btn => btn.addEventListener('click', (e) => handleUseItem(e.target.dataset.itemId)));
}

// =========================================================================
// 4. INITIALIZATION
// =========================================================================

(async function init() {
    try {
        const spellsData = await loadSpells(CSV_FILE_NAME);
        allSpells = spellsData; 
        
        populateSelect('level', LEVELS);
        populateSelect('fp', FPS);
        populateSelect('hall', HALLS);
        ELEMENT_STATS.forEach(id => populateSelect(id, ELEMENTS));
        CORE_STATS.forEach(stat => populateSelect(stat, STATS));

        loadCharacterData(); loadLearnedSpells(); loadCurrentFP(); loadInventory();
        
        const form = document.getElementById('character-form');
        form.addEventListener('change', (e) => {
            saveCharacterData();
            if (e.target.id === 'fp') {
                currentFP = parseInt(e.target.value) || 0;
                saveCurrentFP(); updateFPDisplay(); 
            }
            filterAvailableSpells();
        });
        
        document.getElementById('char-name').addEventListener('input', saveCharacterData);
        document.querySelectorAll('.tab-button').forEach(btn => btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab)));
        document.getElementById('fp-recover-btn').addEventListener('click', () => handleFPChange('recover'));
        document.getElementById('fp-use-btn').addEventListener('click', () => handleFPChange('use'));
        document.getElementById('fp-reset-btn').addEventListener('click', () => handleFPChange('reset'));

        if (document.getElementById('add-item-btn')) document.getElementById('add-item-btn').addEventListener('click', openModal);
        if (closeButton) closeButton.addEventListener('click', closeModal);
        window.addEventListener('click', (e) => { if (e.target === itemModal) closeModal(); });
        if (document.getElementById('item-form')) document.getElementById('item-form').addEventListener('submit', handleAddItemForm);

        filterAvailableSpells(); renderAllSpells(allSpells); updateFPDisplay(); renderItems();
        document.getElementById('search-input').addEventListener('input', filterSpellsBySearch);

        // --- ADDED BACK TO TOP LOGIC ---
        const btt = document.getElementById("back-to-top");
        window.onscroll = () => {
            btt.style.display = (window.scrollY > 300) ? "block" : "none";
        };
        btt.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        console.error(error);
        document.getElementById('spell-list').innerHTML = `<p style="color: red;">Error loading data.</p>`;
    }
})();
