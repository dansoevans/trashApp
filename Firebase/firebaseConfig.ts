// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyALQ9a1pBfvEXEZ2C2BWgX5bJh9F_A7yKA",
  authDomain: "garbagesystem-bc0a6.firebaseapp.com",
  projectId: "garbagesystem-bc0a6",
  storageBucket: "garbagesystem-bc0a6.firebasestorage.app",
  messagingSenderId: "359893093859",
  appId: "1:359893093859:web:efb228a8906441b4a024d6",
  measurementId: "G-QEWF487LZL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);