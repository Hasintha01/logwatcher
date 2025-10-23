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

        // Add each alert as a list item with timestamp, severity color, icon, and expandable details
        data.alerts.forEach((alert, idx) => {
            const li = document.createElement('li');
            // Extract timestamp, severity, and message from alert string
            // Example: [2025-10-22 16:30:00] [Critical] logs/system.log:101 ERROR: Disk space critically low
            const match = alert.match(/^\[(.*?)\]\s*\[(.*?)\]\s*(.*)$/);
            let timestamp = '', severity = 'info', details = alert;
            if (match) {
                timestamp = match[1];
                severity = match[2].toLowerCase();
                details = match[3];
            } else {
                // fallback for old format
                if (alert.includes('[Critical]')) severity = 'critical';
                else if (alert.includes('[Warning]')) severity = 'warning';
            }

            // Add icon based on severity
            let icon = '';
            if (severity === 'critical') icon = '❗';
            else if (severity === 'warning') icon = '⚠️';
            else icon = 'ℹ️';

            // Main row: icon, timestamp, summary, expand/collapse button
            li.className = severity;
            li.innerHTML = `
                <span class="icon">${icon}</span>
                <span class="meta">${timestamp}</span>
                <span class="summary">${details.split(':')[2] ? details.split(':')[2] : details}</span>
                <button class="expand-btn" aria-label="Show details">&#x25BC;</button>
                <div class="details" style="display:none;">${details}</div>
            `;

            // Expand/collapse logic
            const btn = li.querySelector('.expand-btn');
            const detailsDiv = li.querySelector('.details');
            btn.addEventListener('click', () => {
                if (detailsDiv.style.display === 'none') {
                    detailsDiv.style.display = 'block';
                    btn.innerHTML = '&#x25B2;'; // up arrow
                } else {
                    detailsDiv.style.display = 'none';
                    btn.innerHTML = '&#x25BC;'; // down arrow
                }
            });

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
