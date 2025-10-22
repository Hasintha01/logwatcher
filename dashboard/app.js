//
// LogWatcher Dashboard Frontend Script
// app.js
// Fetches alerts from the Flask backend and displays them in the dashboard UI.
//

// Function to fetch alerts from the backend API and update the UI
async function fetchAlerts() {
    try {
        // Request alerts from Flask API
        const response = await fetch('/api/alerts');
        const data = await response.json();
        const alertsList = document.getElementById('alerts-list');
        alertsList.innerHTML = '';
        // Add each alert as a list item
        data.alerts.forEach(alert => {
            const li = document.createElement('li');
            li.textContent = alert;
            alertsList.appendChild(li);
        });
    } catch (error) {
        // Log errors to console for debugging
        console.error('Error fetching alerts:', error);
    }
}

// Initial fetch and periodic refresh every 5 seconds
fetchAlerts();
setInterval(fetchAlerts, 5000);
