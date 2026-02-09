// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // ---------- LOGIN ----------
  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok) {
        const userObj = { username: data.user.username, id: data.user.id };
        setUser(userObj);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(userObj));
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error("Login error:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ---------- LOGOUT ----------
  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // ---------- CHANGE PASSWORD ----------
  const changePassword = async (currentPassword, newPassword) => {
    const token = localStorage.getItem("token");
    if (!token) return { success: false, message: "Not authenticated" };

    try {
      const res = await fetch("http://127.0.0.1:5000/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, current_password: currentPassword, new_password: newPassword }),
      });

      const data = await res.json();
      if (res.ok) return { success: true, message: data.message };
      else return { success: false, message: data.error };
    } catch (err) {
      console.error("Change password error:", err);
      return { success: false, message: "Something went wrong" };
    }
  };

  // ---------- FORGOT PASSWORD ----------
  const forgotPassword = async (email) => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) return { success: true, message: data.message };
      else return { success: false, message: data.error };
    } catch (err) {
      console.error("Forgot password error:", err);
      return { success: false, message: "Something went wrong" };
    }
  };

  // ---------- RESET PASSWORD ----------
  const resetPassword = async (token, newPassword) => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await res.json();
      if (res.ok) return { success: true, message: data.message };
      else return { success: false, message: data.error };
    } catch (err) {
      console.error("Reset password error:", err);
      return { success: false, message: "Something went wrong" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        changePassword,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
