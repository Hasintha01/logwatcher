
# Import required modules
from flask import Flask, jsonify, send_from_directory  # Flask for web server, jsonify for API responses, send_from_directory for static files
import os  # OS for file path operations

# Initialize Flask app
app = Flask(__name__, static_folder='dashboard')

# Path to the alerts log file
ALERTS_LOG = os.path.join('alerts', 'alerts.log')

# API endpoint to get all alerts
@app.route('/api/alerts')
def get_alerts():
    """
    Reads alerts from the alerts log file and returns them as a JSON list.
    """
    alerts = []
    if os.path.exists(ALERTS_LOG):
        with open(ALERTS_LOG, 'r') as f:
            for line in f:
                alerts.append(line.strip())  # Remove newline characters
    return jsonify({'alerts': alerts})

# Serve the dashboard index.html at root
@app.route('/')
def serve_dashboard():
    """
    Serves the dashboard frontend HTML file.
    """
    return send_from_directory(app.static_folder, 'index.html')

# Serve other static files (CSS, JS)
@app.route('/<path:filename>')
def serve_static(filename):
    """
    Serves static files (CSS, JS) for the dashboard frontend.
    """
    return send_from_directory(app.static_folder, filename)

# Run the Flask app (development mode)
if __name__ == '__main__':
    app.run(debug=True)
