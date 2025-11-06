#!/usr/bin/env python3
"""
LogWatcher - Automated Log Monitoring & Alert System
Monitors log files for specified keywords and triggers alerts.
"""

import os
import sys
import time
import json
import signal
import logging
from datetime import datetime
from pathlib import Path

# Configuration paths
CONFIG_PATH = os.path.join('config', 'config.json')
ALERTS_DIR = 'alerts'
ALERTS_LOG = os.path.join(ALERTS_DIR, 'alerts.log')

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Global flag for graceful shutdown
shutdown_requested = False


def signal_handler(signum, frame):
    """Handle shutdown signals gracefully."""
    global shutdown_requested
    logger.info(f"Received signal {signum}. Shutting down gracefully...")
    shutdown_requested = True


def load_config():
    """
    Load and validate configuration from config.json.
    
    Returns:
        dict: Validated configuration dictionary
        
    Raises:
        SystemExit: If configuration is invalid or missing
    """
    try:
        with open(CONFIG_PATH, 'r') as f:
            config = json.load(f)
    except FileNotFoundError:
        logger.error(f"Configuration file not found: {CONFIG_PATH}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in configuration file: {e}")
        sys.exit(1)
    
    # Validate and set defaults
    if 'log_files' not in config or not config['log_files']:
        logger.warning("No log_files specified in config. Using default: logs/system.log")
        config['log_files'] = ['logs/system.log']
    
    if 'keywords' not in config or not config['keywords']:
        logger.warning("No keywords specified in config. Using defaults.")
        config['keywords'] = {
            'ERROR': 'Critical',
            'CRITICAL': 'Critical',
            'WARNING': 'Warning'
        }
    
    if 'alert_methods' not in config or not config['alert_methods']:
        logger.warning("No alert_methods specified in config. Using default: console")
        config['alert_methods'] = ['console']
    
    # Validate severity levels
    valid_severities = ['Info', 'Warning', 'Critical']
    for keyword, severity in config['keywords'].items():
        if severity not in valid_severities:
            logger.warning(
                f"Invalid severity '{severity}' for keyword '{keyword}'. "
                f"Valid values: {valid_severities}. Defaulting to 'Warning'."
            )
            config['keywords'][keyword] = 'Warning'
    
    logger.info("Configuration loaded and validated successfully")
    return config


def ensure_alerts_directory():
    """Ensure the alerts directory exists."""
    Path(ALERTS_DIR).mkdir(parents=True, exist_ok=True)
    logger.debug(f"Alerts directory ensured: {ALERTS_DIR}")


def alert_console(severity, line, timestamp):
    """
    Print alert to console.
    
    Args:
        severity (str): Alert severity level
        line (str): Log line that triggered the alert
        timestamp (str): Timestamp when alert was triggered
    """
    logger.info(f"[{severity}] {line.strip()}")


def log_incident(severity, line, timestamp, file, lineno):
    """
    Log incident to alerts.log for later review.
    
    Args:
        severity (str): Alert severity level
        line (str): Log line that triggered the alert
        timestamp (str): Timestamp when alert was triggered
        file (str): Path to the log file
        lineno (int): Line number in the log file
    """
    try:
        with open(ALERTS_LOG, 'a', encoding='utf-8') as f:
            f.write(f"[{timestamp}] [{severity}] {file}:{lineno} {line}")
            if not line.endswith('\n'):
                f.write('\n')
    except Exception as e:
        logger.error(f"Failed to write to alerts log: {e}")


def count_file_lines(filepath):
    """
    Safely count the number of lines in a file.
    
    Args:
        filepath (str): Path to the file
        
    Returns:
        int: Number of lines in the file
    """
    count = 0
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            for count, _ in enumerate(f, 1):
                pass
    except Exception as e:
        logger.warning(f"Error counting lines in {filepath}: {e}")
    return count


def monitor_file(filepath, keywords, alert_methods):
    """
    Monitor a log file for new lines containing alert keywords.
    
    Args:
        filepath (str): Path to the log file to monitor
        keywords (dict): Dictionary of keywords and their severity levels
        alert_methods (list): List of alert methods to use
    """
    global shutdown_requested
    
    logger.info(f"Starting to monitor: {filepath}")
    
    try:
        # Count initial lines safely
        lineno = count_file_lines(filepath)
        logger.debug(f"Starting at line {lineno} in {filepath}")
        
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            # Seek to end of file to avoid processing old logs
            f.seek(0, os.SEEK_END)
            
            while not shutdown_requested:
                line = f.readline()
                if not line:
                    time.sleep(0.5)
                    continue
                
                lineno += 1
                
                # Check for keywords
                for keyword, severity in keywords.items():
                    if keyword in line:
                        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                        
                        # Trigger alerts based on configured methods
                        if 'console' in alert_methods:
                            alert_console(severity, line, timestamp)
                        
                        # Always log incidents
                        log_incident(severity, line, timestamp, filepath, lineno)
                        
                        # Only alert once per line (break after first keyword match)
                        break
                        
    except FileNotFoundError:
        logger.error(f"Log file not found: {filepath}")
    except Exception as e:
        logger.error(f"Error monitoring {filepath}: {e}")
    finally:
        logger.info(f"Stopped monitoring: {filepath}")


def main():
    """Main entry point for the log monitor."""
    # Register signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    logger.info("LogWatcher starting up...")
    
    # Load and validate configuration
    config = load_config()
    
    # Ensure alerts directory exists
    ensure_alerts_directory()
    
    # Extract configuration values
    log_files = config.get('log_files', ['logs/system.log'])
    keywords = config.get('keywords', {})
    alert_methods = config.get('alert_methods', ['console'])
    
    logger.info(f"Monitoring {len(log_files)} log file(s)")
    logger.info(f"Watching for {len(keywords)} keyword(s): {list(keywords.keys())}")
    logger.info(f"Alert methods: {alert_methods}")
    
    # Monitor log files
    # Note: Currently monitors files sequentially. For multiple files,
    # consider using threads or multiprocessing in the future.
    for log_file in log_files:
        if os.path.exists(log_file):
            try:
                monitor_file(log_file, keywords, alert_methods)
            except KeyboardInterrupt:
                logger.info("Keyboard interrupt received")
                break
        else:
            logger.warning(f"Log file not found, skipping: {log_file}")
    
    logger.info("LogWatcher shut down complete")


if __name__ == "__main__":
    main()
