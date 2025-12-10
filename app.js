const CSV_FILE_NAME = "HH Data NEW - Sheet1.csv";
const STORAGE_KEY = 'characterCreatorData';
const LEARNED_STORAGE_KEY = 'learnedRaritySpells'; // NEW Storage Key
let allSpells = []; 
let mySpells = new Set(); 
let userOverrides = new Set(); 
// NEW: Tracks Uncommon/Rare spells the user has explicitly chosen to 'learn'.
let learnedRaritySpells = new Set(); 

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

// NEW: Save and Load functions for Learned Rarity Spells
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


// === Filtering Logic (unchanged since last step) ===

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

// Helper to check a single requirement string (e.g., "Fire 2", "Animalians", "ANY 1")
function checkSingleRequirement(req, character) {
    const parts = req.trim().split(/\s+/);

    if (parts.length === 1 && HALLS.includes(parts[0])) {
        // Case: Requirement is a HALL (e.g., "Animalians")
        return character.hall === parts[0];
    }
    
    if (parts.length === 2) {
        const statName = parts[0].toLowerCase();
        const requiredValue = parseInt(parts[1]); 

        if (statName === 'any') {
            // Case: Requirement is "ANY X" (sum of all elements)
            const totalElements = ELEMENT_STATS.reduce((sum, stat) => sum + character[stat], 0);
            return totalElements >= requiredValue;
        } 
        
        // Case: Requirement is a STAT or ELEMENT (e.g., "Fire 2", "Con 15")
        const characterStatValue = character[statName]; 
        return characterStatValue !== undefined && characterStatValue >= requiredValue;
    }

    // Default to false for unrecognized formats
    return false;
}

// Main logic to parse the full Requirement text
function checkSpellRequirements(spell, character) {
    const requirementText = spell.Requirement;
    
    if (!requirementText || requirementText.trim().toLowerCase() === 'none') {
        return true;
    }

    // 1. Split by OR (Lowest precedence, check if ANY side passes)
    const orClauses = requirementText.split(/\s+OR\s+/i);

    for (const orClause of orClauses) {
        // 2. Split by / (Highest precedence, check if ALL parts pass)
        const andClauses = orClause.split(/\s*\/\s*/);
        
        let meetsAndRequirements = true;

        for (const andReq of andClauses) {
            // Check each individual requirement (e.g., "Fire 1", "Air 1", "Animalians")
            if (!checkSingleRequirement(andReq, character)) {
                meetsAndRequirements = false;
                break; // Failed an AND condition, move to the next OR clause
            }
        }

        // If all AND requirements in this OR clause passed, the entire requirement is met
        if (meetsAndRequirements) {
            return true;
        }
    }
    
    return false;
}


// =========================================================================
// 2. DATA LOAD & TAB LOGIC (unchanged)
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

// NEW: Handler for the Learn Spell checkbox (in My Spells tab)
function handleLearnRarityChange(event) {
    const checkbox = event.target;
    const spellName = checkbox.dataset.spellName;
    
    if (checkbox.checked) {
        learnedRaritySpells.add(spellName);
    } else {
        learnedRaritySpells.delete(spellName);
    }

    saveLearnedSpells(); // Save the new learned status
    
    // Re-filter and re-render both lists to update the visual status
    filterAvailableSpells(); 
    // If the user unlearns a spell, we need to make sure the All Spells card grays out
    renderAllSpells(allSpells);
}


// Renders cards to a specific container ID
function renderSpellCards(spellsToDisplay, containerId) {
    const listContainer = document.getElementById(containerId); 
    if (!listContainer) return; 
    
    listContainer.innerHTML = ''; 

    if (spellsToDisplay.length === 0) {
        listContainer.innerHTML = '<p>No spells to display.</p>';
        return;
    }

    // Check for my-spells container to apply custom sorting/styling
    const isMySpellsList = containerId === 'spell-list-my';
    
    // Create a working list for My Spells to handle sorting
    let sortedSpells = [...spellsToDisplay];

    if (isMySpellsList) {
        // Sort: Move grayed-out spells to the bottom
        sortedSpells.sort((a, b) => {
            const aIsLocked = (a.Rarity === 'Uncommon' || a.Rarity === 'Rare') && !learnedRaritySpells.has(a['Spell Name']);
            const bIsLocked = (b.Rarity === 'Uncommon' || b.Rarity === 'Rare') && !learnedRaritySpells.has(b['Spell Name']);

            if (aIsLocked && !bIsLocked) return 1; // a moves down
            if (!aIsLocked && bIsLocked) return -1; // b moves down
            return 0; // maintain original order otherwise
        });
    }

    sortedSpells.forEach(spell => {
        const spellName = spell['Spell Name'];
        const card = document.createElement('div');
        card.className = 'spell-card';
        
        const isRarityLocked = (spell.Rarity === 'Uncommon' || spell.Rarity === 'Rare') && !learnedRaritySpells.has(spellName);

        // Apply gray-out class if in My Spells list AND Rarity Locked
        if (isMySpellsList && isRarityLocked) {
            card.classList.add('grayed-out');
        }

        // --- Render Checkboxes based on Container ---
        let checkboxHTML = '';
        let isChecked = '';

        if (isMySpellsList) {
            // Render "Learn Spell" checkbox for Uncommon/Rare spells only
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
            // Render "Override Reqs" checkbox for All Spells list
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
        
        // Attach event listeners based on the checkbox type
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
        
        // Requirements are met OR the spell is in the userOverrides set
        if (meetsRequirements || userOverrides.has(spellName)) {
            availableSpells.push(spell);
        }
    });

    // 2. Update the global mySpells set to reflect the final, calculated list
    mySpells.clear();
    availableSpells.forEach(spell => mySpells.add(spell['Spell Name']));

    // 3. Re-render the lists
    renderMySpells();
    renderAllSpells(allSpells); 
}

function renderMySpells() {
    const mySpellList = allSpells.filter(spell => mySpells.has(spell['Spell Name']));
    
    document.querySelector('#my-spells h2').textContent = `Your Spell List (${mySpellList.length} Spells):`;
    
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
        loadLearnedSpells(); // NEW: Load learned spell status
        
        const form = document.getElementById('character-form');
        form.addEventListener('change', () => {
            saveCharacterData();
            filterAvailableSpells();
        });
        
        document.getElementById('char-name').addEventListener('input', saveCharacterData);


        // 3. Attach Tab listeners
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
        });

        // 4. Initial render
        filterAvailableSpells();
        renderAllSpells(allSpells); 
        
        document.getElementById('search-input').addEventListener('input', filterSpellsBySearch);

        console.log("App fully initialized. Comprehensive spell filtering is now active.");

    } catch (error) {
        console.error("Critical error during loading or display:", error);
        document.getElementById('spell-list').innerHTML = `
            <p style="color: red;">Error loading data. Check the CSV file name and browser console.</p>
        `;
    }
})();
