#!/usr/bin/env python3
"""
LogWatcher Dashboard - Web interface for viewing alerts
"""

import os
import sys
import json
import logging
from flask import Flask, jsonify, send_from_directory

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, static_folder='dashboard')

# Configuration paths
CONFIG_PATH = os.path.join('config', 'config.json')
ALERTS_LOG = os.path.join('alerts', 'alerts.log')


def load_dashboard_config():
    """
    Load dashboard configuration from config.json or environment variables.
    Environment variables take precedence over config file.
    
    Returns:
        dict: Dashboard configuration with host, port, and debug settings
    """
    # Default configuration
    config = {
        'host': '127.0.0.1',
        'port': 5000,
        'debug': False
    }
    
    # Try to load from config file
    try:
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, 'r') as f:
                file_config = json.load(f)
                dashboard_config = file_config.get('dashboard', {})
                config.update(dashboard_config)
    except Exception as e:
        logger.warning(f"Could not load dashboard config from {CONFIG_PATH}: {e}")
    
    # Environment variables override config file
    config['host'] = os.environ.get('FLASK_HOST', config['host'])
    config['port'] = int(os.environ.get('FLASK_PORT', config['port']))
    
    # Check for debug mode from environment (common Flask practice)
    flask_debug = os.environ.get('FLASK_DEBUG', '').lower()
    if flask_debug in ('1', 'true', 'yes'):
        config['debug'] = True
    elif flask_debug in ('0', 'false', 'no'):
        config['debug'] = False
    
    return config


# API endpoint to get all alerts
@app.route('/api/alerts')
def get_alerts():
    """
    Reads alerts from the alerts log file and returns them as a JSON list.
    """
    alerts = []
    try:
        if os.path.exists(ALERTS_LOG):
            with open(ALERTS_LOG, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    line = line.strip()
                    if line:  # Skip empty lines
                        alerts.append(line)
        return jsonify({'alerts': alerts, 'count': len(alerts)})
    except Exception as e:
        logger.error(f"Error reading alerts log: {e}")
        return jsonify({'error': 'Failed to read alerts', 'alerts': [], 'count': 0}), 500


# Serve the dashboard index.html at root
@app.route('/')
def serve_dashboard():
    """
    Serves the dashboard frontend HTML file.
    """
    try:
        return send_from_directory(app.static_folder, 'index.html')
    except Exception as e:
        logger.error(f"Error serving dashboard: {e}")
        return f"Dashboard error: {e}", 500


# Serve other static files (CSS, JS)
@app.route('/<path:filename>')
def serve_static(filename):
    """
    Serves static files (CSS, JS) for the dashboard frontend.
    """
    try:
        return send_from_directory(app.static_folder, filename)
    except Exception as e:
        logger.error(f"Error serving static file {filename}: {e}")
        return f"File not found: {filename}", 404


def main():
    """Main entry point for the dashboard."""
    # Load configuration
    config = load_dashboard_config()
    
    logger.info("LogWatcher Dashboard starting...")
    logger.info(f"Host: {config['host']}")
    logger.info(f"Port: {config['port']}")
    logger.info(f"Debug mode: {config['debug']}")
    
    if config['debug']:
        logger.warning("⚠️  Debug mode is enabled. DO NOT use in production!")
    
    # Run the Flask app
    try:
        app.run(
            host=config['host'],
            port=config['port'],
            debug=config['debug']
        )
    except KeyboardInterrupt:
        logger.info("Dashboard shut down by user")
    except Exception as e:
        logger.error(f"Dashboard error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
