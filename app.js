const CSV_FILE_NAME = "HH Data NEW - Sheet1.csv";
const STORAGE_KEY = 'characterCreatorData';
let allSpells = []; 
let mySpells = new Set(); 

// Data for dropdowns
const HALLS = ["Arcanium", "Assassins", "Animalians", "Coterie", "Alchemists", "Stone Singers", "Oestomancers", "Metallum Nocturn", "Aura Healers", "Protectors"];
const LEVELS = Array.from({length: 20}, (_, i) => i + 1); // 1-20
const FPS = Array.from({length: 21}, (_, i) => i + 10); // 10-30
const ELEMENTS = Array.from({length: 11}, (_, i) => i); // 0-10
const STATS = Array.from({length: 13}, (_, i) => i + 8); // 8-20
const CORE_STATS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

// --- Utility Functions ---

function populateSelect(id, values, defaultValue = null) {
    const select = document.getElementById(id);
    if (!select) return; 

    // Clear existing options
    select.innerHTML = '';
    
    // Add default/placeholder option
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
    // Local Storage is key to making this persistent and user-specific
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log("Character data saved.");
}

function loadCharacterData() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        const data = JSON.parse(savedData);
        
        // Restore values
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

// --- Tab Switching Logic ---

function switchTab(tabId) {
    // Hide all content sections
    document.querySelectorAll('.tab-content').forEach(section => {
        section.classList.remove('active');
    });

    // Deactivate all buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // Show the selected section
    document.getElementById(tabId).classList.add('active');
    
    // Activate the corresponding button
    document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
}

// --- Papa Parse and Search Logic (Reused) ---
// (The loadSpells, renderSpells, handleOverrideChange, filterSpellsBySearch functions go here)
// Due to length, assume these are included from your previous working code.
// I will only include the initialization block for the final merge.

// --- 1. CSV Loading and Parsing (Papa Parse - Reused) ---

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

// --- 2. Event Handler for Checkbox (Reused) ---

function handleOverrideChange(event) {
    const checkbox = event.target;
    const spellName = checkbox.dataset.spellName;
    
    if (checkbox.checked) {
        mySpells.add(spellName);
    } else {
        mySpells.delete(spellName);
    }
    // We will update a "My Spells" display here later
}

// --- 3. Display Utility (Updated with Range/Cast Time Fix) ---

function renderSpells(spellsToDisplay) {
    const listContainer = document.getElementById('spell-list');
    listContainer.innerHTML = ''; 
    
    document.querySelector('#spell-results h2').textContent = `Showing ${spellsToDisplay.length} Spells`;

    if (spellsToDisplay.length === 0) {
        listContainer.innerHTML = '<p>No spells found matching your search term.</p>';
        return;
    }

    spellsToDisplay.forEach(spell => {
        const card = document.createElement('div');
        card.className = 'spell-card';
        
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
        
        const checkbox = card.querySelector(`[data-spell-name="${spell['Spell Name']}"]`);
        if (checkbox) {
            checkbox.addEventListener('change', handleOverrideChange);
        }
    });
}

// --- 4. Live Search Logic (Reused) ---

function filterSpellsBySearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    if (!searchTerm) {
        renderSpells(allSpells);
        return;
    }
    
    const filteredSpells = allSpells.filter(spell => 
        spell['Spell Name'].toLowerCase().includes(searchTerm)
    );
    
    renderSpells(filteredSpells);
}


// --- Initialization ---

(async function init() {
    try {
        const spellsData = await loadSpells(CSV_FILE_NAME);
        allSpells = spellsData; 
        
        // 1. Populate Dropdowns on Character Info tab
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
        renderSpells(allSpells);
        document.getElementById('search-input').addEventListener('input', filterSpellsBySearch);

        console.log("App fully initialized. Data persistence ready.");

    } catch (error) {
        console.error("Critical error during loading or display:", error);
        document.getElementById('spell-list').innerHTML = `
            <p style="color: red;">Error loading data. Check the CSV file name and browser console.</p>
        `;
    }
})();
