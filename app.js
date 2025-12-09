const CSV_FILE_NAME = "HH Data NEW - Sheet1.csv";
const STORAGE_KEY = 'characterCreatorData';
let allSpells = []; 
let mySpells = new Set(); 

// Data for dropdowns (UNMODIFIED)
const HALLS = ["Arcanium", "Assassins", "Animalians", "Coterie", "Alchemists", "Stone Singers", "Oestomancers", "Metallum Nocturn", "Aura Healers", "Protectors"];
const LEVELS = Array.from({length: 20}, (_, i) => i + 1); // 1-20
const FPS = Array.from({length: 21}, (_, i) => i + 10); // 10-30
const ELEMENTS = Array.from({length: 11}, (_, i) => i); // 0-10
const STATS = Array.from({length: 13}, (_, i) => i + 8); // 8-20
const CORE_STATS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

// --- Utility Functions (Local Storage & Populating Selects - UNMODIFIED) ---
// ... (The populateSelect, saveCharacterData, loadCharacterData functions go here) ...
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
    console.log("Character data saved.");
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

        console.log("Character data loaded.");
    }
}


// --- Tab Switching Logic (Slightly modified to include 'my-spells') ---

function switchTab(tabId) {
    // If switching to the My Spells tab, render the list first
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


// --- Papa Parse and Search Logic (Reused) ---

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

// --- Event Handler for Checkbox (UPDATED to trigger renderMySpells) ---

function handleOverrideChange(event) {
    const checkbox = event.target;
    const spellName = checkbox.dataset.spellName;
    
    if (checkbox.checked) {
        mySpells.add(spellName);
        // NEW: Switch to My Spells tab when a spell is overridden
        switchTab('my-spells'); 
    } else {
        mySpells.delete(spellName);
    }
    
    // Always update the My Spells list if we're on that tab or not
    renderMySpells(); 
}


// --- Display Utility (RENAMED and Container ID changed) ---

function renderSpellCards(spellsToDisplay, containerId) {
    const listContainer = document.getElementById(containerId);
    listContainer.innerHTML = ''; 

    if (spellsToDisplay.length === 0) {
        listContainer.innerHTML = '<p>No spells to display.</p>';
        return;
    }

    spellsToDisplay.forEach(spell => {
        const card = document.createElement('div');
        card.className = 'spell-card';
        
        // Ensure checkbox state is maintained when rendering the list
        const isChecked = mySpells.has(spell['Spell Name']) ? 'checked' : '';
        
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
        
        // Attach the event listener to the newly created checkbox
        const checkbox = card.querySelector(`[data-spell-name="${spell['Spell Name']}"]`);
        if (checkbox) {
            checkbox.addEventListener('change', handleOverrideChange);
        }
    });
}

// Function to render the ALL spells list (wraps the generic renderSpellCards)
function renderAllSpells(spells = allSpells) {
    document.querySelector('#all-spells h2').textContent = `All Spells (${spells.length}):`;
    renderSpellCards(spells, 'spell-list-all');
}

// Function to render the MY spells list (NEW)
function renderMySpells() {
    // 1. Filter the entire spell list to only include spells whose names are in the 'mySpells' Set
    const mySpellList = allSpells.filter(spell => mySpells.has(spell['Spell Name']));
    
    document.querySelector('#my-spells h2').textContent = `Your Spell List (${mySpellList.length} Spells):`;
    
    // 2. Render the filtered list to the dedicated container
    renderSpellCards(mySpellList, 'spell-list-my');
}


// --- Live Search Logic (UPDATED to call renderAllSpells) ---

function filterSpellsBySearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    if (!searchTerm) {
        renderAllSpells(allSpells); // Pass allSpells to renderAllSpells if no search term
        return;
    }
    
    const filteredSpells = allSpells.filter(spell => 
        spell['Spell Name'].toLowerCase().includes(searchTerm)
    );
    
    renderAllSpells(filteredSpells);
}


// --- Initialization ---

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

        // 2. Load saved data and attach save listeners
        loadCharacterData();
        document.getElementById('character-form').addEventListener('change', saveCharacterData);
        document.getElementById('char-name').addEventListener('input', saveCharacterData);


        // 3. Attach Tab listeners
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
        });

        // 4. Initial spell display and search listener
        renderAllSpells(allSpells); // Initial render of the main list
        renderMySpells(); // Initial empty render of the my spells list
        
        document.getElementById('search-input').addEventListener('input', filterSpellsBySearch);

        console.log("App fully initialized. My Spells tab ready.");

    } catch (error) {
        console.error("Critical error during loading or display:", error);
        document.getElementById('spell-list-all').innerHTML = `
            <p style="color: red;">Error loading data. Check the CSV file name and browser console.</p>
        `;
    }
})();
