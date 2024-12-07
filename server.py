# // ./server.py

from flask import Flask, jsonify, request, send_file, send_from_directory, session
import os
import json
import random
import hashlib
import secrets

# Customize your password
your_password = '12345'

# Create Flask app with static folder configuration
app = Flask(__name__, 
    static_url_path='', 
    static_folder='static')

# Set a secret key for session management
app.secret_key = secrets.token_hex(16)  # Generate a random secret key
# print(app.secret_key)

# Constants
INDEX_FILE = 'media_index.json'
IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'}
VIDEO_EXTENSIONS = {'.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.mpeg'}
PASSWORD_HASH = hashlib.sha256(your_password.encode()).hexdigest()  # Replace with your password

class MediaIndex:
    def __init__(self, directory):
        self.directory = directory
        self.index = {}
        self.load_index()
        self.update_index()
        self.save_index()

    def load_index(self):
        if os.path.exists(INDEX_FILE):
            with open(INDEX_FILE, 'r') as f:
                try:
                    self.index = json.load(f)
                except json.JSONDecodeError:
                    self.index = {}
        else:
            self.index = {}

    def save_index(self):
        with open(INDEX_FILE, 'w') as f:
            json.dump(self.index, f, indent=4)

    def update_index(self):
        """Update the index with current files in directory"""
        current_files = set()
        
        for root_dir, _, files in os.walk(self.directory):
            nickname = os.path.basename(root_dir)
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in IMAGE_EXTENSIONS or ext in VIDEO_EXTENSIONS:
                    file_path = os.path.relpath(os.path.join(root_dir, file), self.directory)
                    current_files.add(file_path)

                    if file_path not in self.index:
                        self.index[file_path] = {
                            'file_name': file_path,
                            'rating': 1,
                            'nickname': nickname,
                            'category': '',
                            'type': 'image' if ext in IMAGE_EXTENSIONS else 'video'
                        }
                    elif self.index[file_path].get('nickname', '') != nickname:
                        self.index[file_path]['nickname'] = nickname

        # Remove entries for files that no longer exist
        indexed_files = set(self.index.keys())
        files_to_remove = indexed_files - current_files
        for file_path in files_to_remove:
            del self.index[file_path]

        self.save_index()

# Initialize MediaIndex with the current directory
media_index = MediaIndex('.')

@app.route('/')
def serve_index():
    """Serve the main HTML page"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/auth', methods=['POST'])
def authenticate():
    """Authenticate user password"""
    data = request.get_json()
    password = data.get('password', '')

    # Hash the received password and compare
    if hashlib.sha256(password.encode()).hexdigest() == PASSWORD_HASH:
        session['authenticated'] = True
        return jsonify({'success': True})
    return jsonify({'success': False}), 401

def require_auth(f):
    """Decorator to require authentication for routes"""
    def decorated(*args, **kwargs):
        if not session.get('authenticated'):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    decorated.__name__ = f.__name__
    return decorated

@app.route('/api/media')
@require_auth
def get_media_list():
    """Get the complete media index"""
    return jsonify(media_index.index)

@app.route('/api/media/filtered')
@require_auth
def get_filtered_media():
    """Get filtered media list based on query parameters"""
    ratings = request.args.getlist('rating')
    nicknames = request.args.getlist('nickname')
    categories = request.args.getlist('category')
    media_types = request.args.getlist('type')

    filtered_list = []
    for file_path, data in media_index.index.items():
        rating_match = (not ratings) or (str(data['rating']) in ratings)
        nickname_match = (not nicknames) or (data['nickname'] in nicknames)
        category_match = (not categories) or (data['category'] in categories)
        media_type_match = (not media_types) or (data['type'] in media_types)

        if rating_match and nickname_match and category_match and media_type_match:
            filtered_list.append(file_path)

    random.shuffle(filtered_list)
    return jsonify(filtered_list)

@app.route('/api/media/<path:file_path>')
@require_auth
def serve_media(file_path):
    """Serve media files"""
    full_path = os.path.join(media_index.directory, file_path)
    return send_file(full_path)

if __name__ == '__main__':
    os.makedirs('static', exist_ok=True)
    app.run(host='0.0.0.0', port=1111, debug=True)