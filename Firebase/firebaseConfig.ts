// Firebase/firebaseConfig.ts - ENHANCED
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, inMemoryPersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore, initializeFirestore } from "firebase/firestore";

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

// Initialize Auth with enhanced persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  console.log('✅ Firebase Auth initialized with AsyncStorage persistence');
} catch (error) {
  console.warn('⚠️ AsyncStorage persistence failed, using in-memory:', error);
  auth = initializeAuth(app, {
    persistence: inMemoryPersistence,
  });
}

// Initialize Firestore with enhanced configuration
let db;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true, // Better for React Native
  });


  console.log('✅ Firestore initialized with offline persistence');
} catch (error) {
  console.error('❌ Firestore initialization failed:', error);
  // Fallback to regular Firestore without persistence
  db = getFirestore(app);
}

export { app, auth, db };