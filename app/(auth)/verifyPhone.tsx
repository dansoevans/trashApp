// app/(auth)/verifyPhone.tsx
import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    SafeAreaView,
    Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "@/Firebase/firebaseConfig";
import { ensureUserDoc } from "@/services/authService";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");
const CODE_LENGTH = 6;

export default function VerifyPhoneScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const verificationId = (params.verificationId as string) || "";
    const phone = (params.phone as string) || "";

    const [code, setCode] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(30);

    const inputRef = useRef<TextInput>(null);
    const fadeAnim = useState(new Animated.Value(0))[0];
    const slideAnim = useState(new Animated.Value(20))[0];

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Auto-submit when code is complete
    useEffect(() => {
        if (code.length === CODE_LENGTH && !verifying) {
            handleVerify();
        }
    }, [code]);

    const handleVerify = async () => {
        if (!code || code.length < CODE_LENGTH) {
            Alert.alert(
                "Incomplete Code",
                `Please enter all ${CODE_LENGTH} digits of the verification code.`,
                [{ text: "OK", style: "default" }]
            );
            return;
        }

        try {
            setVerifying(true);
            const credential = PhoneAuthProvider.credential(verificationId, code.trim());
            const userCred = await signInWithCredential(auth, credential);
            const user = userCred.user;

            await ensureUserDoc(user, { phone });

            // Success - navigate to home
            router.replace("/(tabs)/home");
        } catch (error: any) {
            console.error("Verification error:", error);
            Alert.alert(
                "Verification Failed",
                error?.message || "Invalid verification code. Please try again.",
                [{ text: "OK", style: "default" }]
            );
            // Clear the code on error
            setCode("");
            inputRef.current?.focus();
        } finally {
            setVerifying(false);
        }
    };

    const handleResendCode = async () => {
        setResendLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            setCountdown(30);
            setCode(""); // Clear existing code
            inputRef.current?.focus();
            Alert.alert(
                "Code Resent",
                "A new verification code has been sent to your phone.",
                [{ text: "OK", style: "default" }]
            );
        } catch (error) {
            Alert.alert(
                "Resend Failed",
                "Unable to resend code. Please try again.",
                [{ text: "OK", style: "default" }]
            );
        } finally {
            setResendLoading(false);
        }
    };

    const formatPhoneNumber = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('1') && cleaned.length === 11) {
            return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
        }
        return phone;
    };

    const focusInput = () => {
        inputRef.current?.focus();
    };

    // Render code digits with proper spacing
    const renderCodeDigits = () => {
        return Array.from({ length: CODE_LENGTH }).map((_, index) => (
            <View
                key={index}
                style={[
                    styles.codeDigit,
                    code[index] && styles.codeDigitFilled,
                    code.length === index && styles.codeDigitActive,
                ]}
            >
                <Text style={styles.codeDigitText}>
                    {code[index] || ""}
                </Text>
                {code.length === index && !code[index] && (
                    <View style={styles.cursor} />
                )}
            </View>
        ));
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoid}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        disabled={verifying}
                    >
                        <Ionicons name="chevron-back" size={24} color="#0f172a" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Verify Phone</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    {/* Illustration */}
                    <View style={styles.illustration}>
                        <View style={styles.verificationIcon}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="key" size={32} color="#16a34a" />
                            </View>
                        </View>
                    </View>

                    {/* Title & Description */}
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>Enter Verification Code</Text>
                        <Text style={styles.subtitle}>
                            Enter the {CODE_LENGTH}-digit code sent to
                        </Text>
                        <Text style={styles.phoneNumber}>
                            {formatPhoneNumber(phone)}
                        </Text>
                    </View>

                    {/* Code Input Section */}
                    <View style={styles.codeSection}>
                        <TouchableOpacity
                            style={styles.codeInputContainer}
                            onPress={focusInput}
                            activeOpacity={0.8}
                        >
                            <TextInput
                                ref={inputRef}
                                style={styles.hiddenInput}
                                value={code}
                                onChangeText={(text) => {
                                    const numbers = text.replace(/\D/g, '');
                                    setCode(numbers.slice(0, CODE_LENGTH));
                                }}
                                keyboardType="number-pad"
                                maxLength={CODE_LENGTH}
                                autoFocus={true}
                                caretHidden={true}
                                editable={!verifying}
                            />

                            {/* Visual Code Display */}
                            <View style={styles.codeDisplay}>
                                {renderCodeDigits()}
                            </View>
                        </TouchableOpacity>

                        <Text style={styles.codeHelperText}>
                            Enter {CODE_LENGTH}-digit code from SMS
                        </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={[
                                styles.verifyButton,
                                (verifying || code.length !== CODE_LENGTH) && styles.buttonDisabled,
                            ]}
                            onPress={handleVerify}
                            disabled={verifying || code.length !== CODE_LENGTH}
                        >
                            {verifying ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                    <Text style={styles.verifyButtonText}>
                                        Verify & Continue
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Resend Code Section */}
                        <View style={styles.resendSection}>
                            <Text style={styles.resendText}>
                                Didn't receive the code?{" "}
                            </Text>
                            <TouchableOpacity
                                onPress={handleResendCode}
                                disabled={resendLoading || countdown > 0}
                            >
                                <Text style={[
                                    styles.resendButton,
                                    (resendLoading || countdown > 0) && styles.resendButtonDisabled
                                ]}>
                                    {resendLoading ? "Sending..." :
                                        countdown > 0 ? `Resend (${countdown}s)` : "Resend Code"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Security Note */}
                    <View style={styles.securityNote}>
                        <Ionicons name="shield-checkmark" size={14} color="#64748b" />
                        <Text style={styles.securityText}>
                            Your verification code is secure and encrypted
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
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#0f172a",
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: height * 0.02,
        paddingBottom: 30,
    },
    illustration: {
        alignItems: "center",
        marginTop: height * 0.02,
        marginBottom: 30,
    },
    verificationIcon: {
        alignItems: "center",
        justifyContent: "center",
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(22, 163, 74, 0.1)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "rgba(22, 163, 74, 0.2)",
    },
    textContainer: {
        alignItems: "center",
        marginBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#0f172a",
        textAlign: "center",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#64748b",
        textAlign: "center",
        lineHeight: 22,
    },
    phoneNumber: {
        fontSize: 17,
        fontWeight: "600",
        color: "#16a34a",
        textAlign: "center",
        marginTop: 8,
    },
    codeSection: {
        marginBottom: 32,
    },
    codeInputContainer: {
        marginBottom: 16,
    },
    hiddenInput: {
        position: "absolute",
        width: 1,
        height: 1,
        opacity: 0,
    },
    codeDisplay: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 8,
    },
    codeDigit: {
        width: 52,
        height: 60,
        borderWidth: 2,
        borderColor: "#e2e8f0",
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        position: "relative",
    },
    codeDigitFilled: {
        borderColor: "#16a34a",
        backgroundColor: "#ffffff",
    },
    codeDigitActive: {
        borderColor: "#16a34a",
        backgroundColor: "#ffffff",
        shadowColor: "#16a34a",
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    codeDigitText: {
        fontSize: 22,
        fontWeight: "600",
        color: "#0f172a",
    },
    cursor: {
        position: "absolute",
        width: 2,
        height: 20,
        backgroundColor: "#16a34a",
        borderRadius: 1,
    },
    codeHelperText: {
        fontSize: 14,
        color: "#94a3b8",
        textAlign: "center",
    },
    actionsContainer: {
        marginBottom: 24,
    },
    verifyButton: {
        backgroundColor: "#16a34a",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 24,
        shadowColor: "#16a34a",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    verifyButtonText: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "600",
        marginLeft: 8,
    },
    resendSection: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
    },
    resendText: {
        fontSize: 15,
        color: "#64748b",
    },
    resendButton: {
        fontSize: 15,
        color: "#16a34a",
        fontWeight: "600",
    },
    resendButtonDisabled: {
        color: "#94a3b8",
    },
    securityNote: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
    },
    securityText: {
        fontSize: 13,
        color: "#64748b",
        marginLeft: 6,
    },
});