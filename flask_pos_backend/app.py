# pos_backend.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import psycopg2
from psycopg2 import pool
import os
import uuid
import json
import jwt
import datetime
from functools import wraps

app = Flask(__name__)
app.config["SECRET_KEY"] = "supersecretkey"

CORS(
    app,
    resources={r"/api/*": {"origins": [
        "http://localhost:5173",
        "https://pos-gadget-source-c5lo.vercel.app",
        "https://pos-gadget-source-xcwz.vercel.app"
    ]}},
    supports_credentials=True,
    methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"]
)
DATABASE_URL = os.environ.get("DATABASE_URL")
connection_pool = pool.SimpleConnectionPool(1, 10, DATABASE_URL)

# ----------------- DATABASE -----------------
def init_db():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE,
            password_hash TEXT,
            dashboard_password_hash TEXT
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT,
            stock INTEGER,
            price REAL,
            category TEXT,
            sku TEXT,
            image_url TEXT
        )
    ''')

    cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT")
    cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT")
    cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT")

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

    cur.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_products_id ON products(id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_pending_orders_id ON pending_orders(id)")

    conn.commit()
    conn.close()

def query_db(query, args=(), fetchone=False):
    conn = connection_pool.getconn()
    try:
        cur = conn.cursor()
        cur.execute(query, args)
        if query.strip().upper().startswith("SELECT"):
            result = cur.fetchall()
        else:
            result = None
        conn.commit()
        cur.close()
        return result[0] if (fetchone and result) else result
    finally:
        connection_pool.putconn(conn)

def safe_json_load(value):
    if not value:
        return []
    try:
        return json.loads(value)
    except:
        return []

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
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

# ----------------- AUTH -----------------
@app.route("/api/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return '', 200
    try:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"error": "Username and password required"}), 400

        user = query_db(
            "SELECT id, password_hash FROM users WHERE username=%s",
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
            "user": {"id": user_id, "username": username}
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/change-password", methods=["POST", "OPTIONS"])
@token_required
def change_password(decoded):
    if request.method == "OPTIONS":
        return '', 200

    data = request.get_json()
    old_password = data.get("current_password")
    new_password = data.get("new_password")

    if not old_password or not new_password:
        return jsonify({"error": "Both old and new passwords required"}), 400

    user_id = decoded["user_id"]
    user = query_db("SELECT password_hash FROM users WHERE id=%s", (user_id,), fetchone=True)

    if not user:
        return jsonify({"error": "User not found"}), 404

    if not check_password_hash(user[0], old_password):
        return jsonify({"error": "Old password incorrect"}), 401

    new_hash = generate_password_hash(new_password, method="pbkdf2:sha256")
    query_db("UPDATE users SET password_hash=%s WHERE id=%s", (new_hash, user_id))

    return jsonify({"message": "Password changed successfully"}), 200

# ----------------- PRODUCTS -----------------
@app.route("/api/products", methods=["GET", "POST", "OPTIONS"])
def products_route():
    if request.method == "OPTIONS":
        return '', 200

    if request.method == "GET":
        rows = query_db("SELECT id, name, stock, price, category, sku, image_url FROM products")
        return jsonify([{
            "id": r[0],
            "name": r[1],
            "stock": r[2],
            "price": r[3],
            "category": r[4],
            "sku": r[5],
            "imageUrl": r[6]
        } for r in rows])

    data = request.json
    product_id = data.get("id") or str(uuid.uuid4())
    query_db(
        "INSERT INTO products (id, name, stock, price, category, sku, image_url) VALUES (%s, %s, %s, %s, %s, %s, %s)",
        (product_id, data["name"], data["stock"], data["price"],
         data.get("category"), data.get("sku"), data.get("imageUrl"))
    )
    return jsonify({"id": product_id, **data}), 200

@app.route("/api/products/<id>", methods=["PATCH", "DELETE", "OPTIONS"])
def update_delete_product(id):
    if request.method == "OPTIONS":
        return '', 200

    if request.method == "DELETE":
        query_db("DELETE FROM products WHERE id=%s", (id,))
        return jsonify({"message": "Product deleted"}), 200

    if request.method == "PATCH":
        data = request.json
        query_db(
            "UPDATE products SET name=%s, stock=%s, price=%s, category=%s, sku=%s, image_url=%s WHERE id=%s",
            (data.get("name"), data.get("stock"), data.get("price"),
             data.get("category"), data.get("sku"), data.get("imageUrl"), id)
        )
        return jsonify({"message": "Product updated"}), 200

# ----------------- SALES -----------------
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
        "INSERT INTO sales (id, user_id, user_name, payment_method, date, items, total, status) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
        (sale_id, data["userId"], data["userName"], data["paymentMethod"], data["date"],
         json.dumps(data.get("items", [])), data.get("total", 0), data.get("status", "completed"))
    )

    for item in data.get("items", []):
        product_id = item.get("productId") or item.get("id")
        if product_id:
            query_db(
                "UPDATE products SET stock = GREATEST(0, stock - %s) WHERE id = %s",
                (item["quantity"], product_id)
            )

    return jsonify({"id": sale_id, **data}), 200

# ----------------- DASHBOARD -----------------
@app.route("/api/unlock-dashboard", methods=["POST", "OPTIONS"])
@token_required
def unlock_dashboard(decoded):
    if request.method == "OPTIONS":
        return '', 200

    data = request.get_json()
    password = data.get("password")
    if not password:
        return jsonify({"error": "Password required"}), 400

    user_id = decoded["user_id"]
    user = query_db("SELECT dashboard_password_hash FROM users WHERE id=%s", (user_id,), fetchone=True)

    if not user or not user[0]:
        return jsonify({"error": "Dashboard password not set"}), 400

    if not check_password_hash(user[0], password):
        return jsonify({"error": "Incorrect dashboard password"}), 401

    return jsonify({"success": True}), 200

@app.route("/api/change-dashboard-password", methods=["POST", "OPTIONS"])
@token_required
def change_dashboard_password(decoded):
    if request.method == "OPTIONS":
        return '', 200

    data = request.get_json()
    new_password = data.get("new_password")
    if not new_password:
        return jsonify({"error": "New password required"}), 400

    user_id = decoded["user_id"]
    new_hash = generate_password_hash(new_password, method="pbkdf2:sha256")
    query_db("UPDATE users SET dashboard_password_hash=%s WHERE id=%s", (new_hash, user_id))

    return jsonify({"message": "Dashboard password updated"}), 200

# ----------------- PENDING ORDERS -----------------
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
        "INSERT INTO pending_orders (id, customer_name, notes, date, items, total, status) VALUES (%s,%s,%s,%s,%s,%s,%s)",
        (order_id, data["customerName"], data.get("notes", ""), data["date"],
         json.dumps(data.get("items", [])), data.get("total", 0), data.get("status", "pending"))
    )
    return jsonify({"id": order_id, **data}), 200

@app.route("/api/pending-orders/<id>", methods=["DELETE", "OPTIONS"])
def delete_pending(id):
    if request.method == "OPTIONS":
        return '', 200
    query_db("DELETE FROM pending_orders WHERE id=%s", (id,))
    return jsonify({"message": "Pending order deleted"}), 200

# ----------------- HOME -----------------
@app.route("/")
def home():
    response = jsonify({"message": "Flask POS Backend is running"})
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response, 200

@app.route("/api/setup", methods=["GET"])
def setup():
    username = "admin"
    password = "admin123"

    existing = query_db("SELECT id FROM users WHERE username=%s", (username,), fetchone=True)
    if existing:
        query_db("DELETE FROM users WHERE username=%s", (username,))

    hashed = generate_password_hash(password, method="pbkdf2:sha256")
    query_db("INSERT INTO users (username, password_hash) VALUES (%s, %s)", (username, hashed))
    return jsonify({"message": "User created", "username": username, "password": password}), 200

init_db()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
