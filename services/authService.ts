// services/authService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "@/Firebase/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const LAST_ACTIVE_KEY = "LAST_ACTIVE_AT";
const SESSION_DAYS = 30;

export async function registerUser(email: string, password: string, name: string) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  // set displayName on the auth profile
  if (cred.user) {
    await updateProfile(cred.user, { displayName: name });
    // create user doc in Firestore
    await setDoc(doc(db, "users", cred.user.uid), {
      name,
      email: email.trim(),
      createdAt: new Date().toISOString(),
    });
    await saveLastActive();
  }
  return cred.user;
}

export async function loginUser(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  await saveLastActive();
  return cred.user;
}

export async function logoutUser() {
  await signOut(auth);
  await AsyncStorage.removeItem(LAST_ACTIVE_KEY);
}

export function listenToAuthChanges(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

// Save current timestamp for session activity
export async function saveLastActive() {
  try {
    await AsyncStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
  } catch (e) {
    // ignore
    console.warn("Failed to save lastActive", e);
  }
}

// Check whether last active stored timestamp is older than SESSION_DAYS.
// Return true if session still valid.
export async function isSessionValid() {
  try {
    const v = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
    if (!v) return false;
    const last = parseInt(v, 10);
    const ms = Date.now() - last;
    const days = ms / (1000 * 60 * 60 * 24);
    return days <= SESSION_DAYS;
  } catch (e) {
    console.warn("isSessionValid error", e);
    return false;
  }
}

// Get user doc (name, email) from Firestore
export async function getUserDoc(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}
