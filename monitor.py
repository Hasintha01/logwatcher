import os
import time
import json
from datetime import datetime

CONFIG_PATH = os.path.join('config', 'config.json')
ALERTS_LOG = os.path.join('alerts', 'alerts.log')

# Load config
with open(CONFIG_PATH, 'r') as f:
    config = json.load(f)
 # Load config
with open(CONFIG_PATH, 'r') as f:
    config = json.load(f)

LOG_FILES = config.get('log_files', ['logs/system.log'])
KEYWORDS = config.get('keywords', {})
ALERT_METHODS = config.get('alert_methods', ['console'])

# Alerting functions

def alert_console(severity, line, timestamp):
    print(f"[{timestamp}] [{severity}] {line.strip()}")
def alert_console(severity, line, timestamp):
    """
    Print alert to console.
    """
    print(f"[{timestamp}] [{severity}] {line.strip()}")

# Incident logging

def log_incident(severity, line, timestamp, file, lineno):
    with open(ALERTS_LOG, 'a') as f:
        f.write(f"[{timestamp}] [{severity}] {file}:{lineno} {line}")
def log_incident(severity, line, timestamp, file, lineno):
    """
    Log incident to alerts.log for later review.
    """
    with open(ALERTS_LOG, 'a') as f:
        f.write(f"[{timestamp}] [{severity}] {file}:{lineno} {line}")

# Monitor function

def monitor_file(filepath):
    print(f"Monitoring {filepath}...")
    with open(filepath, 'r') as f:
        f.seek(0, os.SEEK_END)
        lineno = sum(1 for _ in open(filepath))
        while True:
            line = f.readline()
            if not line:
                time.sleep(0.5)
                continue
            lineno += 1
            for keyword, severity in KEYWORDS.items():
                if keyword in line:
                    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    if 'console' in ALERT_METHODS:
                        alert_console(severity, line, timestamp)
                    log_incident(severity, line, timestamp, filepath, lineno)
def monitor_file(filepath):
    """
    Monitor a log file for new lines containing alert keywords.
    """
    print(f"Monitoring {filepath}...")
    with open(filepath, 'r') as f:
        f.seek(0, os.SEEK_END)  # Start at end of file to avoid processing old logs
        lineno = sum(1 for _ in open(filepath))  # Track line numbers for incident logging
        while True:
            line = f.readline()
            if not line:
                time.sleep(0.5)
                continue
            lineno += 1
            for keyword, severity in KEYWORDS.items():
                if keyword in line:
                    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    if 'console' in ALERT_METHODS:
                        alert_console(severity, line, timestamp)
                    log_incident(severity, line, timestamp, filepath, lineno)

if __name__ == "__main__":
    for log_file in LOG_FILES:
        if os.path.exists(log_file):
            monitor_file(log_file)
        else:
            print(f"Log file not found: {log_file}")
if __name__ == "__main__":
    # TODO: Add support for email and Slack alerts (see config.json for settings)
    for log_file in LOG_FILES:
        if os.path.exists(log_file):
            monitor_file(log_file)
        else:
            print(f"Log file not found: {log_file}")
