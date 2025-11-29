// app/(auth)/signup.tsx
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { registerUser } from "@/services/authService";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/Firebase/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

export default function SignupScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // decoded values passed from previous screen
    const latParam = (params.lat as string) || "";
    const lngParam = (params.lng as string) || "";
    const encodedAddress = (params.address as string) || "";
    const phoneFromPrev = (params.phone as string) || "";

    // form state
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [phone, setPhone] = useState(phoneFromPrev || "");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    // show/hide password
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        if (phoneFromPrev) setPhone(phoneFromPrev);
    }, [phoneFromPrev]);

    function validate() {
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirm || !phone.trim()) {
            Alert.alert("Missing Fields", "Please fill in all required fields.");
            return false;
        }
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
            Alert.alert("Invalid Email", "Please enter a valid email address.");
            return false;
        }
        if (password !== confirm) {
            Alert.alert("Password Mismatch", "Passwords do not match.");
            return false;
        }
        if (password.length < 6) {
            Alert.alert("Weak Password", "Password must be at least 6 characters.");
            return false;
        }
        if (!/^\+?\d{7,15}$/.test(phone.replace(/\s+/g, ""))) {
            Alert.alert("Invalid Phone", "Please enter a valid phone number with country code.");
            return false;
        }
        if (!latParam || !lngParam) {
            Alert.alert("Location Required", "Your location is required to sign up. Please go back and enable location.");
            return false;
        }
        return true;
    }

    const handleSignup = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            const fullName = `${firstName.trim()} ${lastName.trim()}`;
            const user = await registerUser(email.trim(), password, fullName);
            if (!user) throw new Error("Registration failed");

            // Update user doc with phone, address, and coordinates
            try {
                const uRef = doc(db, "users", user.uid);
                const payload: any = {
                    phone: phone.replace(/\s+/g, ""),
                    updatedAt: new Date().toISOString(),
                };

                if (encodedAddress) {
                    payload.address = decodeURIComponent(encodedAddress);
                } else {
                    payload.address = "";
                }

                if (latParam && lngParam) {
                    payload.location = {
                        latitude: Number(latParam),
                        longitude: Number(lngParam)
                    };
                }

                await updateDoc(uRef, payload);
            } catch (e) {
                console.warn("Failed to update user doc:", e);
            }

            await AsyncStorage.setItem("lastActive", Date.now().toString());
            router.replace("/(tabs)/home");
        } catch (e: any) {
            console.error("Signup error:", e);
            Alert.alert("Sign Up Failed", e?.message || "Unable to create account. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setGoogleLoading(true);
        try {
            // TODO: Implement Google Sign-In
            Alert.alert("Coming Soon", "Google Sign-In will be available soon.");
            // For now, we'll simulate a delay
            await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (error) {
            Alert.alert("Google Sign-In Failed", "Please try another method.");
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressDot, styles.progressDotActive]} />
                            <View style={[styles.progressDot, styles.progressDotActive]} />
                            <View style={styles.progressDot} />
                        </View>
                        <Text style={styles.title}>Create Your Account</Text>
                        <Text style={styles.subtitle}>
                            Complete your profile to start using our services
                        </Text>
                    </View>

                    {/* Signup Form */}
                    <View style={styles.formCard}>
                        {/* Name Row */}
                        <View style={styles.nameRow}>
                            <View style={styles.nameField}>
                                <Text style={styles.label}>First Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="John"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    autoCapitalize="words"
                                />
                            </View>
                            <View style={styles.nameField}>
                                <Text style={styles.label}>Last Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Doe"
                                    value={lastName}
                                    onChangeText={setLastName}
                                    autoCapitalize="words"
                                />
                            </View>
                        </View>

                        {/* Email */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="your.email@example.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        {/* Phone */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="+1 234 567 8900"
                                keyboardType="phone-pad"
                                value={phone}
                                onChangeText={setPhone}
                            />
                        </View>

                        {/* Password */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[styles.input, styles.passwordInput]}
                                    placeholder="Create a secure password"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <Ionicons
                                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color="#64748B"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.field}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[styles.input, styles.passwordInput]}
                                    placeholder="Confirm your password"
                                    secureTextEntry={!showConfirm}
                                    value={confirm}
                                    onChangeText={setConfirm}
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowConfirm(!showConfirm)}
                                >
                                    <Ionicons
                                        name={showConfirm ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color="#64748B"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Create Account Button */}
                        <TouchableOpacity
                            style={[
                                styles.primaryButton,
                                loading && styles.buttonDisabled
                            ]}
                            onPress={handleSignup}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="person-add-outline" size={20} color="#FFFFFF" />
                                    <Text style={styles.primaryButtonText}>Create Account</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Google Sign Up */}
                        <TouchableOpacity
                            style={[
                                styles.googleButton,
                                googleLoading && styles.buttonDisabled
                            ]}
                            onPress={handleGoogleSignup}
                            disabled={googleLoading}
                        >
                            {googleLoading ? (
                                <ActivityIndicator color="#64748B" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="logo-google" size={20} color="#DB4437" />
                                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            By creating an account, you agree to our{" "}
                            <Text style={styles.link}>Terms of Service</Text> and{" "}
                            <Text style={styles.link}>Privacy Policy</Text>
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#FFFFFF"
    },
    container: {
        flex: 1
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
    },

    // Header
    header: {
        alignItems: "center",
        marginTop: 20,
        marginBottom: 32,
    },
    progressContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#E2E8F0",
        marginHorizontal: 4,
    },
    progressDotActive: {
        backgroundColor: "#6366F1",
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#1E293B",
        textAlign: "center",
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: "#64748B",
        textAlign: "center",
        lineHeight: 24,
        paddingHorizontal: 20,
    },

    // Form Card
    formCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#F1F5F9",
    },

    // Name Row
    nameRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 16,
    },
    nameField: {
        flex: 1,
    },

    // Form Fields
    field: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    input: {
        backgroundColor: "#F8FAFC",
        borderWidth: 1.5,
        borderColor: "#E2E8F0",
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: "#1E293B",
    },

    // Password Fields
    passwordContainer: {
        position: "relative",
    },
    passwordInput: {
        paddingRight: 50,
    },
    eyeButton: {
        position: "absolute",
        right: 16,
        top: 14,
        padding: 4,
    },

    // Buttons
    primaryButton: {
        backgroundColor: "#6366F1",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: "#6366F1",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
    },
    googleButton: {
        backgroundColor: "#FFFFFF",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: "#E2E8F0",
        marginBottom: 8,
    },
    googleButtonText: {
        color: "#374151",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },

    // Divider
    divider: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#E2E8F0",
    },
    dividerText: {
        color: "#64748B",
        fontSize: 14,
        fontWeight: "500",
        marginHorizontal: 16,
    },

    // Footer
    footer: {
        alignItems: "center",
        marginBottom: 24,
    },
    footerText: {
        fontSize: 14,
        color: "#64748B",
        textAlign: "center",
        lineHeight: 20,
    },
    link: {
        color: "#6366F1",
        fontWeight: "600",
    },
});