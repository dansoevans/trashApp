// app/_layout.tsx - COMPLETELY REWRITTEN
import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet, Animated, AppState, AppStateStatus } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { authService, checkAuthStatus, saveLastActive } from "@/services/authService";
import { setupNotifications } from "@/services/notificationService";
import { User } from "firebase/auth";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function RootLayout() {
    const [appIsReady, setAppIsReady] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const fadeAnim = new Animated.Value(0);
    const scaleAnim = new Animated.Value(0.8);

    useEffect(() => {
        let unsubscribeAuth: (() => void) | undefined;

        async function prepare() {
            try {
                console.log('🚀 Starting app initialization...');

                // Initialize notifications (non-blocking)
                try {
                    await setupNotifications();
                    console.log('✅ Notifications initialized');
                } catch (notificationError) {
                    console.warn('⚠️ Notification initialization failed:', notificationError);
                }

                // Check authentication status
                const { isAuthenticated: authStatus, user } = await checkAuthStatus();
                console.log('🔐 Auth status:', authStatus, user ? `User: ${user.uid}` : 'No user');

                setIsAuthenticated(authStatus);
                setCurrentUser(user);

                // Set up auth state listener for future changes
                unsubscribeAuth = authService.addAuthStateListener((user: User | null) => {
                    console.log('🔄 Auth state changed:', user ? `User ${user.uid}` : 'No user');
                    setIsAuthenticated(!!user);
                    setCurrentUser(user);
                });

                console.log('✅ App initialization completed');
            } catch (error) {
                console.error('❌ App initialization error:', error);
                setIsAuthenticated(false);
                setCurrentUser(null);
            } finally {
                // Always mark app as ready, even if there were errors
                setAppIsReady(true);
                console.log('🎯 App is ready to render');
            }
        }

        prepare();

        // Start animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000 * 3,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 20,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();

        // Cleanup on unmount
        return () => {
            if (unsubscribeAuth) {
                unsubscribeAuth();
            }
        };
    }, []);

    // Update last active time when app comes to foreground
    useEffect(() => {
        const handleAppStateChange = async (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active' && currentUser) {
                console.log('📱 App came to foreground, updating last active time');
                await saveLastActive();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, [currentUser]);

    // Show splash screen while initializing
    if (!appIsReady || isAuthenticated === null) {
        return (
            <View style={styles.splashContainer}>
                <StatusBar style="light" />
                <Animated.View
                    style={[
                        styles.splashContent,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <View style={styles.logoContainer}>
                        <Ionicons name="recycle" size={80} color="#10B981" />
                    </View>
                    <Text style={styles.appName}>WasteMaster</Text>
                    <Text style={styles.appTagline}>Smart Waste Management</Text>
                    <View style={styles.loadingDots}>
                        <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
                        <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
                        <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
                    </View>
                    <Text style={styles.loadingText}>Initializing...</Text>
                </Animated.View>
            </View>
        );
    }

    console.log('🎨 Rendering app with auth state:', isAuthenticated);

    return (
        <ErrorBoundary>
            <StatusBar style={isAuthenticated ? "dark" : "light"} />
            <Stack screenOptions={{ headerShown: false }}>
                {isAuthenticated ? (
                    <>
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="requestDetails" options={{ presentation: "modal" }} />
                        <Stack.Screen name="confirmation" options={{ presentation: "modal" }} />
                    </>
                ) : (
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                )}
            </Stack>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    splashContainer: {
        flex: 1,
        backgroundColor: "#111827",
        justifyContent: "center",
        alignItems: "center",
    },
    splashContent: {
        alignItems: "center",
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },
    appName: {
        fontSize: 32,
        fontWeight: "700",
        color: "#FFFFFF",
        marginBottom: 8,
    },
    appTagline: {
        fontSize: 16,
        color: "#9CA3AF",
        marginBottom: 40,
    },
    loadingDots: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 20,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#10B981",
    },
    loadingText: {
        fontSize: 14,
        color: "#6B7280",
        marginTop: 10,
    },
});