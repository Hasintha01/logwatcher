//
// LogWatcher Dashboard Frontend Script
// app.js
// Fetches alerts from the Flask backend and displays them in the dashboard UI.
//

// Global state
let allAlerts = [];
let currentFilter = '';

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Filter alerts based on search text
function filterAlerts(searchText) {
    currentFilter = searchText.toLowerCase();
    renderAlerts();
}

// Render alerts (filtered or all)
function renderAlerts() {
    const alertsList = document.getElementById('alerts-list');
    alertsList.innerHTML = '';
    
    // Filter alerts if search text exists
    const filteredAlerts = currentFilter 
        ? allAlerts.filter(alert => alert.toLowerCase().includes(currentFilter))
        : allAlerts;
    
    if (filteredAlerts.length === 0) {
        // Show message if no alerts or no matches
        const li = document.createElement('li');
        li.textContent = currentFilter 
            ? `No alerts matching "${currentFilter}"`
            : 'No alerts detected.';
        li.className = 'no-alerts';
        alertsList.appendChild(li);
        return;
    }

    // Add each alert as a list item with timestamp, severity color, icon, and expandable details
    filteredAlerts.forEach((alert, idx) => {
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
        
        // Highlight matching text if filtering
        let summaryText = details.split(':')[2] ? details.split(':')[2] : details;
        let displayDetails = details;
        
        if (currentFilter) {
            // Highlight matching text in summary and details
            const regex = new RegExp(`(${currentFilter})`, 'gi');
            summaryText = summaryText.replace(regex, '<mark>$1</mark>');
            displayDetails = details.replace(regex, '<mark>$1</mark>');
        }
        
        li.innerHTML = `
            <span class="icon">${icon}</span>
            <span class="meta">${timestamp}</span>
            <span class="summary">${summaryText}</span>
            <button class="expand-btn" aria-label="Show details">&#x25BC;</button>
            <div class="details" style="display:none;">${displayDetails}</div>
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
    
    // Update results count
    updateResultsCount(filteredAlerts.length, allAlerts.length);
}

// Update results count display
function updateResultsCount(shown, total) {
    const existingCount = document.querySelector('.results-count');
    if (existingCount) {
        existingCount.remove();
    }
    
    if (currentFilter && total > 0) {
        const countDiv = document.createElement('div');
        countDiv.className = 'results-count';
        countDiv.textContent = `Showing ${shown} of ${total} alerts`;
        const container = document.getElementById('alerts-container');
        container.insertBefore(countDiv, container.firstChild);
    }
}

// Function to fetch alerts from the backend API and update the UI
async function fetchAlerts() {
    try {
        // Request alerts from Flask API
        const response = await fetch('/api/alerts');
        const data = await response.json();
        
        // Store all alerts globally
        allAlerts = data.alerts || [];
        
        // Render with current filter
        renderAlerts();
    } catch (error) {
        // Log errors to console for debugging
        console.error('Error fetching alerts:', error);
        const alertsList = document.getElementById('alerts-list');
        alertsList.innerHTML = '<li class="error">Error loading alerts. Check console for details.</li>';
    }
}

// Initialize filter input with debounced search
function initializeFilter() {
    const filterInput = document.getElementById('filter-input');
    if (filterInput) {
        // Debounce the filter function (300ms delay)
        const debouncedFilter = debounce((value) => {
            filterAlerts(value);
        }, 300);
        
        filterInput.addEventListener('input', (e) => {
            debouncedFilter(e.target.value);
        });
        
        // Clear filter on Escape key
        filterInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                filterInput.value = '';
                filterAlerts('');
            }
        });
    }
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    initializeFilter();
    fetchAlerts();
    // Periodic refresh every 5 seconds
    setInterval(fetchAlerts, 5000);
});

// Also run immediately if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM not ready yet
} else {
    initializeFilter();
    fetchAlerts();
    setInterval(fetchAlerts, 5000);
}
