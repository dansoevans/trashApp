// services/authService.ts - COMPLETELY REWRITTEN
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "@/Firebase/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { UserProfile } from "@/types";
import { setupNotifications } from "./notificationService";

// Session management keys
const SESSION_KEYS = {
  LAST_ACTIVE: "LAST_ACTIVE_AT",
  USER_DATA: "USER_DATA_CACHE",
  SESSION_VALID: "SESSION_VALID",
} as const;

const SESSION_DURATION_DAYS = 30;

export class AuthService {
  private static instance: AuthService;
  private authStateListeners: ((user: User | null) => void)[] = [];

  private constructor() {
    this.setupAuthStateListener();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private setupAuthStateListener(): void {
    onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User ${user.uid}` : 'No user');

      if (user) {
        // User is signed in
        await this.saveLastActive();
        await this.cacheUserData(user.uid);
        await AsyncStorage.setItem(SESSION_KEYS.SESSION_VALID, 'true');
      } else {
        // User is signed out
        await AsyncStorage.multiRemove([
          SESSION_KEYS.LAST_ACTIVE,
          SESSION_KEYS.USER_DATA,
          SESSION_KEYS.SESSION_VALID,
        ]);
      }

      // Notify all listeners
      this.authStateListeners.forEach(listener => listener(user));
    });
  }

  public addAuthStateListener(listener: (user: User | null) => void): () => void {
    this.authStateListeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(listener);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  private async saveLastActive(): Promise<void> {
    try {
      await AsyncStorage.setItem(SESSION_KEYS.LAST_ACTIVE, Date.now().toString());
    } catch (error) {
      console.warn('Failed to save last active timestamp:', error);
    }
  }

  private async cacheUserData(uid: string): Promise<void> {
    try {
      const userDoc = await getUserDoc(uid);
      if (userDoc) {
        await AsyncStorage.setItem(SESSION_KEYS.USER_DATA, JSON.stringify(userDoc));
      }
    } catch (error) {
      console.warn('Failed to cache user data:', error);
    }
  }

  public async getCachedUserData(): Promise<UserProfile | null> {
    try {
      const cached = await AsyncStorage.getItem(SESSION_KEYS.USER_DATA);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Failed to get cached user data:', error);
      return null;
    }
  }

  public async isSessionValid(): Promise<boolean> {
    try {
      // Check if Firebase has a user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No Firebase user found');
        return false;
      }

      // Check session validity in AsyncStorage
      const sessionValid = await AsyncStorage.getItem(SESSION_KEYS.SESSION_VALID);
      if (sessionValid !== 'true') {
        console.log('Session marked as invalid in storage');
        return false;
      }

      // Check last active timestamp
      const lastActive = await AsyncStorage.getItem(SESSION_KEYS.LAST_ACTIVE);
      if (!lastActive) {
        console.log('No last active timestamp found');
        return false;
      }

      const lastActiveTime = parseInt(lastActive, 10);
      const timeDiff = Date.now() - lastActiveTime;
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

      if (daysDiff > SESSION_DURATION_DAYS) {
        console.log(`Session expired: ${daysDiff.toFixed(2)} days since last activity`);
        await this.logoutUser(); // Auto-logout expired session
        return false;
      }

      console.log('Session is valid, last active:', new Date(lastActiveTime).toISOString());
      return true;
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  }

  public async getCurrentUser(): Promise<User | null> {
    return auth.currentUser;
  }

  public async waitForAuthInitialization(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }
}

// Create singleton instance
export const authService = AuthService.getInstance();

// Traditional function exports for backward compatibility
export async function registerUser(
    email: string,
    password: string,
    name: string,
    extra?: { phone?: string; address?: string; location?: any }
): Promise<User> {
  try {
    // Input validation
    if (!email || !password || !name) {
      throw new Error("All fields are required");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please enter a valid email address");
    }

    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = cred.user;

    if (!user) {
      throw new Error("Failed to create account. Please try again.");
    }

    // Update profile
    try {
      await updateProfile(user, { displayName: name });
    } catch (e) {
      console.warn("updateProfile failed", e);
    }

    // Create user document
    const payload: UserProfile = {
      uid: user.uid,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: extra?.phone?.trim() || "",
      address: extra?.address?.trim() || "",
      location: extra?.location || null,
      type: "user",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, "users", user.uid), payload);
    await authService.saveLastActive();

    // Setup notifications after successful registration
    try {
      await setupNotifications();
      console.log("Notifications setup completed after registration");
    } catch (notificationError) {
      console.warn("Notification setup failed after registration:", notificationError);
    }

    return user;
  } catch (error: any) {
    console.error("Registration error:", error);

    // User-friendly error messages
    if (error.code === 'auth/email-already-in-use') {
      throw new Error("This email is already registered. Please use a different email or sign in.");
    } else if (error.code === 'auth/weak-password') {
      throw new Error("Password is too weak. Please use a stronger password.");
    } else if (error.code === 'auth/invalid-email') {
      throw new Error("Please enter a valid email address.");
    }

    throw new Error(error.message || "Registration failed. Please try again.");
  }
}

export async function loginUser(email: string, password: string): Promise<User> {
  try {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    const user = cred.user;

    if (!user) {
      throw new Error("Failed to sign in. Please try again.");
    }

    // Verify user document exists and has correct type
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) {
      await signOut(auth);
      throw new Error("Account not found. Please contact support.");
    }

    const data = snap.data() as UserProfile;
    if (data.type !== "user") {
      await signOut(auth);
      throw new Error("This account is not authorized to access the user app.");
    }

    await authService.saveLastActive();

    // Setup notifications after successful login
    try {
      await setupNotifications();
      console.log("Notifications setup completed after login");
    } catch (notificationError) {
      console.warn("Notification setup failed after login:", notificationError);
    }

    return user;
  } catch (error: any) {
    console.error("Login error:", error);

    if (error.code === 'auth/user-not-found') {
      throw new Error("No account found with this email. Please check your email or sign up.");
    } else if (error.code === 'auth/wrong-password') {
      throw new Error("Incorrect password. Please try again.");
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error("Too many failed attempts. Please try again later.");
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error("Network error. Please check your internet connection.");
    }

    throw new Error(error.message || "Login failed. Please check your credentials and try again.");
  }
}

export async function logoutUser(): Promise<void> {
  try {
    // Cancel any scheduled notifications on logout
    try {
      const { cancelAllScheduledNotifications } = await import('./notificationService');
      await cancelAllScheduledNotifications();
    } catch (error) {
      console.warn('Error cancelling notifications on logout:', error);
    }

    await signOut(auth);

    // Clear all session data
    await AsyncStorage.multiRemove([
      SESSION_KEYS.LAST_ACTIVE,
      SESSION_KEYS.USER_DATA,
      SESSION_KEYS.SESSION_VALID,
    ]);

    console.log('User logged out successfully');
  } catch (error) {
    console.error("Logout error:", error);
    throw new Error("Failed to log out. Please try again.");
  }
}

export function listenToAuthChanges(cb: (user: User | null) => void): () => void {
  return authService.addAuthStateListener(cb);
}

export async function saveLastActive(): Promise<void> {
  await authService.saveLastActive();
}

export async function isSessionValid(): Promise<boolean> {
  return authService.isSessionValid();
}

export async function getUserDoc(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  } catch (error) {
    console.error("Error fetching user document:", error);
    throw new Error("Failed to load user profile.");
  }
}

export async function updateUserDoc(uid: string, updates: Partial<UserProfile>): Promise<void> {
  try {
    await updateDoc(doc(db, "users", uid), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating user document:", error);
    throw new Error("Failed to update profile. Please try again.");
  }
}

export async function ensureUserDoc(user: User, extra?: { phone?: string; address?: string; location?: any }): Promise<UserProfile> {
  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      return snap.data() as UserProfile;
    }

    const payload: UserProfile = {
      uid: user.uid,
      name: user.displayName || "User",
      phone: extra?.phone || user.phoneNumber || "",
      address: extra?.address || "",
      location: extra?.location || null,
      email: user.email || "",
      type: "user",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, payload);
    return payload;
  } catch (error) {
    console.error("Error ensuring user document:", error);
    throw new Error("Failed to create user profile.");
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error("No user signed in");
    }

    // Reauthenticate user
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);
  } catch (error: any) {
    console.error("Password change error:", error);

    if (error.code === 'auth/wrong-password') {
      throw new Error("Current password is incorrect.");
    } else if (error.code === 'auth/weak-password') {
      throw new Error("New password is too weak. Please use a stronger password.");
    }

    throw new Error(error.message || "Failed to change password. Please try again.");
  }
}

// Helper function to check if user is authenticated
export async function checkAuthStatus(): Promise<{ isAuthenticated: boolean; user: User | null }> {
  try {
    const user = await authService.waitForAuthInitialization();
    const sessionValid = await authService.isSessionValid();

    return {
      isAuthenticated: !!(user && sessionValid),
      user: user && sessionValid ? user : null,
    };
  } catch (error) {
    console.error('Error checking auth status:', error);
    return { isAuthenticated: false, user: null };
  }
}