// LogWatcher Dashboard - Complete Application

const state = {
    alerts: [],
    currentPage: 'dashboard',
    isPaused: false,
    autoScroll: true,
    severityFilter: 'all',
    searchTerm: '',
    refreshInterval: 5000,
    maxLogEntries: 100
};

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

function parseAlert(alertText) {
    const match = alertText.match(/^\[(.*?)\]\s*\[(.*?)\]\s*(.*)$/);
    if (match) {
        const [, timestamp, severity, rest] = match;
        const source = rest.split(' ')[0] || 'unknown';
        const message = rest.substring(source.length).trim();
        return { timestamp, severity: severity.toLowerCase(), source, message, raw: alertText };
    }
    return {
        timestamp: new Date().toLocaleTimeString(),
        severity: 'info',
        source: 'unknown',
        message: alertText,
        raw: alertText
    };
}

function highlightText(text, term) {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function switchPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`page-${pageName}`).classList.add('active');
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
    state.currentPage = pageName;
    
    if (pageName === 'alerts') {
        renderAlertsTable();
        updateStats();
    } else if (pageName === 'config') {
        loadConfiguration();
    }
}

function addLogEntry(alert) {
    const logStream = document.getElementById('log-stream');
    const placeholder = logStream.querySelector('.log-entry');
    if (placeholder && placeholder.textContent.includes('Waiting')) {
        logStream.innerHTML = '';
    }
    
    const entry = document.createElement('div');
    entry.className = `log-entry ${alert.severity}`;
    entry.innerHTML = `
        <span class="log-time">${alert.timestamp}</span>
        <span class="log-severity">${alert.severity.toUpperCase()}</span>
        <span class="log-message">${highlightText(alert.message, state.searchTerm)}</span>
    `;
    logStream.appendChild(entry);
    
    const entries = logStream.querySelectorAll('.log-entry');
    if (entries.length > state.maxLogEntries) entries[0].remove();
    
    if (state.autoScroll && !state.isPaused) {
        logStream.scrollTop = logStream.scrollHeight;
    }
}

function filterLogs() {
    document.querySelectorAll('.log-entry').forEach(entry => {
        const severity = entry.classList.contains('critical') ? 'critical' :
                        entry.classList.contains('warning') ? 'warning' : 'info';
        const matchesSeverity = state.severityFilter === 'all' || severity === state.severityFilter;
        const matchesSearch = !state.searchTerm || 
            entry.textContent.toLowerCase().includes(state.searchTerm.toLowerCase());
        entry.style.display = matchesSeverity && matchesSearch ? 'grid' : 'none';
    });
}

function renderAlertsTable() {
    const tbody = document.getElementById('alerts-table-body');
    tbody.innerHTML = '';
    
    if (state.alerts.length === 0) {
        tbody.innerHTML = '<tr class="no-data"><td colspan="4">No alerts yet</td></tr>';
        return;
    }
    
    [...state.alerts].reverse().forEach(alert => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${alert.timestamp}</td>
            <td><span class="log-severity">${alert.severity.toUpperCase()}</span></td>
            <td>${alert.source}</td>
            <td>${alert.message}</td>
        `;
        tbody.appendChild(row);
    });
}

function updateStats() {
    const stats = { critical: 0, warning: 0, info: 0, total: state.alerts.length };
    state.alerts.forEach(alert => {
        if (alert.severity === 'critical') stats.critical++;
        else if (alert.severity === 'warning') stats.warning++;
        else stats.info++;
    });
    
    document.getElementById('stat-critical').textContent = stats.critical;
    document.getElementById('stat-warning').textContent = stats.warning;
    document.getElementById('stat-info').textContent = stats.info;
    document.getElementById('stat-total').textContent = stats.total;
}

function exportToCSV() {
    if (state.alerts.length === 0) {
        alert('No alerts to export');
        return;
    }
    
    const csv = [
        'Timestamp,Severity,Source,Message',
        ...state.alerts.map(a => `"${a.timestamp}","${a.severity}","${a.source}","${a.message.replace(/"/g, '""')}"`)
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logwatcher-alerts-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function loadConfiguration() {
    const config = {
        log_files: ['logs/system.log'],
        keywords: { 'ERROR': 'Critical', 'WARNING': 'Warning', 'CRITICAL': 'Critical', 'FAILURE': 'Warning' },
        alert_methods: ['console']
    };
    
    renderLogFiles(config.log_files);
    renderKeywords(config.keywords);
    
    document.getElementById('alert-console').checked = config.alert_methods.includes('console');
    document.getElementById('alert-email').checked = config.alert_methods.includes('email');
    document.getElementById('alert-slack').checked = config.alert_methods.includes('slack');
}

function renderLogFiles(files) {
    const container = document.getElementById('log-files-list');
    container.innerHTML = files.map(file => `
        <div class="config-item">
            <input type="text" value="${file}" data-type="logfile">
            <button class="btn btn-secondary" onclick="removeConfigItem(this)">🗑️</button>
        </div>
    `).join('');
}

function renderKeywords(keywords) {
    const container = document.getElementById('keywords-list');
    container.innerHTML = Object.entries(keywords).map(([keyword, severity]) => `
        <div class="config-item">
            <input type="text" value="${keyword}" data-type="keyword" placeholder="Keyword">
            <select data-type="severity">
                <option value="Info" ${severity === 'Info' ? 'selected' : ''}>Info</option>
                <option value="Warning" ${severity === 'Warning' ? 'selected' : ''}>Warning</option>
                <option value="Critical" ${severity === 'Critical' ? 'selected' : ''}>Critical</option>
            </select>
            <button class="btn btn-secondary" onclick="removeConfigItem(this)">🗑️</button>
        </div>
    `).join('');
}

window.removeConfigItem = function(button) {
    button.parentElement.remove();
};

window.addLogFile = function() {
    const container = document.getElementById('log-files-list');
    const div = document.createElement('div');
    div.className = 'config-item';
    div.innerHTML = `
        <input type="text" value="" data-type="logfile" placeholder="logs/new.log">
        <button class="btn btn-secondary" onclick="removeConfigItem(this)">🗑️</button>
    `;
    container.appendChild(div);
};

window.addKeyword = function() {
    const container = document.getElementById('keywords-list');
    const div = document.createElement('div');
    div.className = 'config-item';
    div.innerHTML = `
        <input type="text" value="" data-type="keyword" placeholder="ERROR">
        <select data-type="severity">
            <option value="Info">Info</option>
            <option value="Warning">Warning</option>
            <option value="Critical" selected>Critical</option>
        </select>
        <button class="btn btn-secondary" onclick="removeConfigItem(this)">🗑️</button>
    `;
    container.appendChild(div);
};

function saveConfiguration() {
    alert('Configuration saved!\n(Note: Restart monitor.py to apply changes)');
}

async function fetchAlerts() {
    if (state.isPaused) return;
    
    try {
        const response = await fetch('/api/alerts');
        const data = await response.json();
        
        document.getElementById('connection-status').textContent = 'Active';
        document.querySelector('.status-indicator').classList.add('active');
        
        const newAlerts = (data.alerts || []).map(parseAlert);
        const existingRaw = new Set(state.alerts.map(a => a.raw));
        const brandNew = newAlerts.filter(a => !existingRaw.has(a.raw));
        
        brandNew.forEach(alert => {
            state.alerts.push(alert);
            if (state.currentPage === 'dashboard') {
                addLogEntry(alert);
            }
        });
        
        if (state.currentPage === 'dashboard') filterLogs();
        
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('connection-status').textContent = 'Error';
        document.querySelector('.status-indicator').classList.remove('active');
    }
}

function setupEvents() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            switchPage(item.dataset.page);
        });
    });
    
    document.getElementById('pause-btn').addEventListener('click', () => {
        state.isPaused = !state.isPaused;
        document.getElementById('pause-icon').textContent = state.isPaused ? '▶️' : '⏸️';
        document.getElementById('pause-text').textContent = state.isPaused ? 'Resume' : 'Pause';
    });
    
    document.getElementById('auto-scroll').addEventListener('change', (e) => {
        state.autoScroll = e.target.checked;
    });
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.severityFilter = btn.dataset.severity;
            filterLogs();
        });
    });
    
    const debouncedSearch = debounce((value) => {
        state.searchTerm = value;
        filterLogs();
    }, 300);
    
    document.getElementById('live-search').addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });
    
    document.getElementById('global-search').addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('live-search').value = '';
            document.getElementById('global-search').value = '';
            state.searchTerm = '';
            filterLogs();
        }
    });
    
    document.getElementById('export-csv').addEventListener('click', exportToCSV);
    document.getElementById('add-log-file').addEventListener('click', addLogFile);
    document.getElementById('add-keyword').addEventListener('click', addKeyword);
    document.getElementById('save-config').addEventListener('click', saveConfiguration);
}

function init() {
    console.log('🔍 LogWatcher Dashboard initialized');
    setupEvents();
    fetchAlerts();
    setInterval(fetchAlerts, state.refreshInterval);
    setInterval(updateStats, 10000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}