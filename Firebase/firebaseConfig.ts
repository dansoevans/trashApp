import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyALQ9a1pBfvEXEZ2C2BWgX5bJh9F_A7yKA",
  authDomain: "garbagesystem-bc0a6.firebaseapp.com",
  projectId: "garbagesystem-bc0a6",
  storageBucket: "garbagesystem-bc0a6.firebasestorage.app",
  messagingSenderId: "359893093859",
  appId: "1:359893093859:web:efb228a8906441b4a024d6",
  measurementId: "G-QEWF487LZL"
};


const app = initializeApp(firebaseConfig);

// ✅ Persistent Auth (React Native)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);

export { app, auth, db };