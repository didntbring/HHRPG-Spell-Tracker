const CSV_FILE_NAME = "HH Data NEW - Sheet1.csv";
const STORAGE_KEY = 'characterCreatorData';
let allSpells = []; 
let mySpells = new Set(); 
// NEW: Tracks ONLY the spells the user has manually checked.
let userOverrides = new Set(); 

// Data for dropdowns
const HALLS = ["Arcanium", "Assassins", "Animalians", "Coterie", "Alchemists", "Stone Singers", "Oestomancers", "Metallum Nocturn", "Aura Healers", "Protectors"];
const LEVELS = Array.from({length: 20}, (_, i) => i + 1); // 1-20
const FPS = Array.from({length: 21}, (_, i) => i + 10); // 10-30
const ELEMENTS = Array.from({length: 11}, (_, i) => i); // 0-10
const STATS = Array.from({length: 13}, (_, i) => i + 8); // 8-20
const CORE_STATS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];


// =========================================================================
// 1. UTILITY FUNCTIONS (Local Storage, Select Population, and Filtering)
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
    // NOTE: filterAvailableSpells is called by the form 'change' listener, not here
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

// === Filtering Logic ===

function getCharacterStats() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return {};
    
    const data = JSON.parse(savedData);
    
    // Convert necessary fields to integers (use 0 if undefined/empty)
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

function checkSpellRequirements(spell, character) {
    const requirementText = spell.Requirement;
    
    if (!requirementText || requirementText.trim().toLowerCase() === 'none') {
        return true;
    }

    const individualRequirements = requirementText.split(/,\s*/);

    for (const req of individualRequirements) {
        const parts = req.trim().split(/\s+/);
        if (parts.length !== 2) continue; 

        const statName = parts[0].toLowerCase();
        const requiredValue = parseInt(parts[1]); 

        const characterStatValue = character[statName]; 

        // If stat is not set or value is too low, the requirement is NOT met
        if (characterStatValue === undefined || characterStatValue < requiredValue) {
            return false;
        }
    }
    return true;
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
        // Rerender My Spells just before switching to ensure it's up to date
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

function handleOverrideChange(event) {
    const checkbox = event.target;
    const spellName = checkbox.dataset.spellName;
    
    // **CRITICAL CHANGE:** Only modify the set dedicated to manual user choices (userOverrides)
    if (checkbox.checked) {
        userOverrides.add(spellName);
        switchTab('my-spells'); 
    } else {
        userOverrides.delete(spellName);
    }
    
    // Trigger the filtering logic to update the 'My Spells' list based on the new override state
    filterAvailableSpells();
}

// Renders cards to a specific container ID
function renderSpellCards(spellsToDisplay, containerId) {
    const listContainer = document.getElementById(containerId); 
    if (!listContainer) return; // Safety check
    
    listContainer.innerHTML = ''; 

    if (spellsToDisplay.length === 0) {
        listContainer.innerHTML = '<p>No spells to display.</p>';
        return;
    }

    spellsToDisplay.forEach(spell => {
        const card = document.createElement('div');
        card.className = 'spell-card';
        
        // **CRITICAL CHANGE:** Checkbox state is based ONLY on the userOverrides set
        const isChecked = userOverrides.has(spell['Spell Name']) ? 'checked' : '';
        
        card.innerHTML = `
            <div class="card-header">
                <h3>${spell['Spell Name']}</h3>
                <div class="override-control">
                    <input 
                        type="checkbox" 
                        id="override-${spell['Spell Name'].replace(/ /g, '-')}" 
                        data-spell-name="${spell['Spell Name']}"
                        ${isChecked}
                    >
                    <label for="override-${spell['Spell Name'].replace(/ /g, '-')}" class="override-label">Override Reqs</label>
                </div>
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
        
        const checkbox = card.querySelector(`[data-spell-name="${spell['Spell Name']}"]`);
        if (checkbox) {
            checkbox.addEventListener('change', handleOverrideChange);
        }
    });
}

function renderAllSpells(spells = allSpells) {
    document.querySelector('#all-spells h2').textContent = `All Spells (${spells.length}):`;
    // Targets the original #spell-list container
    renderSpellCards(spells, 'spell-list'); 
}

function filterAvailableSpells() {
    const characterStats = getCharacterStats();
    let availableSpells = [];

    // 1. Determine all spells that are available (by req OR by manual override)
    allSpells.forEach(spell => {
        const spellName = spell['Spell Name'];
        const meetsRequirements = checkSpellRequirements(spell, characterStats);
        
        // Requirements are met OR the spell is in the userOverrides set
        if (meetsRequirements || userOverrides.has(spellName)) {
            availableSpells.push(spell);
        }
    });

    // 2. Update the global mySpells set to reflect the final, calculated list
    // This set is used by renderMySpells to know what to display.
    mySpells.clear();
    availableSpells.forEach(spell => mySpells.add(spell['Spell Name']));

    // 3. Re-render the 'My Spells' tab
    renderMySpells();
    
    // 4. Re-render the 'All Spells' list to update the checkbox state immediately
    // (This is important when a stat change makes a spell available/unavailable)
    renderAllSpells(allSpells); 
}

function renderMySpells() {
    // Filters allSpells against the final calculated mySpells set
    const mySpellList = allSpells.filter(spell => mySpells.has(spell['Spell Name']));
    
    document.querySelector('#my-spells h2').textContent = `Your Spell List (${mySpellList.length} Spells):`;
    
    // Targets the dedicated #spell-list-my container
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
        
        const form = document.getElementById('character-form');
        form.addEventListener('change', () => {
            saveCharacterData();
            filterAvailableSpells(); // Filter spells whenever a stat changes
        });
        
        document.getElementById('char-name').addEventListener('input', saveCharacterData);


        // 3. Attach Tab listeners
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
        });

        // 4. Initial render
        // We need to load any previous user overrides (if we implemented it)
        // For now, we assume userOverrides starts empty on a fresh load unless you add save logic for it later.
        filterAvailableSpells(); // Run filter first to populate mySpells based on loaded character data
        renderAllSpells(allSpells); 
        
        document.getElementById('search-input').addEventListener('input', filterSpellsBySearch);

        console.log("App fully initialized. Spell Requirement filtering is now active.");

    } catch (error) {
        console.error("Critical error during loading or display:", error);
        document.getElementById('spell-list').innerHTML = `
            <p style="color: red;">Error loading data. Check the CSV file name and browser console.</p>
        `;
    }
})();
