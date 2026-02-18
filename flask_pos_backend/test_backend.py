from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer

app = Flask(__name__)

# ---------------- CONFIG ----------------
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'supersecretkey'
app.config['JWT_SECRET_KEY'] = 'jwt-secret-string'

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'admin'
app.config['MAIL_PASSWORD'] = 'npimtnctwcwrxif'
app.config['MAIL_DEFAULT_SENDER'] = 'fredmallin49gmail.com'

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
mail = Mail(app)

serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])

# ---------------- MODEL ----------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=True)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        if not self.password_hash:
            return False
        return bcrypt.check_password_hash(self.password_hash, password)

# ---------------- LOGIN ----------------
@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    if not user.password_hash:
        return jsonify({"error": "Password not set", "firstLogin": True}), 403

    if not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=user.username)

    return jsonify({"token": token})

# ---------------- CHANGE PASSWORD ----------------
@app.route("/api/change-password", methods=["POST"])
@jwt_required()
def change_password():
    username = get_jwt_identity()
    data = request.json

    current_password = data.get("current_password")
    new_password = data.get("new_password")

    user = User.query.filter_by(username=username).first()

    if not user.check_password(current_password):
        return jsonify({"error": "Current password incorrect"}), 400

    user.set_password(new_password)
    db.session.commit()

    return jsonify({"message": "Password changed successfully"})

# ---------------- FORGOT PASSWORD ----------------
@app.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    data = request.json
    email = data.get("email")

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    token = serializer.dumps(email, salt="password-reset-salt")
    reset_link = f"https://pos-gadget-source-c5lo.vercel.app//reset-password/{token}"

    msg = Message("Password Reset", recipients=[email])
    msg.body = f"Click this link to reset your password:\n{reset_link}"

    mail.send(msg)

    return jsonify({"message": "Password reset email sent"})

# ---------------- RESET PASSWORD ----------------
@app.route("/api/reset-password/<token>", methods=["POST"])
def reset_password(token):
    try:
        email = serializer.loads(
            token,
            salt="password-reset-salt",
            max_age=3600
        )
    except:
        return jsonify({"error": "Invalid or expired token"}), 400

    data = request.json
    new_password = data.get("password")

    user = User.query.filter_by(email=email).first()
    user.set_password(new_password)
    db.session.commit()

    return jsonify({"message": "Password reset successful"})

# ---------------- RUN ----------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
