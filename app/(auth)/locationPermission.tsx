// app/(auth)/locationPermission.tsx
import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    FlatList
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

// Mock address suggestions - in real app, you'd use Google Places API or similar
const mockAddressSuggestions = [
    "123 Main Street, Toronto, ON M5V 2T6",
    "456 Queen Street West, Toronto, ON M5V 1A2",
    "789 King Street East, Toronto, ON M5A 1K4",
    "321 Front Street, Toronto, ON M5J 1G5",
    "654 Spadina Avenue, Toronto, ON M5T 1H4",
    "987 College Street, Toronto, ON M6H 1A3",
    "147 Dundas Street West, Toronto, ON M5G 1C3",
    "258 Bay Street, Toronto, ON M5H 2N2",
    "369 Yonge Street, Toronto, ON M5B 1S8",
    "741 Bloor Street West, Toronto, ON M6G 1L6"
];

export default function LocationPermissionScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [addressPreview, setAddressPreview] = useState<string | null>(null);
    const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualAddress, setManualAddress] = useState("");
    const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    const slideAnim = useRef(new Animated.Value(height)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const suggestionAnim = useRef(new Animated.Value(0)).current;

    const animatePreview = () => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const showManualEntryCard = () => {
        setShowManualEntry(true);
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
        }).start();
    };

    const hideManualEntryCard = () => {
        Animated.timing(slideAnim, {
            toValue: height,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setShowManualEntry(false);
            setManualAddress("");
            setAddressSuggestions([]);
            setShowSuggestions(false);
        });
    };

    const showSuggestionList = () => {
        setShowSuggestions(true);
        Animated.timing(suggestionAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const hideSuggestionList = () => {
        Animated.timing(suggestionAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setShowSuggestions(false);
        });
    };

    // Get address suggestions based on user input
    const getAddressSuggestions = (input: string) => {
        if (input.length < 2) {
            setAddressSuggestions([]);
            hideSuggestionList();
            return;
        }

        const filtered = mockAddressSuggestions.filter(addr =>
            addr.toLowerCase().includes(input.toLowerCase())
        ).slice(0, 5); // Limit to 5 suggestions

        setAddressSuggestions(filtered);
        if (filtered.length > 0) {
            showSuggestionList();
        } else {
            hideSuggestionList();
        }
    };

    const handleAddressInputChange = (text: string) => {
        setManualAddress(text);
        getAddressSuggestions(text);
    };

    const selectSuggestion = (suggestion: string) => {
        setManualAddress(suggestion);
        setAddressSuggestions([]);
        hideSuggestionList();
    };

    const requestLocation = async () => {
        try {
            setLoading(true);
            setIsGettingLocation(true);

            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                Alert.alert(
                    "Location Access Needed",
                    "We use your location to pre-fill your address for faster service. You can still enter it manually.",
                    [{ text: "OK", style: "default" }]
                );
                setLoading(false);
                setIsGettingLocation(false);
                return;
            }

            const pos = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced
            });

            setCoords({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
            });

            // Reverse geocode to get full address
            const places = await Location.reverseGeocodeAsync({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
            });

            if (Array.isArray(places) && places[0]) {
                const p = places[0];
                const formatted = `${p.streetNumber ? p.streetNumber + ' ' : ''}${p.street ? p.street : ''}${p.street && p.city ? ', ' : ''}${p.city ? p.city : ''}${p.city && p.region ? ', ' : ''}${p.region ? p.region : ''}${p.postalCode ? ' ' + p.postalCode : ''}`;

                const fullAddress = formatted.trim() ||
                    `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;

                setAddressPreview(fullAddress);
            } else {
                setAddressPreview(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
            }

            animatePreview();
        } catch (e) {
            console.warn("Location error", e);
            Alert.alert(
                "Location Unavailable",
                "We couldn't access your location. You can enter your address manually.",
                [{ text: "OK", style: "default" }]
            );
        } finally {
            setLoading(false);
            setIsGettingLocation(false);
        }
    };

    const handleContinue = () => {
        const finalAddress = addressPreview || manualAddress;
        if (!finalAddress.trim()) {
            Alert.alert("Address Required", "Please enter your address to continue.");
            return;
        }

        router.push({
            pathname: "/(auth)/signup",
            params: {
                address: finalAddress,
                lat: coords?.latitude?.toString() ?? "",
                lng: coords?.longitude?.toString() ?? ""
            },
        });
    };

    const handleUseManualAddress = () => {
        if (manualAddress.trim()) {
            setAddressPreview(manualAddress);
            hideManualEntryCard();
        } else {
            Alert.alert("Address Required", "Please enter your address.");
        }
    };

    const renderSuggestionItem = ({ item }: { item: string }) => (
        <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() => selectSuggestion(item)}
        >
            <Ionicons name="location-outline" size={16} color="#6366F1" />
            <Text style={styles.suggestionText}>{item}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >

                {/* Main Content */}
                <View style={styles.mainContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="location-outline" size={32} color="#6366F1" />
                        </View>
                        <Text style={styles.title}>Find Your Location</Text>
                        <Text style={styles.subtitle}>
                            We'll use your location to help collectors find you quickly and fill in your address automatically.
                        </Text>
                    </View>

                    {/* Loading State for Location Detection */}
                    {isGettingLocation && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#6366F1" />
                            <Text style={styles.loadingText}>Finding your location...</Text>
                            <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
                        </View>
                    )}

                    {/* Address Preview */}
                    {addressPreview && !isGettingLocation && (
                        <Animated.View
                            style={[
                                styles.previewContainer,
                                { opacity: fadeAnim }
                            ]}
                        >
                            <View style={styles.previewHeader}>
                                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                <Text style={styles.previewTitle}>Location Found</Text>
                            </View>
                            <View style={styles.addressBox}>
                                <Text style={styles.addressText}>{addressPreview}</Text>
                                {/*<TouchableOpacity*/}
                                {/*    style={styles.editButton}*/}
                                {/*    onPress={showManualEntryCard}*/}
                                {/*>*/}
                                {/*    <Ionicons name="create-outline" size={16} color="#6366F1" />*/}
                                {/*</TouchableOpacity>*/}
                            </View>
                        </Animated.View>
                    )}

                    {/* Action Buttons */}
                    {!isGettingLocation && (
                        <View style={styles.actionsContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.primaryButton,
                                    loading && styles.buttonDisabled
                                ]}
                                onPress={requestLocation}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="locate-outline" size={20} color="#FFFFFF" />
                                        <Text style={styles.primaryButtonText}>Use My Location</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {/*<TouchableOpacity*/}
                            {/*    style={styles.secondaryButton}*/}
                            {/*    onPress={showManualEntryCard}*/}
                            {/*>*/}
                            {/*    <Ionicons name="create-outline" size={18} color="#6366F1" />*/}
                            {/*    <Text style={styles.secondaryButtonText}>*/}
                            {/*        Enter Address Manually*/}
                            {/*    </Text>*/}
                            {/*</TouchableOpacity>*/}

                            {addressPreview && (
                                <TouchableOpacity
                                    style={styles.continueButton}
                                    onPress={handleContinue}
                                >
                                    <Text style={styles.continueButtonText}>
                                        Continue
                                    </Text>
                                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Privacy Note */}
                    {!isGettingLocation && (
                        <View style={styles.privacyNote}>
                            <Ionicons name="lock-closed-outline" size={14} color="#6B7280" />
                            <Text style={styles.privacyText}>
                                Your location is encrypted and only used for service delivery
                            </Text>
                        </View>
                    )}
                </View>

                {/* Full Screen Manual Entry Card */}
                {showManualEntry && (
                    <Animated.View
                        style={[
                            styles.fullScreenCard,
                            { transform: [{ translateY: slideAnim }] }
                        ]}
                    >
                        <SafeAreaView style={styles.cardSafeArea}>
                            {/* Header */}
                            <View style={styles.cardHeader}>
                                <TouchableOpacity
                                    style={styles.backButton}
                                    onPress={hideManualEntryCard}
                                >
                                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                                </TouchableOpacity>
                                <Text style={styles.cardTitle}>Enter Your Address</Text>
                                <View style={styles.headerSpacer} />
                            </View>

                            {/* Content */}
                            <View style={styles.cardContent}>
                                <ScrollView
                                    style={styles.cardScrollView}
                                    contentContainerStyle={styles.cardContentContainer}
                                    keyboardShouldPersistTaps="handled"
                                >
                                    <View style={styles.inputSection}>
                                        <Text style={styles.inputLabel}>Full Address</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder="Start typing your address..."
                                            placeholderTextColor="#9CA3AF"
                                            value={manualAddress}
                                            onChangeText={handleAddressInputChange}
                                            textAlignVertical="top"
                                            autoFocus
                                            returnKeyType="done"
                                        />

                                        {/* Address Suggestions */}
                                        {showSuggestions && addressSuggestions.length > 0 && (
                                            <Animated.View
                                                style={[
                                                    styles.suggestionsContainer,
                                                    { opacity: suggestionAnim }
                                                ]}
                                            >
                                                <Text style={styles.suggestionsTitle}>
                                                    Address Suggestions
                                                </Text>
                                                <FlatList
                                                    data={addressSuggestions}
                                                    renderItem={renderSuggestionItem}
                                                    keyExtractor={(item, index) => index.toString()}
                                                    scrollEnabled={false}
                                                    style={styles.suggestionsList}
                                                />
                                            </Animated.View>
                                        )}

                                        {/* Help Text */}
                                        <View style={styles.helpContainer}>
                                            <Ionicons name="information-circle-outline" size={16} color="#6366F1" />
                                            <Text style={styles.helpText}>
                                                Start typing to see address suggestions. Include street number, street name, city, and postal code for best results.
                                            </Text>
                                        </View>
                                    </View>
                                </ScrollView>

                                {/* Footer */}
                                <View style={styles.cardFooter}>
                                    <TouchableOpacity
                                        style={[
                                            styles.saveButton,
                                            !manualAddress.trim() && styles.saveButtonDisabled
                                        ]}
                                        onPress={handleUseManualAddress}
                                        disabled={!manualAddress.trim()}
                                    >
                                        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                        <Text style={styles.saveButtonText}>
                                            {manualAddress.trim() ? 'Use This Address' : 'Enter Address to Continue'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </SafeAreaView>
                    </Animated.View>
                )}
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
        flex: 1,
    },
    mainContent: {
        flex: 1,
        padding: 24,
        justifyContent: "space-between"
    },

    // Header
    header: {
        alignItems: "center",
        marginTop: 40,
        marginBottom: 40,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#F8FAFC",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#1E293B",
        textAlign: "center",
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: "#64748B",
        textAlign: "center",
        lineHeight: 24,
        paddingHorizontal: 20,
    },

    // Loading State
    loadingContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    loadingText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1E293B",
        marginTop: 20,
        marginBottom: 8,
    },
    loadingSubtext: {
        fontSize: 14,
        color: "#64748B",
        textAlign: "center",
    },

    // Preview
    previewContainer: {
        marginBottom: 32,
    },
    previewHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        justifyContent: "center",
    },
    previewTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#10B981",
        marginLeft: 8,
    },
    addressBox: {
        backgroundColor: "#F8FAFC",
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    addressText: {
        fontSize: 16,
        color: "#1E293B",
        fontWeight: "500",
        flex: 1,
        marginRight: 12,
    },
    editButton: {
        padding: 8,
    },

    // Actions
    actionsContainer: {
        marginBottom: 24,
    },
    primaryButton: {
        backgroundColor: "#6366F1",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginBottom: 12,
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
    secondaryButton: {
        backgroundColor: "#FFFFFF",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: "#E2E8F0",
        marginBottom: 20,
    },
    secondaryButtonText: {
        color: "#6366F1",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
    },
    continueButton: {
        backgroundColor: "#10B981",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginTop: 8,
    },
    continueButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
        marginRight: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },

    // Privacy
    privacyNote: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
    },
    privacyText: {
        fontSize: 13,
        color: "#64748B",
        marginLeft: 8,
    },

    // Full Screen Manual Entry Card
    fullScreenCard: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#FFFFFF",
        zIndex: 1000,
    },
    cardSafeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    backButton: {
        padding: 4,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1E293B",
    },
    headerSpacer: {
        width: 32,
    },
    cardContent: {
        flex: 1,
    },
    cardScrollView: {
        flex: 1,
    },
    cardContentContainer: {
        padding: 24,
        paddingTop: 32,
    },
    inputSection: {
        marginBottom: 32,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1E293B",
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: "#F8FAFC",
        borderWidth: 1.5,
        borderColor: "#E2E8F0",
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: "#1E293B",
        textAlignVertical: "top",
        marginBottom: 16,
    },

    // Suggestions
    suggestionsContainer: {
        backgroundColor: "#F8FAFC",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        marginBottom: 16,
        padding: 12,
    },
    suggestionsTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    suggestionsList: {
        maxHeight: 200,
    },
    suggestionItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    suggestionText: {
        fontSize: 14,
        color: "#374151",
        marginLeft: 8,
        flex: 1,
    },

    // Help Text
    helpContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#F0F9FF",
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E0F2FE",
    },
    helpText: {
        fontSize: 13,
        color: "#0369A1",
        marginLeft: 8,
        flex: 1,
        lineHeight: 18,
    },

    // Footer
    cardFooter: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
        backgroundColor: "#FFFFFF",
    },
    saveButton: {
        backgroundColor: "#6366F1",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        shadowColor: "#6366F1",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonDisabled: {
        backgroundColor: "#9CA3AF",
    },
    saveButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
    },
});