# LogWatcher

**Automated Log Monitoring & Alert System**

A lightweight Python tool that watches your log files in real-time and alerts you when specific keywords (like "ERROR", "CRITICAL") appear. Stop manually checking logs—get instant notifications when issues occur.

## What It Does

1. Monitors log files continuously for new entries
2. Detects keywords you configure (errors, warnings, etc.)
3. Alerts you instantly (console, email, or Slack)
4. Logs all alerts to `alerts/alerts.log` for review
5. Optional web dashboard to visualize alerts

## Features
- ⚡ Real-time log monitoring with minimal resource usage
- 🎯 Pattern-based keyword detection (configurable)
- 🔔 Multiple alert methods: console, email, Slack
- 📝 Automatic incident logging
- 🎨 Optional Flask web dashboard
- 🛡️ Graceful shutdown and error handling
- ⚙️ Config validation with sensible defaults
- 🔄 **Log rotation & truncation detection** - automatically handles rotated/truncated logs

## Quick Start

```bash
# 1. Create virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1  # Windows PowerShell
# source .venv/bin/activate  # Linux/Mac

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure (edit config/config.json)
# Set your log files and keywords

# 4. Start monitoring
python monitor.py

# 5. (Optional) View dashboard
python dashboard.py
# Open http://localhost:5000
```

## Configuration

Edit `config/config.json`:

```json
{
  "log_files": ["logs/system.log"],
  "keywords": {
    "ERROR": "Critical",
    "WARNING": "Warning"
  },
  "alert_methods": ["console"],
  "dashboard": {
    "host": "127.0.0.1",
    "port": 5000,
    "debug": false
  }
}
```

**Configuration options:**
- `log_files`: Array of log file paths to monitor
- `keywords`: Map keywords to severity levels (Info, Warning, Critical)
- `alert_methods`: Alert types (console, email, slack)
- `dashboard.debug`: Enable Flask debug mode (false for production)
- `dashboard.host`: Dashboard host (default: 127.0.0.1)
- `dashboard.port`: Dashboard port (default: 5000)

**Environment variables** (override config):
- `FLASK_DEBUG=1` - Enable debug mode
- `FLASK_HOST=0.0.0.0` - Change host
- `FLASK_PORT=8080` - Change port

## Folder Structure
```
logwatcher/
├── logs/              # Log files to monitor
├── alerts/            # Generated alerts
├── config/            # Configuration
│   └── config.json
├── dashboard/         # Web UI files
├── monitor.py         # Main monitoring script
├── dashboard.py       # Web dashboard
└── requirements.txt   # Dependencies
```

## Log Rotation & Truncation Support

LogWatcher automatically handles log rotation and truncation:

**What it detects:**
- ✅ **File rotation** - when logs are renamed and a new file is created (e.g., `app.log` → `app.log.1`)
- ✅ **File truncation** - when logs are cleared/truncated
- ✅ **File deletion** - waits for file to reappear

**How it works:**
1. Monitors file inode/index and size
2. Detects when file changes
3. Automatically reopens and continues monitoring
4. Logs rotation events for transparency

**Example:**
```
2025-11-07 10:30:00 - monitor - INFO - Starting to monitor: logs/app.log
2025-11-07 12:00:00 - monitor - INFO - Log rotation detected for logs/app.log. Reopening file...
2025-11-07 12:00:01 - monitor - INFO - Seeked to end of file (line 0)
```

This means you can use LogWatcher with **logrotate**, Windows log rotation, or any log management tool without interruption!

## Troubleshooting

**Virtual environment issues (Windows)**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Module not found**
- Activate virtual environment first
- Run: `pip install -r requirements.txt`

**Log file not found**
- Check paths in `config/config.json` are correct
- Use absolute or relative paths from project root

## Requirements

- Python 3.7+
- Flask 3.0.0 (see `requirements.txt`)

---

**License:** MIT | **Contributing:** Pull requests welcome!
