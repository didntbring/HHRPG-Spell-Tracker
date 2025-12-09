const CSV_FILE_NAME = "HH Data NEW - Sheet1.csv";
let allSpells = []; 
let mySpells = new Set(); // NEW: A set to track checked spell names

// --- 1. CSV Loading and Parsing (Papa Parse - UNCHANGED) ---

function loadSpells(url) {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                resolve(results.data);
            },
            error: function(error) {
                reject(error);
            }
        });
    });
}

// --- 2. Event Handler for Checkbox (NEW) ---

function handleOverrideChange(event) {
    const checkbox = event.target;
    const spellName = checkbox.dataset.spellName;
    
    if (checkbox.checked) {
        // Add spell to our tracking set
        mySpells.add(spellName);
        console.log(`Added: ${spellName}`);
    } else {
        // Remove spell from our tracking set
        mySpells.delete(spellName);
        console.log(`Removed: ${spellName}`);
    }
    
    // NOTE: This is where we would trigger an update to the "My Spells" list display later.
}

// --- 3. Display Utility (UPDATED) ---

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
        
        // Ensure checkbox state is maintained when rerendering the list
        const isChecked = mySpells.has(spell['Spell Name']) ? 'checked' : '';
        
        // Output structure 
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

// --- 4. Live Search Logic (UNCHANGED) ---

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

// --- 5. Initialization (UNCHANGED) ---

(async function init() {
    try {
        const spellsData = await loadSpells(CSV_FILE_NAME);
        allSpells = spellsData; 
        
        renderSpells(allSpells);

        document.getElementById('search-input').addEventListener('input', filterSpellsBySearch);

        console.log("App initialized. Override tracking ready.");

    } catch (error) {
        console.error("Critical error during loading or display:", error);
        document.getElementById('spell-list').innerHTML = `
            <p style="color: red;">Error loading data. Check the CSV file name and browser console. (Papa Parse Error)</p>
        `;
    }
})();
