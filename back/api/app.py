from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import bcrypt
import jwt
import datetime
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# -------------------
# CONFIG
# -------------------
MONGO_URI = os.getenv("MONGO_HOST", "mongodb://localhost:27017")
JWT_SECRET = os.getenv("JWT_SECRET", "secret")

client = MongoClient(MONGO_URI)
db = client["hospital"]

# -------------------
# JWT
# -------------------
def create_token(user):
    token = jwt.encode({
        "user_id": str(user["_id"]),
        "username": user["username"],
        "role": user["role"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, JWT_SECRET, algorithm="HS256")

    if isinstance(token, bytes):
        token = token.decode("utf-8")

    return token


def decode_token(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except:
        return None


def get_user_optional():
    auth = request.headers.get("Authorization")
    if not auth:
        return None
    try:
        token = auth.split(" ")[1]
        return decode_token(token)
    except:
        return None


def get_user_required():
    return get_user_optional()


# -------------------
# REGISTER
# -------------------
@app.route("/register", methods=["POST"])
def register():
    data = request.json

    if db.users.find_one({"username": data["username"]}):
        return jsonify({"error": "exists"}), 400

    hashed = bcrypt.hashpw(
        data["password"].encode(),
        bcrypt.gensalt()
    )

    user = {
        "username":       data["username"],
        "password":       hashed,
        "role":           data.get("role", "patient"),
        "name":           data.get("name", ""),
        "last_name":      data.get("last_name", ""),
        "identification": data.get("identification", ""),
        "email":          data.get("email", ""),
        "blood_type":     data.get("blood_type", ""),
        "rh":             data.get("rh", ""),
        "phone":          data.get("phone", ""),
        "height":         data.get("height", ""),
    }

    result = db.users.insert_one(user)
    user["_id"] = result.inserted_id

    token = create_token(user)

    return jsonify({
        "access_token": token,
        "role": user["role"]
    })

# -------------------
# LOGIN
# -------------------
@app.route("/login", methods=["POST"])
def login():
    data = request.json

    user = db.users.find_one({"username": data["username"]})

    if not user:
        return jsonify({"error": "not found"}), 404

    if not bcrypt.checkpw(data["password"].encode(), user["password"]):
        return jsonify({"error": "wrong password"}), 401

    token = create_token(user)

    return jsonify({
        "access_token": token,
        "role": user["role"]
    })


# -------------------
# PROFILE (OPTIONAL AUTH)
# -------------------
@app.route("/profile", methods=["GET"])
def profile():
    user = get_user_optional()

    if not user:
        return jsonify({"message": "no session"})

    db_user = db.users.find_one(
        {"_id": ObjectId(user["user_id"])},
        {"password": 0}
    )

    if not db_user:
        return jsonify({"error": "not found"}), 404

    db_user["_id"] = str(db_user["_id"])
    return jsonify(db_user)


# -------------------
# DOCTORS (FROM USERS)
# -------------------
@app.route("/doctors", methods=["GET"])
def get_doctors():
    doctors = list(db.users.find(
        {"role": "doctor"},
        {"password": 0}
    ))

    for d in doctors:
        d["_id"] = str(d["_id"])

    return jsonify(doctors)


# -------------------
# SCHEDULES
# -------------------
@app.route("/schedule/<doctor_id>", methods=["GET"])
def get_schedules(doctor_id):
    data = list(db.schedules.find({
        "doctor_id": doctor_id,
        "available": True
    }))

    for s in data:
        s["_id"] = str(s["_id"])

    return jsonify(data)


@app.route("/schedule/<doctor_id>", methods=["POST"])
def create_schedule(doctor_id):
    data = request.json

    doctor = db.users.find_one({
        "_id": ObjectId(doctor_id),
        "role": "doctor"
    })

    if not doctor:
        return jsonify({"error": "doctor not found"}), 404

    db.schedules.insert_one({
        "doctor_id": doctor_id,
        "date": data["date"],
        "time": data["time"],
        "available": True
    })

    return jsonify({"message": "created"})


# -------------------
# APPOINTMENTS
# -------------------
@app.route("/appointments", methods=["GET"])
def get_appointments():
    user = get_user_optional()

    data = list(db.appointments.find())

    for d in data:
        d["_id"] = str(d["_id"])

    return jsonify(data)


@app.route("/appointments", methods=["POST"])
def create_appointment():
    user = get_user_optional()

    data = request.json

    schedule = db.schedules.find_one({
        "_id": ObjectId(data["schedule_id"])
    })

    if not schedule or not schedule.get("available"):
        return jsonify({"error": "not available"}), 400

    db.appointments.insert_one({
        "doctor_id": schedule["doctor_id"],
        "patient": data.get("patient", "anonymous"),
        "schedule_id": data["schedule_id"],
        "date": schedule["date"],
        "time": schedule["time"]
    })

    db.schedules.update_one(
        {"_id": ObjectId(data["schedule_id"])},
        {"$set": {"available": False}}
    )

    return jsonify({"message": "created"})


@app.route("/appointment/<id>", methods=["DELETE", "OPTIONS"])
def delete_appointment(id):
    if request.method == "OPTIONS":
        return jsonify({}), 200
    db.appointments.delete_one({"_id": ObjectId(id)})
    return jsonify({"message": "deleted"})

# Historial médico - crear
@app.route("/history", methods=["POST"])
def create_history():
    data = request.json
    db.history.insert_one({
        "patient_id": data["patient_id"],
        "doctor_id":  data["doctor_id"],
        "diagnosis":  data["diagnosis"],
        "treatment":  data["treatment"],
        "notes":      data.get("notes", ""),
        "date":       data.get("date", "")
    })
    return jsonify({"message": "created"})

# Historial médico - obtener por paciente
@app.route("/history/<patient_id>", methods=["GET"])
def get_history(patient_id):
    records = list(db.history.find({"patient_id": patient_id}))
    for r in records:
        r["_id"] = str(r["_id"])
    return jsonify(records)

@app.route("/history/<patient_id>", methods=["GET"])
def get_history(patient_id):
    records = list(db.history.find({"patient_id": patient_id}))
    for r in records:
        r["_id"] = str(r["_id"])
    return jsonify(records)

# Completar/terminar una cita
@app.route("/appointment/<id>/complete", methods=["POST", "OPTIONS"])
def complete_appointment(id):
    if request.method == "OPTIONS":
        return jsonify({}), 200
    db.appointments.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": "completed"}}
    )
    return jsonify({"message": "completed"})
# -------------------
# MAIN
# -------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)