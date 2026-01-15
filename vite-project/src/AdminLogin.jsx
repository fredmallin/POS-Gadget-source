import React, { useState } from "react";
import { verifyAdminPassword } from "./utils/auth";
import "./index.css";

export function AdminLogin({ setIsAdmin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin(e) {
    e.preventDefault();

    const isValid = verifyAdminPassword(password);

    if (isValid) {
      setIsAdmin(true);
      setError("");
    } else {
      setError("❌ Wrong password");
    }
  }

  return (
    <div className="login-container">
      <form className="login-box" onSubmit={handleLogin}>
        <h2>Admin Login</h2>

        <input
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="error">{error}</p>}

        <button type="submit">Login</button>
      </form>
    </div>
  );
}
