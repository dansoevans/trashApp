// app/(auth)/phoneAuth.tsx - UPDATED FOR SIGN UP FLOW
import React, { useRef, useState } from "react";
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
    Dimensions,
    Animated,
    Modal,
    FlatList,
    TextInput as RNTextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { auth, app } from "@/Firebase/firebaseConfig";
import { signInWithPhoneNumber, PhoneAuthProvider } from "firebase/auth";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

// Comprehensive country data with flags and codes
const COUNTRIES = [
    { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
    { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
    { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
    { code: "GH", name: "Ghana", dialCode: "+233", flag: "🇬🇭" },
];

export default function PhoneAuthScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Get user data from sign-up flow
    const firstName = (params.firstName as string) || "";
    const lastName = (params.lastName as string) || "";
    const phoneFromPrev = (params.phone as string) || "";
    const address = (params.address as string) || "";
    const lat = (params.lat as string) || "";
    const lng = (params.lng as string) || "";
    const isSignUp = (params.isSignUp as string) === "true";

    const recaptchaVerifier = useRef<any>(null);
    const phoneInputRef = useRef<RNTextInput>(null);

    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
    const [phoneNumber, setPhoneNumber] = useState(phoneFromPrev || "");
    const [sending, setSending] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const fadeAnim = useState(new Animated.Value(0))[0];
    const slideAnim = useState(new Animated.Value(30))[0];

    React.useEffect(() => {
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

    const filteredCountries = COUNTRIES.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.dialCode.includes(searchQuery) ||
        country.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatPhoneNumber = (text: string) => {
        // Remove all non-digits
        const cleaned = text.replace(/\D/g, '');

        // Auto-format based on country (basic formatting)
        if (cleaned.length <= 3) {
            return cleaned;
        } else if (cleaned.length <= 6) {
            return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
        } else if (cleaned.length <= 10) {
            return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
        } else {
            return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
        }
    };

    const handleCountrySelect = (country: any) => {
        setSelectedCountry(country);
        setShowCountryPicker(false);
        setSearchQuery("");
        setTimeout(() => phoneInputRef.current?.focus(), 100);
    };

    const sendVerification = async () => {
        const fullPhoneNumber = selectedCountry.dialCode + phoneNumber.replace(/\D/g, '');

        if (!/^\+\d{10,15}$/.test(fullPhoneNumber)) {
            Alert.alert(
                "Invalid Phone Number",
                "Please enter a valid phone number with country code.",
                [{ text: "OK", style: "default" }]
            );
            return;
        }

        try {
            setSending(true);
            const result = await signInWithPhoneNumber(auth, fullPhoneNumber, recaptchaVerifier.current);

            // Prepare navigation params
            const navParams: any = {
                phone: fullPhoneNumber,
                verificationId: result.verificationId,
            };

            // Add sign-up data if this is a sign-up flow
            if (isSignUp) {
                navParams.firstName = firstName;
                navParams.lastName = lastName;
                navParams.address = address;
                navParams.lat = lat;
                navParams.lng = lng;
                navParams.isSignUp = "true";
            }

            router.push({
                pathname: "/(auth)/verifyPhone",
                params: navParams,
            });
        } catch (error: any) {
            console.error("SMS send error:", error);
            Alert.alert(
                "Verification Failed",
                error?.message || "Unable to send verification code. Please try again.",
                [{ text: "OK", style: "default" }]
            );
        } finally {
            setSending(false);
        }
    };

    const CountryPickerModal = () => (
        <Modal
            visible={showCountryPicker}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <SafeAreaView style={styles.modalContainer}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                    <View style={styles.modalTitleRow}>
                        <TouchableOpacity
                            style={styles.modalBackButton}
                            onPress={() => {
                                setShowCountryPicker(false);
                                setSearchQuery("");
                            }}
                        >
                            <Ionicons name="close" size={24} color="#0f172a" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Select Country</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#94a3b8" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search countries..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#94a3b8"
                            autoFocus
                        />
                    </View>
                </View>

                {/* Countries List */}
                <FlatList
                    data={filteredCountries}
                    keyExtractor={(item) => item.code}
                    style={styles.countryList}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.countryItem}
                            onPress={() => handleCountrySelect(item)}
                        >
                            <Text style={styles.countryFlag}>{item.flag}</Text>
                            <View style={styles.countryInfo}>
                                <Text style={styles.countryName}>{item.name}</Text>
                                <Text style={styles.countryDialCode}>{item.dialCode}</Text>
                            </View>
                            {selectedCountry.code === item.code && (
                                <Ionicons name="checkmark" size={20} color="#16a34a" />
                            )}
                        </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            </SafeAreaView>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.container}>
            <FirebaseRecaptchaVerifierModal
                ref={recaptchaVerifier}
                firebaseConfig={app.options}
                attemptInvisibleVerification={true}
            />

            <CountryPickerModal />

            <KeyboardAvoidingView
                style={styles.keyboardAvoid}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="chevron-back" size={24} color="#0f172a" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {isSignUp ? "Verify Your Phone" : "Phone Verification"}
                    </Text>
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
                        <View style={styles.phoneIconContainer}>
                            <Ionicons name="phone-portrait" size={48} color="#16a34a" />
                            <View style={styles.wave} />
                        </View>
                    </View>

                    {/* Title & Description */}
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>
                            {isSignUp ? "Almost There!" : "Enter Your Phone Number"}
                        </Text>
                        <Text style={styles.subtitle}>
                            {isSignUp
                                ? "We'll send a verification code to secure your new account"
                                : "We'll send a verification code to your phone number to sign in"
                            }
                        </Text>
                    </View>

                    {/* Phone Input with Country Selector */}
                    <View style={styles.inputContainer}>
                        <View style={[styles.inputWrapper, isFocused && styles.inputFocused]}>
                            {/* Country Code Selector */}
                            <TouchableOpacity
                                style={styles.countrySelector}
                                onPress={() => setShowCountryPicker(true)}
                            >
                                <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                                <Text style={styles.countryCode}>{selectedCountry.dialCode}</Text>
                                <Ionicons name="chevron-down" size={16} color="#64748b" />
                            </TouchableOpacity>

                            {/* Separator */}
                            <View style={styles.separatorVertical} />

                            {/* Phone Number Input */}
                            <TextInput
                                ref={phoneInputRef}
                                style={styles.phoneInput}
                                value={phoneNumber}
                                onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                keyboardType="phone-pad"
                                placeholder="Enter your phone number"
                                placeholderTextColor="#94a3b8"
                                autoComplete="tel"
                                textContentType="telephoneNumber"
                                editable={!sending}
                            />
                        </View>

                        <Text style={styles.helperText}>
                            Standard messaging rates may apply
                        </Text>
                    </View>

                    {/* CTA Button */}
                    <TouchableOpacity
                        style={[
                            styles.primaryButton,
                            sending && styles.buttonDisabled,
                        ]}
                        onPress={sendVerification}
                        disabled={sending}
                    >
                        {sending ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Ionicons name="send" size={18} color="#fff" />
                                <Text style={styles.primaryButtonText}>
                                    {isSignUp ? "Create Account" : "Send Verification Code"}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Security Note */}
                    <View style={styles.securityNote}>
                        <Ionicons name="shield-checkmark" size={16} color="#64748b" />
                        <Text style={styles.securityText}>
                            Your number is only used for authentication
                        </Text>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ... styles remain the same as previous version ...

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
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    backButton: {
        padding: 4,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#0f172a",
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: height * 0.05,
        paddingBottom: 40,
    },
    illustration: {
        alignItems: "center",
        marginBottom: 40,
    },
    phoneIconContainer: {
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
    },
    wave: {
        position: "absolute",
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(22, 163, 74, 0.1)",
        zIndex: -1,
    },
    textContainer: {
        alignItems: "center",
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#0f172a",
        textAlign: "center",
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: "#64748b",
        textAlign: "center",
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    inputContainer: {
        marginBottom: 32,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        borderWidth: 2,
        borderColor: "#f1f5f9",
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 8,
    },
    inputFocused: {
        borderColor: "#16a34a",
        backgroundColor: "#ffffff",
        shadowColor: "#16a34a",
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    countrySelector: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        minWidth: 100,
    },
    countryFlag: {
        fontSize: 20,
        marginRight: 8,
    },
    countryCode: {
        fontSize: 16,
        fontWeight: "600",
        color: "#0f172a",
        marginRight: 4,
    },
    separatorVertical: {
        width: 1,
        height: 24,
        backgroundColor: "#e2e8f0",
        marginHorizontal: 8,
    },
    phoneInput: {
        flex: 1,
        fontSize: 16,
        color: "#0f172a",
        fontWeight: "500",
        padding: 8,
    },
    helperText: {
        fontSize: 14,
        color: "#94a3b8",
        textAlign: "center",
    },
    primaryButton: {
        backgroundColor: "#16a34a",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 16,
        marginBottom: 24,
        shadowColor: "#16a34a",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    primaryButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        marginLeft: 8,
    },
    securityNote: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
    },
    securityText: {
        fontSize: 14,
        color: "#64748b",
        marginLeft: 6,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    modalHeader: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    modalTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    modalBackButton: {
        padding: 4,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#0f172a",
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: "#0f172a",
        marginLeft: 8,
        padding: 0,
    },
    countryList: {
        flex: 1,
    },
    countryItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    countryInfo: {
        flex: 1,
        marginLeft: 12,
    },
    countryName: {
        fontSize: 16,
        fontWeight: "500",
        color: "#0f172a",
        marginBottom: 2,
    },
    countryDialCode: {
        fontSize: 14,
        color: "#64748b",
    },
    separator: {
        height: 1,
        backgroundColor: "#f1f5f9",
        marginLeft: 20,
    },
});