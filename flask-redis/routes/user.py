# routes/user_routes.py
from flask import Blueprint, request, jsonify
from redisClient import get_redis_client

user = Blueprint('user', __name__)
redis_client = get_redis_client()

@user.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    if redis_client.exists(username):
        return jsonify({"error": "User already exists"}), 400

    redis_client.hset(username, "password", password)
    return jsonify({"message": "User signed up successfully"}), 201


@user.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    stored_password = redis_client.hget(username, "password")
    if not stored_password or stored_password.decode('utf-8') != password:
        return jsonify({"error": "Invalid username or password"}), 401

    return jsonify({"message": "User logged in successfully"}), 200


@user.route('/users', methods=['GET'])
def fetch_users():
    users = []
    for key in redis_client.keys():
        users.append(key.decode('utf-8'))
    return jsonify({"users": users}), 200


# @user.route('/user/<username>', methods=['DELETE'])
# def delete_user(username):
#     if not redis_client.exists(username):
#         return jsonify({"error": "User does not exist"}), 404

#     redis_client.delete(username)
#     return jsonify({"message": "User deleted successfully"}), 200

@user.route('/user/<username>', methods=['PUT'])
def update_username(username):
    data = request.get_json()
    new_username = data.get('new_username')

    if not new_username:
        return jsonify({"error": "New username is required"}), 400

    if not redis_client.exists(username):
        return jsonify({"error": "Old username does not exist"}), 404

    if redis_client.exists(new_username):
        return jsonify({"error": "New username already exists"}), 400

    # Get the user's password from the old username
    password = redis_client.hget(username, "password")

    # Delete the old username
    redis_client.delete(username)

    # Create the new username with the same password
    redis_client.hset(new_username, "password", password)

    return jsonify({"message": "Username updated successfully"}), 200
