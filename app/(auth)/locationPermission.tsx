// app/(auth)/location.tsx - NEW IMPROVED VERSION
import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

// Mock address suggestions - in real app, you'd use Google Places API
const MOCK_SUGGESTIONS = [
    "123 Main Street, New York, NY 10001",
    "123 Park Avenue, New York, NY 10022",
    "123 Broadway, New York, NY 10003",
    "321 5th Avenue, New York, NY 10016",
    "654 Lexington Avenue, New York, NY 10021",
    "987 Madison Avenue, New York, NY 10065",
    "147 Wall Street, New York, NY 10005",
    "258 Hudson Street, New York, NY 10013",
    "369 Greenwich Street, New York, NY 10014",
    "741 Canal Street, New York, NY 10013"
];

export default function LocationScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [selectedAddress, setSelectedAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);

    const searchInputRef = useRef<TextInput>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Filter suggestions based on search query
    useEffect(() => {
        if (searchQuery.length > 2) {
            const filtered = MOCK_SUGGESTIONS.filter(addr =>
                addr.toLowerCase().includes(searchQuery.toLowerCase())
            ).slice(0, 5);
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    }, [searchQuery]);

    const handleUseCurrentLocation = async () => {
        try {
            setGettingLocation(true);

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    "Location Permission Required",
                    "Please enable location services to use your current location.",
                    [{ text: "OK" }]
                );
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const [address] = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            if (address) {
                const formattedAddress = [
                    address.streetNumber,
                    address.street,
                    address.city,
                    address.region,
                    address.postalCode
                ].filter(Boolean).join(', ');

                setSearchQuery(formattedAddress);
                setSelectedAddress(formattedAddress);
                setSuggestions([]);
                searchInputRef.current?.blur();
            }
        } catch (error) {
            console.error("Location error:", error);
            Alert.alert(
                "Location Error",
                "Unable to get your current location. Please search for your address manually.",
                [{ text: "OK" }]
            );
        } finally {
            setGettingLocation(false);
        }
    };

    const handleSelectSuggestion = (address: string) => {
        setSearchQuery(address);
        setSelectedAddress(address);
        setSuggestions([]);
        searchInputRef.current?.blur();
    };

    const handleContinue = () => {
        if (!selectedAddress.trim()) {
            Alert.alert("Address Required", "Please enter or select your address to continue.");
            return;
        }

        router.push({
            pathname: "/(auth)/signup",
            params: { address: selectedAddress }
        });
    };

    const renderSuggestionItem = ({ item }: { item: string }) => (
        <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() => handleSelectSuggestion(item)}
        >
            <Ionicons name="location-outline" size={20} color="#16a34a" />
            <Text style={styles.suggestionText}>{item}</Text>
        </TouchableOpacity>
    );

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
                        <Text style={styles.headerTitle}>Add Location</Text>
                        <View style={styles.headerSpacer} />
                    </View>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >


                        {/* Search Bar */}
                        <View style={styles.searchSection}>
                            <View style={styles.searchContainer}>
                                <Ionicons name="search" size={20} color="#64748b" />
                                <TextInput
                                    ref={searchInputRef}
                                    style={styles.searchInput}
                                    placeholder="Search for your address..."
                                    placeholderTextColor="#94a3b8"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    returnKeyType="search"
                                />
                                <TouchableOpacity
                                    style={styles.locationButton}
                                    onPress={handleUseCurrentLocation}
                                    disabled={gettingLocation}
                                >
                                    {gettingLocation ? (
                                        <ActivityIndicator size="small" color="#16a34a" />
                                    ) : (
                                        <Ionicons name="locate" size={20} color="#16a34a" />
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Suggestions */}
                            {suggestions.length > 0 && (
                                <View style={styles.suggestionsContainer}>
                                    <FlatList
                                        data={suggestions}
                                        renderItem={renderSuggestionItem}
                                        keyExtractor={(item, index) => index.toString()}
                                        scrollEnabled={false}
                                        style={styles.suggestionsList}
                                    />
                                </View>
                            )}

                            {/* Selected Address Preview */}
                            {selectedAddress && (
                                <View style={styles.selectedAddressContainer}>
                                    <View style={styles.selectedAddressHeader}>
                                        <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                                        <Text style={styles.selectedAddressTitle}>Selected Address</Text>
                                    </View>
                                    <Text style={styles.selectedAddressText}>{selectedAddress}</Text>
                                </View>
                            )}
                        </View>

                        {/* Help Text */}
                        <View style={styles.helpContainer}>
                            <Ionicons name="information-circle" size={16} color="#64748b" />
                            <Text style={styles.helpText}>
                                Your address helps us schedule pickups and provide accurate service
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Continue Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[
                                styles.continueButton,
                                !selectedAddress && styles.continueButtonDisabled,
                            ]}
                            onPress={handleContinue}
                            disabled={!selectedAddress}
                        >
                            <Text style={styles.continueButtonText}>Continue</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
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
    illustration: {
        alignItems: "center",
        marginTop: 20,
        marginBottom: 40,
    },
    iconContainer: {
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
    },
    wave: {
        position: "absolute",
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "rgba(22, 163, 74, 0.1)",
        zIndex: -1,
    },
    textContainer: {
        alignItems: "center",
        marginBottom: 32,
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
    searchSection: {
        marginBottom: 24,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        borderWidth: 2,
        borderColor: "#e2e8f0",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
        fontSize: 16,
        color: "#0f172a",
    },
    locationButton: {
        padding: 4,
    },
    suggestionsContainer: {
        marginTop: 8,
        backgroundColor: "#ffffff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        overflow: "hidden",
    },
    suggestionsList: {
        maxHeight: 200,
    },
    suggestionItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    suggestionText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: "#374151",
    },
    selectedAddressContainer: {
        marginTop: 16,
        padding: 16,
        backgroundColor: "#f0fdf4",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#dcfce7",
    },
    selectedAddressHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    selectedAddressTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#16a34a",
        marginLeft: 8,
    },
    selectedAddressText: {
        fontSize: 16,
        color: "#15803d",
        fontWeight: "500",
    },
    helpContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#f8fafc",
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    helpText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: "#64748b",
        lineHeight: 20,
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