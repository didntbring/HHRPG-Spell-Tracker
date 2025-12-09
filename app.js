// The name of your CSV file
const CSV_FILE_NAME = "HH Data NEW - Sheet1.csv";

// Function to fetch the CSV file and convert it to an array of objects
async function loadSpells(url) {
    const response = await fetch(url);
    // Throw an error if the file isn't found (404)
    if (!response.ok) {
        throw new Error(`Failed to load CSV: ${response.statusText}`);
    }
    const text = await response.text();
    
    // Split the text into rows, removing the last empty line if it exists
    const rows = text.trim().split('\n');
    
    // The first row is the header (column names). Trim headers to avoid spacing issues.
    const headers = rows[0].split(',').map(h => h.trim());
    
    // Process the remaining rows to create the array of spell objects
    const spells = [];
    for (let i = 1; i < rows.length; i++) {
        // Split the row by comma. This basic split assumes no commas within the data fields.
        const values = rows[i].split(',').map(v => v.trim());
        const spell = {};
        
        // Map the values back to their headers
        headers.forEach((header, index) => {
            spell[header] = values[index];
        });
        spells.push(spell);
    }
    return spells;
}

// Function to render the list of spells to the HTML
function displayAllSpells(spells) {
    const listContainer = document.getElementById('spell-list');
    
    // Clear the "Loading spells..." message
    listContainer.innerHTML = ''; 

    if (spells.length === 0) {
        listContainer.innerHTML = '<p>No spells found in the data.</p>';
        return;
    }

    spells.forEach(spell => {
        const card = document.createElement('div');
        card.className = 'spell-card';
        
        // Build the card content using your specific columns
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

// Main execution function
(async function init() {
    try {
        const allSpells = await loadSpells(CSV_FILE_NAME);
        displayAllSpells(allSpells);
        console.log("Spells loaded and displayed.");
    } catch (error) {
        console.error("Critical error during loading or display:", error);
        // Display error message to the user
        document.getElementById('spell-list').innerHTML = `
            <p style="color: red;">
                Error loading data. Check the file name 
                ("${CSV_FILE_NAME}") and the browser console for details.
            </p>
        `;
    }
})();
