import { initializeApp } from "firebase/app";
import { getDatabase, enableLogging } from "firebase/database";

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

const app = initializeApp(firebaseConfig);

// ✅ THIS EXPORT IS REQUIRED
export const db = getDatabase(app);
