// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

const BACKEND_URL = "https://pos-gadget-source-8.onrender.com"; // adjust if your backend is elsewhere

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  // ----------------- Load user from localStorage on mount -----------------
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      setUser(JSON.parse(userData));
    }

    setLoading(false); // ✅ finished checking
  }, []);
// Add this inside AuthProvider, after the BACKEND_URL line
useEffect(() => {
  fetch(`${BACKEND_URL}/`).catch(() => {}); // silent wake-up ping
}, []);

  // ----------------- LOGIN -----------------
  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        const userObj = {
          id: data.user.id,
          username: data.user.username,
          role: data.user.role || "user",
          isAdmin: data.user.isAdmin || false,
        };

        setUser(userObj);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(userObj));

        return { success: true, firstLogin: data.firstLogin || false };
      } else if (res.status === 403 && data.firstLogin) {
        return { success: false, firstLogin: true, message: data.error };
      } else {
        return { success: false, message: data.error || "Login failed" };
      }
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, message: "Cannot connect to server" };
    } finally {
      setLoading(false);
    }
  };

  // ----------------- LOGOUT -----------------
  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // ----------------- CHANGE PASSWORD -----------------
  const changePassword = async (currentPassword, newPassword) => {
    const token = localStorage.getItem("token");
    if (!token) return { success: false, message: "Not authenticated" };

    try {
      const res = await fetch(`${BACKEND_URL}/api/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });

      const data = await res.json();
      return res.ok
        ? { success: true, message: data.message }
        : { success: false, message: data.error || "Failed to change password" };
    } catch (err) {
      console.error("Change password error:", err);
      return { success: false, message: "Something went wrong" };
    }
  };

  // ----------------- FORGOT PASSWORD -----------------
  const forgotPassword = async (email) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      return res.ok
        ? { success: true, message: data.message }
        : { success: false, message: data.error || "Failed to send reset link" };
    } catch (err) {
      console.error("Forgot password error:", err);
      return { success: false, message: "Something went wrong" };
    }
  };

  // ----------------- RESET PASSWORD -----------------
  const resetPassword = async (token, newPassword) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const data = await res.json();
      return res.ok
        ? { success: true, message: data.message }
        : { success: false, message: data.error || "Failed to reset password" };
    } catch (err) {
      console.error("Reset password error:", err);
      return { success: false, message: "Something went wrong" };
    }
  };

  // ----------------- HELPERS -----------------
  const isAuthenticated = !!user;
  const isAdmin = !!user?.isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,           // ✅ expose loading
        login,
        logout,
        changePassword,
        forgotPassword,
        resetPassword,
        isAuthenticated,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ----------------- CUSTOM HOOK -----------------
export const useAuth = () => useContext(AuthContext);
