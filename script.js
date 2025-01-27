let startTime;
let stopwatchRunning = false;
let interval;
const raceResults = [];
let currentEditIndex = null; // Track which entry is being edited

// Start the stopwatch
document.getElementById('startButton').addEventListener('click', () => {
    if (!stopwatchRunning) {
        startTime = new Date();
        stopwatchRunning = true;
        document.getElementById('startButton').disabled = true;
        interval = setInterval(updateStopwatch, 10); // Update every 10ms for milliseconds
    }
});

// Update the stopwatch display
function updateStopwatch() {
    const elapsedTime = new Date() - startTime;
    const formattedTime = new Date(elapsedTime).toISOString().substr(11, 12); // Include milliseconds
    document.getElementById('stopwatch').textContent = formattedTime;
}

// Record finish time
function recordFinishTime() {
    if (!stopwatchRunning) {
        document.getElementById('resultMessage').textContent = "Error: Stopwatch is not running. Start the race first.";
        return;
    }

    const bibNumber = document.getElementById('bibInput').value.trim();
    const finishTime = new Date() - startTime;

    // Check for duplicate bib number
    if (bibNumber && raceResults.some(result => result.bibNumber === bibNumber)) {
        document.getElementById('resultMessage').textContent = `Warning: Bib number ${bibNumber} is a duplicate.`;
    } else {
        document.getElementById('resultMessage').textContent = `Finish time recorded for position ${raceResults.length + 1}.`;
    }

    // Record the entry (even if bib number is empty or duplicate)
    raceResults.push({ bibNumber: bibNumber || "Unknown", finishTime });
    document.getElementById('bibInput').value = ''; // Clear the input field

    // Update the results display
    updateResultsDisplay();
}

// Add event listener for "Record Finish Time" button
document.getElementById('recordButton').addEventListener('click', recordFinishTime);

// Add event listener for "Enter" key in the bib input field
document.getElementById('bibInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        recordFinishTime();
    }
});

// Add event listener for "Enter" key in the edit bib input field
document.getElementById('editBibInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('editSaveButton').click();
    }
});

// Function to update the results display
function updateResultsDisplay() {
    // Sort results by finish time
    raceResults.sort((a, b) => a.finishTime - b.finishTime);

    let resultsText = "<h2>Race Results:</h2>";
    let previousTime = 0;

    raceResults.forEach((result, index) => {
        const position = index + 1;
        const formattedTime = new Date(result.finishTime).toISOString().substr(11, 12); // Include milliseconds
        const split = index === 0 ? 0 : result.finishTime - raceResults[index - 1].finishTime;
        const formattedSplit = new Date(split).toISOString().substr(11, 12); // Include milliseconds

        resultsText += `
            <div class="result-entry">
                <strong>Position ${position}:</strong> Bib Number ${result.bibNumber}, 
                Finish Time: ${formattedTime}, 
                Split: +${formattedSplit}
                <button class="edit-button" data-index="${index}">Edit</button>
                <button class="delete-button" data-index="${index}">Delete</button>
            </div>
        `;
        previousTime = result.finishTime;
    });

    document.getElementById('results').innerHTML = resultsText;

    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            showEditDialog(index);
        });
    });

    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            deleteEntry(index);
        });
    });
}

// Show the custom edit dialog
function showEditDialog(index) {
    currentEditIndex = index;
    document.getElementById('editBibInput').value = raceResults[index].bibNumber;
    document.getElementById('editWarning').textContent = ''; // Clear any previous warning
    document.getElementById('editDialog').style.display = 'flex';
}

// Save the edited bib number
document.getElementById('editSaveButton').addEventListener('click', () => {
    const newBibNumber = document.getElementById('editBibInput').value.trim();
    if (newBibNumber === "") {
        document.getElementById('editWarning').textContent = "Bib number cannot be empty.";
        return;
    }

    // Check for duplicate bib number
    if (raceResults.some((result, i) => i !== currentEditIndex && result.bibNumber === newBibNumber)) {
        document.getElementById('editWarning').textContent = `Warning: Bib number ${newBibNumber} is already used.`;
        return;
    }

    raceResults[currentEditIndex].bibNumber = newBibNumber || "Unknown";
    updateResultsDisplay();
    hideEditDialog();
});

// Cancel the edit dialog
document.getElementById('editCancelButton').addEventListener('click', hideEditDialog);

// Hide the custom edit dialog
function hideEditDialog() {
    document.getElementById('editDialog').style.display = 'none';
    currentEditIndex = null;
}

// Delete an entry
function deleteEntry(index) {
    if (confirm("Are you sure you want to delete this entry?")) {
        raceResults.splice(index, 1);
        updateResultsDisplay();
    }
}

// Export results as .xlsx
document.getElementById('exportButton').addEventListener('click', () => {
    if (raceResults.length === 0) {
        alert("No results to export.");
        return;
    }

    // Prepare data for export
    const data = raceResults.map((result, index) => ({
        Position: index + 1,
        "Bib Number": result.bibNumber,
        "Finish Time": new Date(result.finishTime).toISOString().substr(11, 12),
        "Split": index === 0 ? "0" : `+${new Date(result.finishTime - raceResults[index - 1].finishTime).toISOString().substr(11, 12)}`
    }));

    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Race Results");

    // Export the file
    XLSX.writeFile(workbook, "race_results.xlsx");
});
