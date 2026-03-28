import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // ── Firebase Auth password (login page password) ──────────────────────────
  const changeLoginPassword = async (currentPassword, newPassword) => {
    if (!auth.currentUser) return { success: false, message: "Not logged in." };
    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      await signOut(auth);
      setUser(null);
      return { success: true, message: "Login password updated! Please sign in again." };
    } catch (err) {
      console.error("Change login password error:", err);
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        return { success: false, message: "Current password is incorrect." };
      }
      if (err.code === "auth/requires-recent-login") {
        return { success: false, message: "Please logout and login again first." };
      }
      return { success: false, message: err.message };
    }
  };

  // ── Firestore dashboard password ──────────────────────────────────────────
  const changeDashboardPassword = async (currentPassword, newPassword) => {
    try {
      const docRef = doc(db, "dashboardPassword", "main");
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return { success: false, message: "Dashboard password record not found." };
      }

      const stored = docSnap.data().password;

      if (currentPassword !== stored) {
        return { success: false, message: "Current dashboard password is incorrect." };
      }

      await updateDoc(docRef, { password: newPassword });
      return { success: true, message: "Dashboard password updated successfully!" };
    } catch (err) {
      console.error("Change dashboard password error:", err);
      return { success: false, message: "Failed to update dashboard password." };
    }
  };

  // Keep old changePassword pointing to login password so nothing else breaks
  const changePassword = changeLoginPassword;

  const forgotPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: "Password reset email sent." };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        changePassword,         // legacy alias → login password
        changeLoginPassword,    // explicit login password
        changeDashboardPassword,// Firestore dashboard password
        forgotPassword,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
