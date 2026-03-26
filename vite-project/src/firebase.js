// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; 
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);