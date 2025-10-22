# LogWatcher

Automated Log Monitoring & Alert System

## Features
- Real-time log monitoring
- Pattern-based detection (configurable via `config/config.json`)
- Console, email, or Slack alerting
- Incident logging to `alerts/alerts.log`
- Severity classification (Info, Warning, Critical)
- Lightweight deployment
- Optional Flask dashboard for alert visualization

## Quick Start
1. Edit `config/config.json` to set log files and alert preferences.
2. Run `python monitor.py` to start monitoring.
3. (Optional) Use `deploy.sh` for quick demo.

## Folder Structure
```
logwatcher/
├── logs/
│   └── system.log
├── alerts/
│   └── alerts.log
├── config/
│   └── config.json
├── monitor.py
├── README.md
├── deploy.sh
└── screenshots/
```
