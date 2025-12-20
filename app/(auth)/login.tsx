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
    Animated,
    Alert,
} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
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

    const handleSignUp = () => {
        router.push("/(auth)/locationPermission");
    };

    const handleDebugLogin = async () => {
        // For testing purposes only - remove in production
        setLoading(true);
        try {
            console.log('Debug login activated');
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
                            <Ionicons name="trash-outline" size={32} color="#10B981" />
                        </View>
                        <Text style={styles.title}>Welcome to WasteMaster</Text>
                        <Text style={styles.subtitle}>
                            Sign in to manage your waste pickups efficiently
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



                    {/* CTA Section */}
                    <View style={styles.ctaContainer}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handlePhoneLogin}
                            disabled={loading}
                        >
                            <Ionicons name="log-in-outline" size={20} color="#fff" />
                            <Text style={styles.primaryButtonText}>
                                {loading ? "Loading..." : "Sign In with Phone"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={handleSignUp}
                            disabled={loading}
                        >
                            <Ionicons name="person-add-outline" size={20} color="#10B981" />
                            <Text style={styles.secondaryButtonText}>
                                Create New Account
                            </Text>
                        </TouchableOpacity>

                        {/* Debug button - remove in production */}

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
        marginBottom: 12,
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
    secondaryButton: {
        backgroundColor: "#FFFFFF",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        width: "100%",
        marginBottom: 16,
        borderWidth: 2,
        borderColor: "#10B981",
    },
    secondaryButtonText: {
        color: "#10B981",
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