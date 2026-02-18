# pos_backend.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import uuid
import json
import jwt
import datetime

app = Flask(__name__)
app.config["SECRET_KEY"] = "supersecretkey"

# ---------------- CORS ----------------
# Allow Vercel frontend origin and handle preflight
CORS(
    app,
    resources={r"/api/*": {"origins": "https://pos-gadget-source-c5lo.vercel.app"}},
    supports_credentials=True,
)

DB_PATH = "pos.db"

# ---------------- DATABASE INIT ----------------
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # USERS
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password_hash TEXT
        )
    ''')

    # PRODUCTS
    cur.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT,
            stock INTEGER,
            price REAL
        )
    ''')

    # SALES
    cur.execute('''
        CREATE TABLE IF NOT EXISTS sales (
            id TEXT PRIMARY KEY,
            user_id INTEGER,
            user_name TEXT,
            payment_method TEXT,
            date TEXT,
            items TEXT DEFAULT '[]',
            total REAL DEFAULT 0,
            status TEXT DEFAULT 'completed'
        )
    ''')

    # PENDING ORDERS
    cur.execute('''
        CREATE TABLE IF NOT EXISTS pending_orders (
            id TEXT PRIMARY KEY,
            customer_name TEXT,
            notes TEXT,
            date TEXT,
            items TEXT DEFAULT '[]',
            total REAL DEFAULT 0,
            status TEXT DEFAULT 'pending'
        )
    ''')

    conn.commit()
    conn.close()

init_db()

# ---------------- HELPERS ----------------
def query_db(query, args=(), fetchone=False):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(query, args)
    if query.strip().upper().startswith("SELECT"):
        result = cur.fetchall()
    else:
        result = None
    conn.commit()
    conn.close()
    if fetchone:
        return result[0] if result else None
    return result

def safe_json_load(value):
    if not value:
        return []
    try:
        return json.loads(value)
    except:
        return []

def token_required(f):
    from functools import wraps

    @wraps(f)
    def decorated(*args, **kwargs):
        # Allow OPTIONS requests to pass without auth
        if request.method == "OPTIONS":
            return '', 200

        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            return jsonify({"error": "Token missing"}), 401
        try:
            decoded = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
        except:
            return jsonify({"error": "Invalid token"}), 401
        return f(decoded, *args, **kwargs)
    return decorated

# ---------------- CHANGE PASSWORD ----------------
@app.route("/api/change-password", methods=["POST", "OPTIONS"])
def change_password_route():
    # Preflight handling
    if request.method == "OPTIONS":
        return '', 200

    @token_required
    def inner(decoded):
        data = request.get_json()
        old_password = data.get("current_password")
        new_password = data.get("new_password")

        if not old_password or not new_password:
            return jsonify({"error": "Both old and new passwords are required"}), 400

        user_id = decoded["user_id"]

        user = query_db(
            "SELECT password_hash FROM users WHERE id=?",
            (user_id,),
            fetchone=True
        )

        if not user:
            return jsonify({"error": "User not found"}), 404

        if not check_password_hash(user[0], old_password):
            return jsonify({"error": "Old password is incorrect"}), 401

        new_hash = generate_password_hash(new_password)

        query_db(
            "UPDATE users SET password_hash=? WHERE id=?",
            (new_hash, user_id)
        )

        return jsonify({"message": "Password changed successfully"}), 200

    return inner()

# ---------------- PRODUCTS ----------------
@app.route("/api/products", methods=["GET", "POST", "OPTIONS"])
def products_route():
    if request.method == "OPTIONS":
        return '', 200

    if request.method == "GET":
        rows = query_db("SELECT * FROM products")
        return jsonify([{"id": r[0], "name": r[1], "stock": r[2], "price": r[3]} for r in rows])

    data = request.json
    product_id = data.get("id") or str(uuid.uuid4())
    query_db(
        "INSERT INTO products (id, name, stock, price) VALUES (?, ?, ?, ?)",
        (product_id, data["name"], data["stock"], data["price"])
    )
    return jsonify({"id": product_id, **data}), 200

@app.route("/api/products/<id>", methods=["PATCH", "DELETE", "OPTIONS"])
def update_delete_product(id):
    if request.method == "OPTIONS":
        return '', 200

    data = request.json
    if request.method == "PATCH":
        query_db(
            "UPDATE products SET name=?, stock=?, price=? WHERE id=?",
            (data.get("name"), data.get("stock"), data.get("price"), id)
        )
        return jsonify({"message": "Product updated"}), 200
    if request.method == "DELETE":
        query_db("DELETE FROM products WHERE id=?", (id,))
        return jsonify({"message": "Product deleted"}), 200

# ---------------- LOGIN ----------------
@app.route("/api/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return '', 200

    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    user = query_db(
        "SELECT id, password_hash FROM users WHERE username=?",
        (username,),
        fetchone=True
    )

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    user_id, password_hash = user

    if not check_password_hash(password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = jwt.encode(
        {
            "user_id": user_id,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8)
        },
        app.config["SECRET_KEY"],
        algorithm="HS256"
    )

    return jsonify({
        "token": token,
        "user": {
            "id": user_id,
            "username": username
        }
    }), 200

# ---------------- SALES ----------------
@app.route("/api/sales", methods=["GET", "POST", "OPTIONS"])
def sales_route():
    if request.method == "OPTIONS":
        return '', 200

    if request.method == "GET":
        rows = query_db("SELECT * FROM sales")
        sales = []
        for r in rows:
            sales.append({
                "id": r[0],
                "userId": r[1],
                "userName": r[2],
                "paymentMethod": r[3],
                "date": r[4],
                "items": safe_json_load(r[5]),
                "total": r[6] or 0,
                "status": r[7] or "completed"
            })
        return jsonify(sales)

    data = request.json
    sale_id = data.get("id") or str(uuid.uuid4())
    query_db(
        "INSERT INTO sales (id, user_id, user_name, payment_method, date, items, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (
            sale_id,
            data["userId"],
            data["userName"],
            data["paymentMethod"],
            data["date"],
            json.dumps(data.get("items", [])),
            data.get("total", 0),
            data.get("status", "completed")
        )
    )
    return jsonify({"id": sale_id, **data}), 200

@app.route("/api/relogin", methods=["POST", "OPTIONS"])
@token_required
def relogin(decoded):
    if request.method == "OPTIONS":
        return '', 200

    user_id = decoded["user_id"]
    data = request.get_json()
    password = data.get("password")  # <- get password from frontend

    if not password:
        return jsonify({"error": "Password is required"}), 400

    user = query_db(
        "SELECT id, username, password_hash FROM users WHERE id=?",
        (user_id,),
        fetchone=True
    )

    if not user:
        return jsonify({"error": "User not found"}), 404

    user_id, username, password_hash = user

    if not check_password_hash(password_hash, password):
        return jsonify({"error": "Incorrect password"}), 401

    return jsonify({
        "success": True,
        "user": {
            "id": user_id,
            "username": username
        }
    }), 200

# ---------------- PENDING ORDERS ----------------
@app.route("/api/pending-orders", methods=["GET", "POST", "OPTIONS"])
def pending_orders_route():
    if request.method == "OPTIONS":
        return '', 200

    if request.method == "GET":
        rows = query_db("SELECT * FROM pending_orders")
        orders = []
        for r in rows:
            orders.append({
                "id": r[0],
                "customerName": r[1],
                "notes": r[2],
                "date": r[3],
                "items": safe_json_load(r[4]),
                "total": r[5] or 0,
                "status": r[6] or "pending"
            })
        return jsonify(orders)

    data = request.json
    order_id = data.get("id") or str(uuid.uuid4())
    query_db(
        "INSERT INTO pending_orders (id, customer_name, notes, date, items, total, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (
            order_id,
            data["customerName"],
            data.get("notes", ""),
            data["date"],
            json.dumps(data.get("items", [])),
            data.get("total", 0),
            data.get("status", "pending")
        )
    )
    return jsonify({"id": order_id, **data}), 200

@app.route("/api/pending-orders/<id>", methods=["DELETE", "OPTIONS"])
def delete_pending(id):
    if request.method == "OPTIONS":
        return '', 200
    query_db("DELETE FROM pending_orders WHERE id=?", (id,))
    return jsonify({"message": "Pending order deleted"}), 200

# ---------------- HOME ----------------
@app.route("/")
def home():
    return jsonify({"message": "Flask POS Backend is running"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
