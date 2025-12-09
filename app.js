const CSV_FILE_NAME = "HH Data NEW - Sheet1.csv";
let allSpells = []; // Global storage for all loaded spells

// --- 1. CSV Loading and Parsing (Reused) ---
async function loadSpells(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load CSV: ${response.statusText}`);
    }
    const text = await response.text();
    
    const rows = text.trim().split('\n');
    const headers = rows[0].split(',').map(h => h.trim());
    
    const spells = [];
    for (let i = 1; i < rows.length; i++) {
        // Simple comma split. If your data contains commas within quotes, a more robust library like Papa Parse would be needed.
        const values = rows[i].split(',').map(v => v.trim()); 
        const spell = {};
        
        headers.forEach((header, index) => {
            spell[header] = values[index] ? values[index].trim() : '';
        });
        spells.push(spell);
    }
    return spells;
}

// --- 2. Display Utility ---
function renderSpells(spellsToDisplay) {
    const listContainer = document.getElementById('spell-list');
    listContainer.innerHTML = ''; // Clear previous results
    
    // Update the results header
    document.querySelector('#spell-results h2').textContent = `Showing ${spellsToDisplay.length} Spells`;

    if (spellsToDisplay.length === 0) {
        listContainer.innerHTML = '<p>No spells found matching your search term.</p>';
        return;
    }

    spellsToDisplay.forEach(spell => {
        const card = document.createElement('div');
        card.className = 'spell-card';
        
        // Output structure using your column names
        card.innerHTML = `
            <h3>${spell['Spell Name']}</h3>
            <div class="spell-detail"><strong>Requirement:</strong> ${spell.Requirement}</div>
            <div class="spell-detail"><strong>Range / Cast Time:</strong> ${spell['RangeCast Time']}</div>
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
    });
}

// --- 3. Live Search Logic ---

function filterSpellsBySearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    // If the search term is empty, show all spells
    if (!searchTerm) {
        renderSpells(allSpells);
        return;
    }
    
    // Filter the global list based on the Spell Name
    const filteredSpells = allSpells.filter(spell => 
        // Convert the spell name to lowercase for case-insensitive search
        spell['Spell Name'].toLowerCase().includes(searchTerm)
    );
    
    renderSpells(filteredSpells);
}

// --- 4. Initialization ---

(async function init() {
    try {
        allSpells = await loadSpells(CSV_FILE_NAME);
        
        // Initial display: Show all spells immediately after loading
        renderSpells(allSpells);

        // Attach event listener to the search input for live filtering
        document.getElementById('search-input').addEventListener('input', filterSpellsBySearch);

        console.log("App initialized. Data loaded successfully.");

    } catch (error) {
        console.error("Critical error during loading or display:", error);
        document.getElementById('spell-list').innerHTML = `
            <p style="color: red;">Error loading data. Check the CSV file name and browser console.</p>
        `;
    }
})();
