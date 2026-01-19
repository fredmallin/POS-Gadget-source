// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, enableLogging } from "firebase/database";

// -------------------
// Your Firebase config
// -------------------
const firebaseConfig = {
  apiKey: "AIzaSyDf8OYiHUOAnV_6tV9SWeODD-zU1HmG568",
  authDomain: "gadget-source-pos.firebaseapp.com",
  databaseURL: "https://gadget-source-pos-default-rtdb.firebaseio.com",
  projectId: "gadget-source-pos",
  storageBucket: "gadget-source-pos.firebasestorage.app",
  messagingSenderId: "1080185832781",
  appId: "1:1080185832781:web:6cfb07f6d46fe13e866304",
   measurementId: "G-RH1X7MKWHW"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Get a Realtime Database instance
export const db = getDatabase(app);

// Enable Firebase debug logging (optional)
enableLogging(true);

// Reference to products path
export const productsRef = ref(db, "products");

// -------------------
// OFFLINE SUPPORT
// -------------------
// Realtime Database in browsers automatically caches data for offline reads
// There is NO `db.persistence = true` for web (that is mobile-only)
// Just use `onValue` listeners and Firebase handles offline caching

// -------------------
// Optional: connect to local emulator (for dev)
// -------------------
// import { connectDatabaseEmulator } from "firebase/database";
// connectDatabaseEmulator(db, "localhost", 9000);
