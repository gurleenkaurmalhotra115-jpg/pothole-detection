from flask import Flask
from flask_cors import CORS
from routes.complaints import complaints_bp
import os

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

# Config
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB
app.config['COMPLAINTS_FILE'] = 'data/complaints.json'

# Ensure dirs exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs('data', exist_ok=True)

# Register blueprints
app.register_blueprint(complaints_bp, url_prefix='/complaints')

@app.route('/health')
def health():
    return {'status': 'ok', 'version': '1.0.0'}

if __name__ == '__main__':
    app.run(debug=True, port=5000)
