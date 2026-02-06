// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, enableLogging } from "firebase/database";
import { getStorage } from "firebase/storage";


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

// Reference to sales path (NEW)
export const salesRef = ref(db, "sales"); // <-- add this

// -------------------
// OFFLINE SUPPORT
// -------------------
// Realtime Database in browsers automatically caches data for offline reads
// Use onValue listeners; Firebase handles offline caching automatically

// -------------------
// Optional: connect to local emulator (for dev)
// -------------------
// import { connectDatabaseEmulator } from "firebase/database";
// connectDatabaseEmulator(db, "localhost", 9000);

export const storage = getStorage(app, "gs://gadget-source-pos.appspot.com");