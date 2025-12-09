const CSV_FILE_NAME = "HH Data NEW - Sheet1.csv";
let allSpells = []; 

// --- 1. CSV Loading and Parsing (UPDATED using Papa Parse) ---

function loadSpells(url) {
    return new Promise((resolve, reject) => {
        // Papa.parse handles fetching the file (url), reading it, 
        // and parsing it into a structured object.
        Papa.parse(url, {
            download: true,       // Tell Papa Parse to download the file from the URL
            header: true,         // Use the first row as object keys (Spell Name, Requirement, etc.)
            skipEmptyLines: true, // Ignore any blank rows in the CSV
            
            complete: function(results) {
                // Papa Parse stores the clean data in results.data
                resolve(results.data);
            },
            error: function(error) {
                reject(error);
            }
        });
    });
}


// --- 2. Display Utility (UNCHANGED from previous version) ---

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
        
        // Output structure using your column names. 
        // Note: Papa Parse preserves the original column headers, including spaces.
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

// --- 3. Live Search Logic (UNCHANGED from previous version) ---

function filterSpellsBySearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    if (!searchTerm) {
        renderSpells(allSpells);
        return;
    }
    
    const filteredSpells = allSpells.filter(spell => 
        // Check if the spell name includes the search term
        spell['Spell Name'].toLowerCase().includes(searchTerm)
    );
    
    renderSpells(filteredSpells);
}

// --- 4. Initialization (UPDATED for Papa Parse) ---

(async function init() {
    // Note: loadSpells is now a regular promise-returning function, not async
    try {
        const spellsData = await loadSpells(CSV_FILE_NAME);
        allSpells = spellsData; // Store data globally
        
        // Initial display: Show all spells immediately after loading
        renderSpells(allSpells);

        // Attach event listener to the search input for live filtering
        document.getElementById('search-input').addEventListener('input', filterSpellsBySearch);

        console.log("App initialized. Papa Parse loaded data successfully.");

    } catch (error) {
        console.error("Critical error during loading or display:", error);
        document.getElementById('spell-list').innerHTML = `
            <p style="color: red;">Error loading data. Check the CSV file name and browser console. (Papa Parse Error)</p>
        `;
    }
})();
