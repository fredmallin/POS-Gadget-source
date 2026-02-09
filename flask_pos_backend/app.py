from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import jwt
import datetime
import uuid

app = Flask(__name__)
CORS(app)

# ================= CONFIG =================
app.config['SECRET_KEY'] = "supersecretkey"
app.config['MAIL_SERVER'] = "smtp.gmail.com"  # or your SMTP server
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = "your_email@gmail.com"  # your email
app.config['MAIL_PASSWORD'] = "your_email_password"  # app password or SMTP password

mail = Mail(app)

# ================= DATABASE =================
def init_db():
    conn = sqlite3.connect("users.db")
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            password_hash TEXT,
            reset_token TEXT,
            token_expiry DATETIME
        )
    ''')
    conn.commit()
    conn.close()

init_db()

def get_user_by_username(username):
    conn = sqlite3.connect("users.db")
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE username=?", (username,))
    user = cur.fetchone()
    conn.close()
    return user

def get_user_by_email(email):
    conn = sqlite3.connect("users.db")
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE email=?", (email,))
    user = cur.fetchone()
    conn.close()
    return user

def update_user_password(user_id, new_hash):
    conn = sqlite3.connect("users.db")
    cur = conn.cursor()
    cur.execute("UPDATE users SET password_hash=? WHERE id=?", (new_hash, user_id))
    conn.commit()
    conn.close()

def set_reset_token(user_id, token, expiry):
    conn = sqlite3.connect("users.db")
    cur = conn.cursor()
    cur.execute("UPDATE users SET reset_token=?, token_expiry=? WHERE id=?", (token, expiry, user_id))
    conn.commit()
    conn.close()

def get_user_by_token(token):
    conn = sqlite3.connect("users.db")
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE reset_token=?", (token,))
    user = cur.fetchone()
    conn.close()
    return user

# ================= ROUTES =================

# ------ REGISTER (optional, for testing) ------
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data["username"]
    email = data["email"]
    password = generate_password_hash(data["password"])

    try:
        conn = sqlite3.connect("users.db")
        cur = conn.cursor()
        cur.execute("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)", (username, email, password))
        conn.commit()
        conn.close()
        return jsonify({"message": "User registered successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# ------ LOGIN ------
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data["username"]
    password = data["password"]

    user = get_user_by_username(username)
    if user and check_password_hash(user[3], password):
        token = jwt.encode(
            {"user_id": user[0], "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2)},
            app.config['SECRET_KEY'],
            algorithm="HS256"
        )
        return jsonify({"user": {"id": user[0], "username": user[1]}, "token": token})
    return jsonify({"error": "Invalid username or password"}), 401

# ------ FORGOT PASSWORD ------
@app.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    email = data["email"]

    user = get_user_by_email(email)
    if not user:
        return jsonify({"error": "Email not found"}), 404

    token = str(uuid.uuid4())
    expiry = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    set_reset_token(user[0], token, expiry)

    reset_link = f"http://localhost:3000/reset-password?token={token}"  # React frontend link

    # send email
    msg = Message("Reset Your Password", sender=app.config['MAIL_USERNAME'], recipients=[email])
    msg.body = f"Click this link to reset your password (valid 1 hour): {reset_link}"
    mail.send(msg)

    return jsonify({"message": "Reset link sent to your email"})

# ------ RESET PASSWORD ------
@app.route("/api/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json()
    token = data["token"]
    new_password = data["new_password"]

    user = get_user_by_token(token)
    if not user:
        return jsonify({"error": "Invalid token"}), 400

    expiry = datetime.datetime.strptime(user[5], "%Y-%m-%d %H:%M:%S.%f")
    if datetime.datetime.utcnow() > expiry:
        return jsonify({"error": "Token expired"}), 400

    new_hash = generate_password_hash(new_password)
    update_user_password(user[0], new_hash)

    # remove token
    set_reset_token(user[0], None, None)

    return jsonify({"message": "Password updated successfully"})

# ------ CHANGE PASSWORD ------
@app.route("/api/change-password", methods=["POST"])
def change_password():
    data = request.get_json()
    token = data.get("token")  # JWT from localStorage
    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not token:
        return jsonify({"error": "Token missing"}), 401

    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        user_id = payload["user_id"]

        conn = sqlite3.connect("users.db")
        cur = conn.cursor()
        cur.execute("SELECT password_hash FROM users WHERE id=?", (user_id,))
        row = cur.fetchone()
        conn.close()

        if row and check_password_hash(row[0], current_password):
            new_hash = generate_password_hash(new_password)
            update_user_password(user_id, new_hash)
            return jsonify({"message": "Password changed successfully"})
        else:
            return jsonify({"error": "Current password incorrect"}), 400

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ================= RUN APP =================
if __name__ == "__main__":
    app.run(debug=True)
