// config/environment.ts
export const Environment = {
    // Firebase Config
    FIREBASE_CONFIG: {
        apiKey: "AIzaSyALQ9a1pBfvEXEZ2C2BWgX5bJh9F_A7yKA",
        authDomain: "garbagesystem-bc0a6.firebaseapp.com",
        projectId: "garbagesystem-bc0a6",
        storageBucket: "garbagesystem-bc0a6.firebasestorage.app",
        messagingSenderId: "359893093859",
        appId: "1:359893093859:web:efb228a8906441b4a024d6",
        measurementId: "G-QEWF487LZL"
    },

    // App Configuration
    APP: {
        NAME: "WasteMaster",
        VERSION: "1.0.0",
        SESSION_DURATION_DAYS: 30,
    },

    // Features
    FEATURES: {
        NOTIFICATIONS: true,
        LOCATION_SERVICES: true,
        PHONE_AUTH: true,
    },

    // Time Configuration
    TIME: {
        PICKUP_START_HOUR: 8,
        PICKUP_END_HOUR: 18,
        SLOT_DURATION_HOURS: 1,
    },

    // Validation
    VALIDATION: {
        PHONE_REGEX: /^\+?[\d\s\-\(\)]{7,15}$/,
        EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PASSWORD_MIN_LENGTH: 6,
    },
} as const;