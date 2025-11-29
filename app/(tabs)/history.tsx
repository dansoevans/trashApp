// app/(tabs)/history.tsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    Animated,
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {router, useRouter} from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "@/Firebase/firebaseConfig";
import { getUserRequests } from "@/services/requestService";
import { PickupRequest, RequestStatus } from "@/types";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const INITIAL_LOAD_COUNT = 10;

type StatusFilter = "All" | RequestStatus;

export default function HistoryScreen() {
    const router = useRouter();
    const [requests, setRequests] = useState<PickupRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
    const [sortNewest, setSortNewest] = useState(true);
    const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD_COUNT);

    const fadeAnim = useState(new Animated.Value(0))[0];

    const loadRequests = useCallback(async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                setRequests([]);
                return;
            }

            const userRequests = await getUserRequests(user.uid);
            setRequests(userRequests);
        } catch (error) {
            console.error("Error loading requests:", error);
            setRequests([]);
        } finally {
            setLoading(false);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
        }
    }, []);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadRequests();
        setVisibleCount(INITIAL_LOAD_COUNT);
        setRefreshing(false);
    }, [loadRequests]);

    const getStatusColor = (status: RequestStatus): string => {
        const statusColors: Record<RequestStatus, string> = {
            Pending: "#F59E0B",
            Assigned: "#3B82F6",
            InProgress: "#8B5CF6",
            Completed: "#10B981",
            Cancelled: "#EF4444",
        };
        return statusColors[status];
    };

    const getStatusIcon = (status: RequestStatus): keyof typeof Ionicons.glyphMap => {
        const statusIcons: Record<RequestStatus, keyof typeof Ionicons.glyphMap> = {
            Pending: "time-outline",
            Assigned: "person-outline",
            InProgress: "build-outline",
            Completed: "checkmark-circle-outline",
            Cancelled: "close-circle-outline",
        };
        return statusIcons[status];
    };

    // Calculate status counts
    const statusCounts = useMemo(() => {
        const counts = {
            Pending: 0,
            Assigned: 0,
            InProgress: 0,
            Completed: 0,
            Cancelled: 0,
            All: requests.length,
        };

        requests.forEach((request) => {
            if (request.status in counts) {
                counts[request.status as keyof typeof counts]++;
            }
        });

        return counts;
    }, [requests]);

    // Filter and sort requests
    const filteredRequests = useMemo(() => {
        let filtered = requests.filter((request) => {
            // Status filter
            if (statusFilter !== "All" && request.status !== statusFilter) {
                return false;
            }

            // Search filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                return (
                    request.address.toLowerCase().includes(query) ||
                    request.wasteType.toLowerCase().includes(query) ||
                    request.userName.toLowerCase().includes(query)
                );
            }

            return true;
        });

        // Sort by date
        filtered.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`).getTime();
            const dateB = new Date(`${b.date}T${b.time}`).getTime();
            return sortNewest ? dateB - dateA : dateA - dateB;
        });

        return filtered;
    }, [requests, statusFilter, searchQuery, sortNewest]);

    const displayedRequests = filteredRequests.slice(0, visibleCount);

// app/(tabs)/history.tsx (continued)
    const renderRequestCard = ({ item }: { item: PickupRequest }) => (
        <TouchableOpacity
            style={styles.requestCard}
            onPress={() => router.push({ pathname: "/requestDetails", params: { id: item.id } })}
            activeOpacity={0.8}
        >
            <View style={styles.requestHeader}>
                <View style={styles.requestMainInfo}>
                    <Text style={styles.requestDate}>
                        {new Date(item.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                        })}
                    </Text>
                    <Text style={styles.requestTime}>{item.time}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
                    <Ionicons
                        name={getStatusIcon(item.status)}
                        size={16}
                        color={getStatusColor(item.status)}
                    />
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status}
                    </Text>
                </View>
            </View>

            <Text style={styles.requestAddress} numberOfLines={2}>
                {item.address}
            </Text>

            <View style={styles.requestFooter}>
                <View style={styles.wasteTypeTag}>
                    <Ionicons
                        name={
                            item.wasteType === "Household" ? "home-outline" :
                                item.wasteType === "Plastic" ? "water-outline" :
                                    item.wasteType === "Organic" ? "leaf-outline" :
                                        item.wasteType === "Paper" ? "document-text-outline" :
                                            item.wasteType === "Electronic" ? "hardware-chip-outline" :
                                                "warning-outline"
                        }
                        size={14}
                        color="#6B7280"
                    />
                    <Text style={styles.wasteTypeText}>{item.wasteType}</Text>
                </View>
                <Text style={styles.requestId}>#{item.id.slice(-6)}</Text>
            </View>

            {item.notes && (
                <View style={styles.notesContainer}>
                    <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
                    <Text style={styles.notesText} numberOfLines={2}>
                        {item.notes}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No Pickups Found</Text>
            <Text style={styles.emptyStateSubtitle}>
                {searchQuery || statusFilter !== "All"
                    ? "Try adjusting your search or filters"
                    : "Schedule your first waste pickup to get started"}
            </Text>
            {!searchQuery && statusFilter === "All" && (
                <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => router.push("/(tabs)/request")}
                >
                    <Text style={styles.emptyStateButtonText}>Schedule Pickup</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderFooter = () => {
        if (filteredRequests.length <= visibleCount) return null;

        return (
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={() => setVisibleCount(prev => prev + INITIAL_LOAD_COUNT)}
                >
                    <Text style={styles.loadMoreText}>
                        Load More ({filteredRequests.length - visibleCount} remaining)
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.loadingText}>Loading your pickup history...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Pickup History</Text>
                        <Text style={styles.subtitle}>
                            {requests.length} total pickups
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.sortButton}
                        onPress={() => setSortNewest(!sortNewest)}
                    >
                        <Ionicons
                            name={sortNewest ? "arrow-down" : "arrow-up"}
                            size={16}
                            color="#6B7280"
                        />
                        <Text style={styles.sortText}>
                            {sortNewest ? "Newest" : "Oldest"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by address, waste type..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        clearButtonMode="while-editing"
                    />
                </View>

                {/* Status Filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filtersContainer}
                    contentContainerStyle={styles.filtersContent}
                >
                    {(["All", "Pending", "Completed", "Cancelled"] as StatusFilter[]).map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[
                                styles.filterChip,
                                statusFilter === status && styles.filterChipActive,
                            ]}
                            onPress={() => {
                                setStatusFilter(status);
                                setVisibleCount(INITIAL_LOAD_COUNT);
                            }}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    statusFilter === status && styles.filterChipTextActive,
                                ]}
                            >
                                {status}
                            </Text>
                            <View
                                style={[
                                    styles.filterCount,
                                    statusFilter === status && styles.filterCountActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.filterCountText,
                                        statusFilter === status && styles.filterCountTextActive,
                                    ]}
                                >
                                    {statusCounts[status]}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Requests List */}
                <FlatList
                    data={displayedRequests}
                    keyExtractor={(item) => item.id}
                    renderItem={renderRequestCard}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyState}
                    ListFooterComponent={renderFooter}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#10B981"]}
                            tintColor="#10B981"
                        />
                    }
                />
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    container: {
        flex: 1,
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
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
    },
    subtitle: {
        fontSize: 14,
        color: "#6B7280",
        marginTop: 4,
    },
    sortButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        gap: 6,
    },
    sortText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        marginHorizontal: 20,
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: "#111827",
    },
    filtersContainer: {
        marginBottom: 16,
    },
    filtersContent: {
        paddingHorizontal: 20,
        gap: 8,
    },
    filterChip: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        gap: 8,
    },
    filterChipActive: {
        backgroundColor: "#10B981",
        borderColor: "#10B981",
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
    },
    filterChipTextActive: {
        color: "#FFFFFF",
    },
    filterCount: {
        backgroundColor: "#F3F4F6",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
    },
    filterCountActive: {
        backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    filterCountText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#6B7280",
        textAlign: "center",
    },
    filterCountTextActive: {
        color: "#FFFFFF",
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexGrow: 1,
    },
    requestCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    requestHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    requestMainInfo: {
        flex: 1,
    },
    requestDate: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 2,
    },
    requestTime: {
        fontSize: 14,
        color: "#6B7280",
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
    },
    requestAddress: {
        fontSize: 14,
        color: "#374151",
        lineHeight: 20,
        marginBottom: 12,
    },
    requestFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    wasteTypeTag: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    wasteTypeText: {
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "500",
    },
    requestId: {
        fontSize: 12,
        color: "#9CA3AF",
        fontWeight: "500",
    },
    notesContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#F0F9FF",
        padding: 8,
        borderRadius: 6,
        marginTop: 8,
        gap: 6,
    },
    notesText: {
        flex: 1,
        fontSize: 12,
        color: "#0369A1",
        lineHeight: 16,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#374151",
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateSubtitle: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 20,
    },
    emptyStateButton: {
        backgroundColor: "#10B981",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    emptyStateButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "600",
    },
    footer: {
        alignItems: "center",
        paddingVertical: 20,
    },
    loadMoreButton: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    loadMoreText: {
        color: "#10B981",
        fontSize: 14,
        fontWeight: "600",
    },
});