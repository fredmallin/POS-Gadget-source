import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";
import { ShoppingCart, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth(); // login function from AuthContext
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const success = await login(username, password); // login calls backend
      if (success) {
        navigate("/dashboard"); // redirect to POS dashboard
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <ShoppingCart className="icon-white" />
          </div>
          <h1 className="login-title">POS System</h1>
          <p className="login-description">
            Sign in to access the point of sale system
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="alert">
              <AlertCircle className="alert-icon" />
              <span className="alert-text">{error}</span>
            </div>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>

          <div className="forgot-password">
            <a href="/forgot-password">Forgot Password?</a>
          </div>

          <div className="demo-credentials">
            <p className="demo-title">Demo Credentials:</p>
            <p>
              <strong>Admin:</strong> admin / admin123
            </p>
            <p>
              <strong>Cashier:</strong> cashier / cashier123
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
