from flask import Flask, request, jsonify
from pymongo import MongoClient
from keycloak import KeycloakOpenID
import requests
import os
import time

app = Flask(__name__)

# ---------------------------------
# Environment variables
# ---------------------------------

import os

MONGO_URI = os.getenv("MONGO_HOST")

KEYCLOAK_URI = os.getenv("KEYCLOAK_HOST")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM")
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID")
KEYCLOAK_CLIENT_SECRET = os.getenv("KEYCLOAK_CLIENT_SECRET")

# ---------------------------------
# MongoDB Connection
# ---------------------------------

def wait_for_mongo():
    while True:
        try:
            client = MongoClient(MONGO_URI)
            client.admin.command("ping")
            print("MongoDB listo")
            return client
        except Exception as e:
            print("Esperando MongoDB...", e)
            time.sleep(3)

mongo_client = wait_for_mongo()

# ---------------------------------
# Create DB and Collections
# ---------------------------------

DB_NAME = "hospital"

def init_database():
    db = mongo_client[DB_NAME]

    existing_collections = db.list_collection_names()

    required_collections = [
        "users",
        "doctors",
        "schedules",
        "pdfs"
    ]

    for collection in required_collections:
        if collection not in existing_collections:
            db.create_collection(collection)
            print(f"Collection '{collection}' creada")
        else:
            print(f"Collection '{collection}' ya existe")

    return db

db = init_database()

# ---------------------------------
# USER ROUTES
# ---------------------------------

@app.route("/user", methods=["POST"])
def add_user():
    data = request.json

    db.users.insert_one(data)

    return jsonify({
        "message": "User created"
    }), 201


@app.route("/user/<user_id>", methods=["GET"])
def get_user(user_id):

    user = db.users.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    return jsonify(user), 200


@app.route("/user/<user_id>", methods=["PUT"])
def update_user(user_id):

    data = request.json

    db.users.update_one(
        {"user_id": user_id},
        {"$set": data}
    )

    return jsonify({
        "message": "User updated"
    }), 200


@app.route("/user/<user_id>", methods=["DELETE"])
def delete_user(user_id):

    db.users.delete_one({
        "user_id": user_id
    })

    return jsonify({
        "message": "User deleted"
    }), 200


# ---------------------------------
# DOCTOR ROUTES
# ---------------------------------

@app.route("/doctor", methods=["POST"])
def add_doctor():

    data = request.json

    db.doctors.insert_one(data)

    return jsonify({
        "message": "Doctor created"
    }), 201


@app.route("/doctor/<doctor_id>", methods=["GET"])
def get_doctor(doctor_id):

    doctor = db.doctors.find_one(
        {"doctor_id": doctor_id},
        {"_id": 0}
    )

    if not doctor:
        return jsonify({
            "error": "Doctor not found"
        }), 404

    return jsonify(doctor), 200


# ---------------------------------
# SCHEDULE ROUTES
# ---------------------------------

@app.route("/schedule/<doctor_id>", methods=["POST"])
def add_schedule(doctor_id):

    data = request.json
    data["doctor_id"] = doctor_id

    db.schedules.insert_one(data)

    return jsonify({
        "message": "Schedule added"
    }), 201


@app.route("/schedule/<doctor_id>", methods=["GET"])
def get_schedule(doctor_id):

    schedules = list(
        db.schedules.find(
            {"doctor_id": doctor_id},
            {"_id": 0}
        )
    )

    return jsonify(schedules), 200


# ---------------------------------
# PDF ROUTES
# ---------------------------------

@app.route("/upload", methods=["POST"])
def add_pdf():

    file = request.files["file"]

    os.makedirs("./uploads", exist_ok=True)

    upload_path = f"./uploads/{file.filename}"

    file.save(upload_path)

    db.pdfs.insert_one({
        "filename": file.filename,
        "path": upload_path
    })

    return jsonify({
        "message": "PDF uploaded",
        "path": upload_path
    }), 201


# ---------------------------------
# KEYCLOAK
# ---------------------------------
def wait_for_keycloak():

    while True:
        try:
            response = requests.get(
                f"{KEYCLOAK_URI}/realms/master",
                timeout=5
            )

            if response.status_code == 200:
                print("Keycloak listo")
                return

        except Exception as e:
            print("Esperando Keycloak...", e)

        time.sleep(3)

wait_for_keycloak()

keycloak_openid = KeycloakOpenID(
    server_url=KEYCLOAK_URI,
    client_id=KEYCLOAK_CLIENT_ID,
    realm_name=KEYCLOAK_REALM,
    client_secret_key=KEYCLOAK_CLIENT_SECRET
)


@app.route("/login", methods=["POST"])
def login():

    data = request.json

    token = keycloak_openid.token(
        data["username"],
        data["password"]
    )

    return jsonify(token), 200


# ---------------------------------
# MAIN
# ---------------------------------

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )