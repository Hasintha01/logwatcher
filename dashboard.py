
# Import required modules
from flask import Flask, jsonify  # Flask for web server, jsonify for API responses
import os  # OS for file path operations

# Initialize Flask app
app = Flask(__name__)

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

# Root endpoint for basic status/info
@app.route('/')
def index():
    """
    Simple status message for backend root.
    """
    return "LogWatcher Dashboard Backend is running. Connect your frontend to /api/alerts."

# Run the Flask app (development mode)
if __name__ == '__main__':
    app.run(debug=True)
