// app/(tabs)/profile.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
    Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "@/Firebase/firebaseConfig";
import { getUserDoc, logoutUser } from "@/services/authService";
import { setupNotifications, askNotificationPermission } from "@/services/notificationService";
import { UserProfile } from "@/types";
import { LinearGradient } from "expo-linear-gradient";

interface MenuItem {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    route: string;
    color: string;
    requiresAuth?: boolean;
}

export default function ProfileScreen() {
    const router = useRouter();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const fadeAnim = useState(new Animated.Value(0))[0];

    const menuItems: MenuItem[] = [
        {
            icon: "person-outline",
            title: "Personal Information",
            subtitle: "Manage your personal details",
            route: "/personal-info",
            color: "#10B981",
        },
        {
            icon: "lock-closed-outline",
            title: "Password & Security",
            subtitle: "Change password and security settings",
            route: "/security",
            color: "#EF4444",
        },
        {
            icon: "notifications-outline",
            title: "Notifications",
            subtitle: "Manage your notification preferences",
            route: "/notifications-settings",
            color: "#3B82F6",
        },
        {
            icon: "location-outline",
            title: "Address Book",
            subtitle: "Manage your saved addresses",
            route: "/addresses",
            color: "#8B5CF6",
        },
        {
            icon: "card-outline",
            title: "Payment Methods",
            subtitle: "Manage your payment options",
            route: "/payments",
            color: "#F59E0B",
        },
        {
            icon: "help-circle-outline",
            title: "Help & Support",
            subtitle: "Get help and contact support",
            route: "/support",
            color: "#6B7280",
        },
        {
            icon: "shield-checkmark-outline",
            title: "Privacy Policy",
            subtitle: "Review our privacy practices",
            route: "/privacy",
            color: "#059669",
        },
        {
            icon: "document-text-outline",
            title: "Terms of Service",
            subtitle: "Read our terms and conditions",
            route: "/terms",
            color: "#7C3AED",
        },
    ];

    const loadUserProfile = useCallback(async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                setUserProfile(null);
                return;
            }

            const profile = await getUserDoc(user.uid);
            setUserProfile(profile);

            // Check notification permissions
            const hasPermission = await askNotificationPermission();
            setNotificationsEnabled(hasPermission);
        } catch (error) {
            console.error("Error loading user profile:", error);
        } finally {
            setLoading(false);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadUserProfile();
        }, [loadUserProfile])
    );

    const handleLogout = async () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await logoutUser();
                            router.replace("/(auth)/login");
                        } catch (error) {
                            console.error("Logout error:", error);
                            Alert.alert("Error", "Failed to log out. Please try again.");
                        }
                    },
                },
            ]
        );
    };

    const handleNotificationToggle = async () => {
        try {
            const hasPermission = await askNotificationPermission();
            setNotificationsEnabled(hasPermission);

            if (hasPermission) {
                await setupNotifications();
                Alert.alert("Success", "Notifications have been enabled.");
            } else {
                Alert.alert(
                    "Notifications Disabled",
                    "You can enable notifications in your device settings.",
                    [{ text: "OK" }]
                );
            }
        } catch (error) {
            console.error("Error toggling notifications:", error);
            Alert.alert("Error", "Failed to update notification settings.");
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.loadingText}>Loading your profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!userProfile) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.authContainer}>
                    <Ionicons name="person-circle-outline" size={80} color="#D1D5DB" />
                    <Text style={styles.authTitle}>Welcome</Text>
                    <Text style={styles.authSubtitle}>
                        Sign in to access your profile and manage your account
                    </Text>
                    <TouchableOpacity
                        style={styles.signInButton}
                        onPress={() => router.replace("/(auth)/login")}
                    >
                        <Text style={styles.signInButtonText}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <Animated.ScrollView
                style={[styles.container, { opacity: fadeAnim }]}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <LinearGradient
                        colors={["#10B981", "#059669"]}
                        style={styles.profileGradient}
                    >
                        <View style={styles.profileContent}>
                            <View style={styles.avatarContainer}>
                                {userProfile.photoURL ? (
                                    <Image
                                        source={{ uri: userProfile.photoURL }}
                                        style={styles.avatar}
                                    />
                                ) : (
                                    <View style={styles.avatarFallback}>
                                        <Text style={styles.avatarInitial}>
                                            {userProfile.name?.charAt(0)?.toUpperCase() || "U"}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={styles.profileName}>{userProfile.name}</Text>
                                <Text style={styles.profileEmail}>{userProfile.email}</Text>
                                <Text style={styles.profilePhone}>{userProfile.phone || "No phone number"}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => router.push("/personal")}
                            >
                                <Ionicons name="create-outline" size={20} color="#10B981" />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>12</Text>
                        <Text style={styles.statLabel}>Total Pickups</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>2</Text>
                        <Text style={styles.statLabel}>Upcoming</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>10</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                </View>

                {/* Notification Toggle */}
                <View style={styles.notificationSection}>
                    <View style={styles.notificationHeader}>
                        <Ionicons name="notifications-outline" size={24} color="#111827" />
                        <View style={styles.notificationText}>
                            <Text style={styles.notificationTitle}>Push Notifications</Text>
                            <Text style={styles.notificationSubtitle}>
                                Receive updates about your pickups
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.toggleButton,
                            notificationsEnabled && styles.toggleButtonActive,
                        ]}
                        onPress={handleNotificationToggle}
                    >
                        <View
                            style={[
                                styles.toggleKnob,
                                notificationsEnabled && styles.toggleKnobActive,
                            ]}
                        />
                    </TouchableOpacity>
                </View>

                {/* Menu Items */}
                <View style={styles.menuSection}>
                    <Text style={styles.sectionTitle}>Account Settings</Text>
                    {menuItems.slice(0, 5).map((item, index) => (
                        <MenuItem key={item.title} item={item} index={index} />
                    ))}
                </View>

                <View style={styles.menuSection}>
                    <Text style={styles.sectionTitle}>Support & Legal</Text>
                    {menuItems.slice(5).map((item, index) => (
                        <MenuItem key={item.title} item={item} index={index} />
                    ))}
                </View>

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Text style={styles.appVersion}>WasteMaster v1.0.0</Text>
                    <Text style={styles.appCopyright}>© 2024 WasteMaster Inc.</Text>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <View style={styles.spacer} />
            </Animated.ScrollView>
        </SafeAreaView>
    );
}

const MenuItem = ({ item, index }: { item: MenuItem; index: number }) => {
    const router = useRouter();

    return (
        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
            delayPressIn={index * 50}
        >
            <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
            </View>
            <View style={styles.menuText}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F9FAFB",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: "#6B7280",
    },
    authContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    authTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
        marginTop: 16,
        marginBottom: 8,
    },
    authSubtitle: {
        fontSize: 16,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 32,
    },
    signInButton: {
        backgroundColor: "#10B981",
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
    },
    signInButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    profileHeader: {
        marginBottom: 20,
    },
    profileGradient: {
        paddingTop: 40,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    profileContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatarContainer: {
        marginRight: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: "rgba(255, 255, 255, 0.2)",
    },
    avatarFallback: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 4,
        borderColor: "rgba(255, 255, 255, 0.2)",
    },
    avatarInitial: {
        color: "#FFFFFF",
        fontSize: 32,
        fontWeight: "600",
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 24,
        fontWeight: "700",
        color: "#FFFFFF",
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 16,
        color: "rgba(255, 255, 255, 0.9)",
        marginBottom: 2,
    },
    profilePhone: {
        fontSize: 14,
        color: "rgba(255, 255, 255, 0.7)",
    },
    editButton: {
        backgroundColor: "#FFFFFF",
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    statsContainer: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 12,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    statItem: {
        flex: 1,
        alignItems: "center",
    },
    statNumber: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "500",
    },
    statDivider: {
        width: 1,
        backgroundColor: "#F3F4F6",
    },
    notificationSection: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 16,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    notificationHeader: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    notificationText: {
        marginLeft: 12,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 2,
    },
    notificationSubtitle: {
        fontSize: 14,
        color: "#6B7280",
    },
    toggleButton: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#E5E7EB",
        padding: 2,
    },
    toggleButtonActive: {
        backgroundColor: "#10B981",
    },
    toggleKnob: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#FFFFFF",
        transform: [{ translateX: 0 }],
    },
    toggleKnobActive: {
        transform: [{ translateX: 22 }],
    },
    menuSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginHorizontal: 20,
        marginBottom: 12,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        marginHorizontal: 20,
        marginBottom: 1,
        padding: 16,
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    menuText: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 2,
    },
    menuSubtitle: {
        fontSize: 14,
        color: "#6B7280",
    },
    appInfo: {
        alignItems: "center",
        marginBottom: 20,
    },
    appVersion: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 4,
    },
    appCopyright: {
        fontSize: 12,
        color: "#9CA3AF",
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#FECACA",
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#EF4444",
    },
    spacer: {
        height: 20,
    },
});