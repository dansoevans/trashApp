// app/(auth)/basicInfo.tsx - UPDATED
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Dimensions,
    Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function BasicInfoScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const address = (params.address as string) || "";

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
    });

    const [loading, setLoading] = useState(false);
    const fadeAnim = useState(new Animated.Value(0))[0];
    const slideAnim = useState(new Animated.Value(30))[0];

    useEffect(() => {
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

    const updateFormData = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = (): boolean => {
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            Alert.alert("Missing Information", "Please enter your first and last name.");
            return false;
        }

        if (!formData.phone.trim()) {
            Alert.alert("Missing Information", "Please enter your phone number.");
            return false;
        }

        // Basic phone validation
        const phoneRegex = /^\+?[\d\s\-\(\)]{7,15}$/;
        if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
            Alert.alert("Invalid Phone Number", "Please enter a valid phone number.");
            return false;
        }

        return true;
    };

    const handleContinue = () => {
        if (!validateForm()) return;

        // Navigate to phone verification with all collected data
        router.push({
            pathname: "/(auth)/phoneAuth",
            params: {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                phone: formData.phone.trim(),
                address: address,
                isSignUp: "true",
            },
        });
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
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="chevron-back" size={24} color="#0f172a" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Personal Info</Text>
                        <View style={styles.headerSpacer} />
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Address Preview */}
                        {address && (
                            <View style={styles.addressPreview}>
                                <Ionicons name="location" size={16} color="#16a34a" />
                                <Text style={styles.addressText} numberOfLines={2}>
                                    {address}
                                </Text>
                            </View>
                        )}
                        {/* Illustration */}
                        <View style={styles.illustration}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="person" size={64} color="#16a34a" />
                                <View style={styles.wave} />
                            </View>
                        </View>

                        {/* Title & Description */}
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>Complete Your Profile</Text>

                        </View>


                        {/* Name Fields */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Full Name</Text>
                            <View style={styles.nameRow}>
                                <View style={styles.nameField}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="First Name"
                                        placeholderTextColor="#94a3b8"
                                        value={formData.firstName}
                                        onChangeText={(value) => updateFormData("firstName", value)}
                                        autoCapitalize="words"
                                        autoComplete="name-given"
                                    />
                                </View>
                                <View style={styles.nameField}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Last Name"
                                        placeholderTextColor="#94a3b8"
                                        value={formData.lastName}
                                        onChangeText={(value) => updateFormData("lastName", value)}
                                        autoCapitalize="words"
                                        autoComplete="name-family"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Phone Field */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your phone number"
                                placeholderTextColor="#94a3b8"
                                value={formData.phone}
                                onChangeText={(value) => updateFormData("phone", value)}
                                keyboardType="phone-pad"
                                autoComplete="tel"
                            />
                            <Text style={styles.helperText}>
                                We'll send a verification code to this number
                            </Text>


                        </View>
                    </ScrollView>


                    {/* Continue Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[
                                styles.continueButton,
                                (!formData.firstName || !formData.lastName || !formData.phone) && styles.continueButtonDisabled,
                            ]}
                            onPress={handleContinue}
                            disabled={!formData.firstName || !formData.lastName || !formData.phone || loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <>
                                    <Text style={styles.continueButtonText}>Continue to Verification</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>
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
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#0f172a",
    },
    headerSpacer: {
        width: 24,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 20,
    },
    progressContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 32,
        paddingHorizontal: 40,
    },
    progressStep: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#e2e8f0",
        justifyContent: "center",
        alignItems: "center",
    },
    progressStepCompleted: {
        backgroundColor: "#16a34a",
    },
    progressStepCurrent: {
        backgroundColor: "#16a34a",
    },
    progressStepText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#64748b",
    },
    progressLine: {
        flex: 1,
        height: 2,
        backgroundColor: "#e2e8f0",
        marginHorizontal: 8,
    },
    illustration: {
        alignItems: "center",
        marginBottom: 32,
    },
    iconContainer: {
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
    },
    wave: {
        position: "absolute",
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "rgba(22, 163, 74, 0.1)",
        zIndex: -1,
    },
    textContainer: {
        alignItems: "center",
        marginBottom: 24,
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
        paddingHorizontal: 10,
    },
    addressPreview: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f0fdf4",
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#dcfce7",
        marginBottom: 24,
    },
    addressText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: "#15803d",
        fontWeight: "500",
    },
    section: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#0f172a",
        marginBottom: 8,
    },
    nameRow: {
        flexDirection: "row",
        gap: 12,
    },
    nameField: {
        flex: 1,
    },
    input: {
        backgroundColor: "#f8fafc",
        borderWidth: 2,
        borderColor: "#e2e8f0",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: "#0f172a",
    },
    helperText: {
        fontSize: 14,
        color: "#64748b",
        marginTop: 8,
    },
    footer: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
        backgroundColor: "#ffffff",
    },
    continueButton: {
        backgroundColor: "#16a34a",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        shadowColor: "#16a34a",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    continueButtonDisabled: {
        opacity: 0.5,
    },
    continueButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        marginRight: 8,
    },
});