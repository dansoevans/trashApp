// app/(tabs)/notifications.tsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Animated,
    Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
    AppNotification,
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    subscribeToNotifications,
    askNotificationPermission,
    setupNotifications,
    getUnreadNotificationCount
} from "@/services/notificationService";
import { auth } from "@/Firebase/firebaseConfig";

const GROUPED_SECTIONS = {
    today: 'Today',
    yesterday: 'Yesterday',
    week: 'This Week',
    older: 'Older'
};

type GroupKey = keyof typeof GROUPED_SECTIONS;

export default function NotificationsScreen() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fadeAnim = useState(new Animated.Value(0))[0];

    const loadNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) {
                console.log('No user found');
                setNotifications([]);
                return;
            }

            console.log('Loading notifications for user:', user.uid);
            const userNotifications = await getUserNotifications();
            console.log('Loaded notifications:', userNotifications.length);
            setNotifications(userNotifications);

            // Calculate unread count
            const unread = userNotifications.filter(n => !n.read).length;
            setUnreadCount(unread);

            // Check notification permissions
            const hasPermission = await askNotificationPermission();
            setNotificationsEnabled(hasPermission);
        } catch (error) {
            console.error('Error loading notifications:', error);
            Alert.alert('Error', 'Failed to load notifications');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const initializeScreen = async () => {
            await loadNotifications();

            // Set up real-time listener
            const unsubscribe = subscribeToNotifications((newNotifications) => {
                console.log('Real-time update:', newNotifications.length);
                setNotifications(newNotifications);
                const unread = newNotifications.filter(n => !n.read).length;
                setUnreadCount(unread);
            });

            return unsubscribe;
        };

        initializeScreen();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadNotifications();
        }, [loadNotifications])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    }, [loadNotifications]);

    const handleNotificationToggle = async () => {
        try {
            const hasPermission = await askNotificationPermission();
            setNotificationsEnabled(hasPermission);

            if (hasPermission) {
                await setupNotifications();
                Alert.alert('Success', 'Notifications have been enabled');
            } else {
                Alert.alert(
                    'Notifications Disabled',
                    'You can enable notifications in your device settings.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Error toggling notifications:', error);
            Alert.alert('Error', 'Failed to update notification settings');
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await markNotificationAsRead(notificationId);
            // The real-time listener will update the state
        } catch (error) {
            console.error('Error marking notification as read:', error);
            Alert.alert('Error', 'Failed to mark notification as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllNotificationsAsRead();
            // The real-time listener will update the state
        } catch (error) {
            console.error('Error marking all as read:', error);
            Alert.alert('Error', 'Failed to mark all as read');
        }
    };

    const handleNotificationPress = async (notification: AppNotification) => {
        // Mark as read when pressed
        if (!notification.read) {
            await handleMarkAsRead(notification.id);
        }

        // Handle navigation based on notification type
        if (notification.data?.requestId) {
            router.push(`/requestDetails?id=${notification.data.requestId}`);
        } else if (notification.type === 'pickup') {
            router.push("/(tabs)/history");
        }
    };

    const groupNotifications = (notifs: AppNotification[]) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const groups: Record<GroupKey, AppNotification[]> = {
            today: [],
            yesterday: [],
            week: [],
            older: []
        };

        notifs.forEach(notification => {
            let notificationDate: Date;

            if (notification.createdAt && typeof notification.createdAt.toDate === 'function') {
                notificationDate = notification.createdAt.toDate();
            } else if (notification.createdAt) {
                notificationDate = new Date(notification.createdAt);
            } else {
                notificationDate = new Date();
            }

            if (notificationDate >= today) {
                groups.today.push(notification);
            } else if (notificationDate >= yesterday) {
                groups.yesterday.push(notification);
            } else if (notificationDate >= weekAgo) {
                groups.week.push(notification);
            } else {
                groups.older.push(notification);
            }
        });

        return groups;
    };

    const getNotificationIcon = (type: AppNotification['type']) => {
        switch (type) {
            case 'pickup':
                return 'cube-outline';
            case 'reminder':
                return 'time-outline';
            case 'status':
                return 'sync-outline';
            case 'system':
                return 'settings-outline';
            case 'promo':
                return 'megaphone-outline';
            default:
                return 'notifications-outline';
        }
    };

    const getNotificationColor = (type: AppNotification['type']) => {
        switch (type) {
            case 'pickup':
                return '#16a34a';
            case 'reminder':
                return '#f59e0b';
            case 'status':
                return '#3b82f6';
            case 'system':
                return '#6b7280';
            case 'promo':
                return '#8b5cf6';
            default:
                return '#16a34a';
        }
    };

    const renderNotificationItem = ({ item }: { item: AppNotification }) => (
        <TouchableOpacity
            style={[
                styles.notificationItem,
                !item.read && styles.unreadNotification,
            ]}
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.notificationIcon}>
                <View style={[styles.iconContainer, { backgroundColor: `${getNotificationColor(item.type)}15` }]}>
                    <Ionicons
                        name={getNotificationIcon(item.type)}
                        size={20}
                        color={getNotificationColor(item.type)}
                    />
                </View>
            </View>
            <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <Text style={styles.notificationBody}>{item.body}</Text>
                <Text style={styles.notificationTime}>
                    {formatNotificationTime(item)}
                </Text>
            </View>
            {!item.read && (
                <View style={styles.unreadIndicator} />
            )}
        </TouchableOpacity>
    );

    const renderSection = (title: string, data: AppNotification[]) => {
        if (data.length === 0) return null;

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {data.map((item) => (
                    <View key={item.id}>
                        {renderNotificationItem({ item })}
                    </View>
                ))}
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#16a34a" />
                    <Text style={styles.loadingText}>Loading notifications...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const groupedNotifications = groupNotifications(notifications);
    const hasNotifications = notifications.length > 0;

    return (
        <SafeAreaView style={styles.safe}>
            <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Notifications</Text>
                        <Text style={styles.subtitle}>
                            {unreadCount > 0
                                ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                                : 'All caught up!'
                            }
                        </Text>
                    </View>
                    {hasNotifications && unreadCount > 0 && (
                        <TouchableOpacity
                            style={styles.markAllButton}
                            onPress={handleMarkAllAsRead}
                        >
                            <Text style={styles.markAllText}>
                                Mark all read
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Notification Settings */}
                <View style={styles.settingsCard}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="notifications-outline" size={24} color="#0f172a" />
                            <View style={styles.settingText}>
                                <Text style={styles.settingTitle}>Push Notifications</Text>
                                <Text style={styles.settingSubtitle}>
                                    Receive updates about your pickups
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={handleNotificationToggle}
                            trackColor={{ false: '#e2e8f0', true: '#16a34a' }}
                            thumbColor="#ffffff"
                        />
                    </View>
                </View>

                {/* Notifications List */}
                {hasNotifications ? (
                    <FlatList
                        data={[]}
                        renderItem={null}
                        keyExtractor={() => 'sections'}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={["#16a34a"]}
                                tintColor="#16a34a"
                            />
                        }
                        ListHeaderComponent={
                            <View style={styles.sectionsContainer}>
                                {renderSection(GROUPED_SECTIONS.today, groupedNotifications.today)}
                                {renderSection(GROUPED_SECTIONS.yesterday, groupedNotifications.yesterday)}
                                {renderSection(GROUPED_SECTIONS.week, groupedNotifications.week)}
                                {renderSection(GROUPED_SECTIONS.older, groupedNotifications.older)}
                            </View>
                        }
                    />
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off-outline" size={64} color="#d1d5db" />
                        <Text style={styles.emptyStateTitle}>No notifications yet</Text>
                        <Text style={styles.emptyStateSubtitle}>
                            You'll see important updates about your pickups here
                        </Text>
                        <TouchableOpacity
                            style={styles.emptyStateButton}
                            onPress={() => router.push("/(tabs)/request")}
                        >
                            <Text style={styles.emptyStateButtonText}>Schedule a Pickup</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Animated.View>
        </SafeAreaView>
    );
}

// Helper function to format notification time
function formatNotificationTime(notification: AppNotification): string {
    let date: Date;

    if (notification.createdAt && typeof notification.createdAt.toDate === 'function') {
        date = notification.createdAt.toDate();
    } else if (notification.createdAt) {
        date = new Date(notification.createdAt);
    } else {
        date = new Date();
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8fafc",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: "#6b7280",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#0f172a",
    },
    subtitle: {
        fontSize: 16,
        color: "#64748b",
        marginTop: 4,
    },
    markAllButton: {
        padding: 8,
    },
    markAllText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#16a34a",
    },
    settingsCard: {
        backgroundColor: "#ffffff",
        marginHorizontal: 20,
        marginVertical: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    settingRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    settingInfo: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    settingText: {
        marginLeft: 12,
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#0f172a",
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 14,
        color: "#64748b",
    },
    listContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    sectionsContainer: {
        paddingHorizontal: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 12,
    },
    notificationItem: {
        flexDirection: "row",
        backgroundColor: "#ffffff",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        marginBottom: 8,
        position: "relative",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    unreadNotification: {
        backgroundColor: "#f0fdf4",
        borderColor: "#dcfce7",
    },
    notificationIcon: {
        marginRight: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#0f172a",
        marginBottom: 4,
    },
    notificationBody: {
        fontSize: 14,
        color: "#64748b",
        lineHeight: 20,
        marginBottom: 8,
    },
    notificationTime: {
        fontSize: 12,
        color: "#94a3b8",
        fontWeight: "500",
    },
    unreadIndicator: {
        position: "absolute",
        top: 16,
        right: 16,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#16a34a",
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: "#374151",
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateSubtitle: {
        fontSize: 16,
        color: "#6b7280",
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 24,
    },
    emptyStateButton: {
        backgroundColor: "#16a34a",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    emptyStateButtonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "600",
    },
});