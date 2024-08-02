# app.py
from flask import Flask, jsonify
from routes.user import user

app = Flask(__name__)

@app.route('/', methods=['GET'])
def hello():
    return jsonify({"message": "Hello"}), 200

# Register Blueprints
app.register_blueprint(user, url_prefix="/")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
