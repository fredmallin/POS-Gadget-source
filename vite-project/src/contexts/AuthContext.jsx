// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (username, password) => {
    if ((username === 'admin' && password === 'admin123') ||
        (username === 'cashier' && password === 'cashier123')) {
      setUser({
        name: username,
        role: username === 'admin' ? 'admin' : 'cashier',
      });
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
