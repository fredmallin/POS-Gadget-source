import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Let Firebase manage auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (err) {
      let message = "Invalid email or password.";
      if (err.code === "auth/user-not-found") message = "No account found.";
      if (err.code === "auth/wrong-password") message = "Wrong password.";
      if (err.code === "auth/invalid-email") message = "Invalid email.";
      if (err.code === "auth/invalid-credential") message = "Invalid email or password.";
      return { success: false, message };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const changePassword = async (currentPassword, newPassword) => {
    if (!auth.currentUser) return { success: false, message: "Not logged in." };
    try {
      // Reauthenticate first
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      // Now update password
      await updatePassword(auth.currentUser, newPassword);
      // Sign out so user logs in with new password
      await signOut(auth);
      setUser(null);
      return { success: true, message: "Password updated! Please login again." };
    } catch (err) {
      console.error("Change password error:", err);
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        return { success: false, message: "Current password is incorrect." };
      }
      if (err.code === "auth/requires-recent-login") {
        return { success: false, message: "Please logout and login again first." };
      }
      return { success: false, message: err.message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: "Password reset email sent." };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      changePassword,
      forgotPassword,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);