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
        if (data.alerts.length === 0) {
            // Show message if no alerts
            const li = document.createElement('li');
            li.textContent = 'No alerts detected.';
            li.className = 'no-alerts';
            alertsList.appendChild(li);
            return;
        }

        // Add each alert as a list item with severity color and icon
        data.alerts.forEach(alert => {
            const li = document.createElement('li');
            // Extract severity from alert string
            let severity = 'info';
            if (alert.includes('[Critical]')) severity = 'critical';
            else if (alert.includes('[Warning]')) severity = 'warning';

            // Add icon based on severity
            let icon = '';
            if (severity === 'critical') icon = '❗';
            else if (severity === 'warning') icon = '⚠️';
            else icon = 'ℹ️';

            li.innerHTML = `<span class="icon">${icon}</span> <span class="${severity}">${alert}</span>`;
            li.className = severity;
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
