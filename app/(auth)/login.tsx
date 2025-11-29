// app/(auth)/login.tsx - UPDATED
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    SafeAreaView,
    Animated,
    Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { authService } from "@/services/authService";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const fadeAnim = useState(new Animated.Value(0))[0];
    const slideAnim = useState(new Animated.Value(30))[0];

    useEffect(() => {
        // Check if user is already authenticated
        const checkExistingAuth = async () => {
            try {
                const isAuthenticated = await authService.isSessionValid();
                if (isAuthenticated) {
                    console.log('User already authenticated, redirecting to home...');
                    router.replace('/(tabs)/home');
                }
            } catch (error) {
                console.warn('Error checking existing auth:', error);
            }
        };

        checkExistingAuth();

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handlePhoneLogin = () => {
        router.push("/(auth)/phoneAuth");
    };

    const handleDebugLogin = async () => {
        // For testing purposes only - remove in production
        setLoading(true);
        try {
            // This would normally be your actual login flow
            // For now, we'll simulate a successful auth state
            console.log('Debug login activated');

            // In a real app, you would call your login function here
            // await loginUser('test@example.com', 'password');

            // For demo, we'll just navigate to home
            setTimeout(() => {
                router.replace('/(tabs)/home');
            }, 1000);

        } catch (error: any) {
            Alert.alert("Login Failed", error.message || "Unable to sign in.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoid}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Ionicons name="lock-closed" size={32} color="#10B981" />
                        </View>
                        <Text style={styles.title}>Welcome to WasteMaster</Text>
                        <Text style={styles.subtitle}>
                            Sign in securely with your phone number to manage your waste pickups
                        </Text>
                    </View>

                    {/* Illustration */}
                    <View style={styles.illustrationContainer}>
                        <View style={styles.phoneIcon}>
                            <Ionicons name="phone-portrait" size={80} color="#10B981" />
                            <View style={styles.wave} />
                            <View style={[styles.wave, styles.wave2]} />
                        </View>
                    </View>

                    {/* Benefits */}
                    <View style={styles.benefitsContainer}>
                        <View style={styles.benefitItem}>
                            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                            <Text style={styles.benefitText}>Secure authentication</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <Ionicons name="flash" size={20} color="#10B981" />
                            <Text style={styles.benefitText}>Instant verification</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <Ionicons name="key" size={20} color="#10B981" />
                            <Text style={styles.benefitText}>Passwordless login</Text>
                        </View>
                    </View>

                    {/* CTA Section */}
                    <View style={styles.ctaContainer}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handlePhoneLogin}
                            disabled={loading}
                        >
                            <Ionicons name="phone-portrait" size={20} color="#fff" />
                            <Text style={styles.primaryButtonText}>
                                {loading ? "Loading..." : "Continue with Phone"}
                            </Text>
                        </TouchableOpacity>

                        {/* Debug button - remove in production */}
                        {__DEV__ && (
                            <TouchableOpacity
                                style={styles.debugButton}
                                onPress={handleDebugLogin}
                                disabled={loading}
                            >
                                <Text style={styles.debugButtonText}>
                                    {loading ? "Logging in..." : "Debug Login (Dev Only)"}
                                </Text>
                            </TouchableOpacity>
                        )}

                        <Text style={styles.privacyText}>
                            By continuing, you agree to our{" "}
                            <Text style={styles.link}>Terms of Service</Text> and{" "}
                            <Text style={styles.link}>Privacy Policy</Text>
                        </Text>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    keyboardAvoid: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: "space-between",
        paddingHorizontal: 24,
        paddingTop: height * 0.05,
        paddingBottom: 40,
    },
    header: {
        alignItems: "center",
        marginTop: height * 0.02,
    },
    logoContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#f0f9ff",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#e0f2fe",
    },
    title: {
        fontSize: 32,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        color: "#64748b",
        textAlign: "center",
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    illustrationContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginVertical: height * 0.05,
    },
    phoneIcon: {
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    wave: {
        position: "absolute",
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        zIndex: -1,
    },
    wave2: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: "rgba(16, 185, 129, 0.05)",
    },
    benefitsContainer: {
        alignItems: "center",
        marginBottom: height * 0.04,
    },
    benefitItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        paddingHorizontal: 20,
    },
    benefitText: {
        fontSize: 16,
        color: "#475569",
        marginLeft: 12,
        fontWeight: "500",
    },
    ctaContainer: {
        alignItems: "center",
    },
    primaryButton: {
        backgroundColor: "#10B981",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        width: "100%",
        marginBottom: 16,
        shadowColor: "#10B981",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    primaryButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        marginLeft: 8,
    },
    debugButton: {
        backgroundColor: "#6B7280",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginBottom: 16,
    },
    debugButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    privacyText: {
        fontSize: 14,
        color: "#64748b",
        textAlign: "center",
        lineHeight: 18,
        paddingHorizontal: 20,
    },
    link: {
        color: "#10B981",
        fontWeight: "600",
    },
});