import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Create root and render app
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// --- Service Worker Registration for Vite (PROD ONLY) ---
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js') 
      .then(() => console.log('Service Worker registered'))
      .catch(err => console.error('SW registration failed:', err));
  });
}
