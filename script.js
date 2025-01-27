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
        interval = setInterval(updateStopwatch, 10); // Update every 10ms
    }
});

// Update the stopwatch display
function updateStopwatch() {
    const elapsedTime = new Date() - startTime;
    document.getElementById('stopwatch').textContent = formatTime(elapsedTime);
}

// Format time to minutes:seconds.milliseconds (2 decimals for milliseconds)
function formatTime(timeInMilliseconds) {
    const minutes = Math.floor(timeInMilliseconds / 60000);
    const seconds = Math.floor((timeInMilliseconds % 60000) / 1000);
    const milliseconds = ((timeInMilliseconds % 1000) / 10).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}.${milliseconds < 10 ? '0' : ''}${milliseconds}`;
}

// Record finish time
function recordFinishTime() {
    if (!stopwatchRunning) {
        document.getElementById('resultMessage').textContent = "Error: Stopwatch is not running. Start the race first.";
        return;
    }

    const bibNumber = document.getElementById('bibInput').value.trim();
    const finishTime = new Date() - startTime;

    if (bibNumber && raceResults.some(result => result.bibNumber === bibNumber)) {
        document.getElementById('resultMessage').textContent = `Warning: Bib number ${bibNumber} is a duplicate.`;
        return;
    }

    // Calculate split time
    const previousFinishTime = raceResults.length > 0 ? raceResults[raceResults.length - 1].finishTime : 0;
    const splitTime = finishTime - previousFinishTime;

    raceResults.push({
        bibNumber: bibNumber || "Unknown",
        finishTime,
        splitTime,
    });

    document.getElementById('resultMessage').textContent = `Finish time recorded for position ${raceResults.length}.`;
    document.getElementById('bibInput').value = ''; // Clear the input field
    updateResultsDisplay();
}

// Event listeners for buttons and inputs
document.getElementById('recordButton').addEventListener('click', recordFinishTime);
document.getElementById('bibInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') recordFinishTime();
});

document.getElementById('exportButton').addEventListener('click', () => {
    if (raceResults.length === 0) {
        alert("No results to export.");
        return;
    }

    const data = raceResults.map((result, index) => ({
        Position: index + 1,
        "Bib Number": result.bibNumber,
        "Finish Time": formatTime(result.finishTime),
        "Split Time": index > 0 ? formatTime(result.splitTime) : "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Race Results");
    XLSX.writeFile(workbook, "race_results.xlsx");
});

function updateResultsDisplay() {
    raceResults.sort((a, b) => a.finishTime - b.finishTime);

    let resultsText = "<h2>Race Results:</h2>";
    raceResults.forEach((result, index) => {
        resultsText += `
            <div class="result-entry">
                <span>
                    <strong>Position ${index + 1}:</strong> Bib ${result.bibNumber}, 
                    Time: ${formatTime(result.finishTime)}
                    ${index > 0 ? `<br>Split: ${formatTime(result.splitTime)}` : ''}
                </span>
                <div class="buttons">
                    <button class="edit-button" data-index="${index}">Edit</button>
                    <button class="delete-button" data-index="${index}">Delete</button>
                </div>
            </div>
        `;
    });

    document.getElementById('results').innerHTML = resultsText;

    document.querySelectorAll('.edit-button').forEach(button => button.addEventListener('click', (e) => {
        currentEditIndex = e.target.getAttribute('data-index');
        document.getElementById('editBibInput').value = raceResults[currentEditIndex].bibNumber;
        document.getElementById('editDialog').style.display = 'flex';
    }));

    document.querySelectorAll('.delete-button').forEach(button => button.addEventListener('click', (e) => {
        const index = e.target.getAttribute('data-index');
        if (confirm("Are you sure you want to delete this entry?")) {
            raceResults.splice(index, 1);
            updateResultsDisplay();
        }
    }));
}

document.getElementById('editSaveButton').addEventListener('click', () => {
    const newBibNumber = document.getElementById('editBibInput').value.trim();
    if (!newBibNumber) {
        alert("Bib number cannot be empty.");
        return;
    }
    raceResults[currentEditIndex].bibNumber = newBibNumber;
    document.getElementById('editDialog').style.display = 'none';
    updateResultsDisplay();
});

document.getElementById('editCancelButton').addEventListener('click', () => {
    document.getElementById('editDialog').style.display = 'none';
});
