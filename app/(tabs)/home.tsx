// app/(tabs)/home.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "@/Firebase/firebaseConfig";
import { getUserDoc } from "@/services/authService";
import { getUserRequests, canEditRequest } from "@/services/requestService";
import { setupNotifications, sendLocalNotification } from "@/services/notificationService";
import { UserProfile, PickupRequest } from "@/types";
import { LinearGradient } from "expo-linear-gradient";

const MAX_UPCOMING = 3;

export default function HomeScreen() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<PickupRequest[]>([]);

  const loadData = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace("/(auth)/login");
        return;
      }

      // Load user profile and requests in parallel
      const [profileData, requestsData] = await Promise.all([
        getUserDoc(user.uid),
        getUserRequests(user.uid),
      ]);

      setUserProfile(profileData);
      setRequests(requestsData);

      // Setup notifications on first load
      if (requestsData.length === 0) {
        await setupNotifications();
      }
    } catch (error) {
      console.error("Home load error:", error);
      Alert.alert("Error", "Failed to load data. Please pull to refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
      useCallback(() => {
        loadData();
      }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const getStatusColor = (status: string): string => {
    const statusColors: { [key: string]: string } = {
      Pending: "#F59E0B",
      Assigned: "#3B82F6",
      InProgress: "#8B5CF6",
      Completed: "#10B981",
      Cancelled: "#EF4444",
    };
    return statusColors[status] || "#6B7280";
  };

  const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
    const statusIcons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      Pending: "time-outline",
      Assigned: "person-outline",
      InProgress: "build-outline",
      Completed: "checkmark-circle-outline",
      Cancelled: "close-circle-outline",
    };
    return statusIcons[status] || "help-outline";
  };

  const upcomingRequests = requests.filter(req =>
      ["Pending", "Assigned", "InProgress"].includes(req.status)
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const completedRequests = requests.filter(req => req.status === "Completed");
  const nextPickup = upcomingRequests[0];

  if (loading) {
    return (
        <SafeAreaView style={styles.safe}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Loading your dashboard...</Text>
          </View>
        </SafeAreaView>
    );
  }

  return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#10B981"]}
                  tintColor="#10B981"
              />
            }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                {userProfile?.photoURL ? (
                    <Image source={{ uri: userProfile.photoURL }} style={styles.avatar} />
                ) : (
                    <LinearGradient
                        colors={["#10B981", "#059669"]}
                        style={styles.avatarFallback}
                    >
                      <Text style={styles.avatarInitial}>
                        {userProfile?.name?.charAt(0)?.toUpperCase() || "U"}
                      </Text>
                    </LinearGradient>
                )}
              </View>
              <View style={styles.userText}>
                <Text style={styles.greeting}>Welcome back</Text>
                <Text style={styles.userName} numberOfLines={1}>
                  {userProfile?.name || "User"}
                </Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => router.push("/(tabs)/notifications")}
              >
                <Ionicons name="notifications-outline" size={24} color="#374151" />
              </TouchableOpacity>
              <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => router.push("/(tabs)/profile")}
              >
                <Ionicons name="settings-outline" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Card */}
          <LinearGradient
              colors={["#10B981", "#059669"]}
              style={styles.statsCard}
          >
            <View style={styles.statsContent}>
              <View style={styles.statsMain}>
                <Text style={styles.statsTitle}>Next Pickup</Text>
                {nextPickup ? (
                    <View>
                      <Text style={styles.nextPickupDateTime}>
                        {nextPickup.date} • {nextPickup.time}
                      </Text>
                      <Text style={styles.nextPickupAddress} numberOfLines={1}>
                        {nextPickup.address}
                      </Text>
                    </View>
                ) : (
                    <Text style={styles.noPickupText}>
                      No upcoming pickups
                    </Text>
                )}
              </View>
              <View style={styles.statsNumbers}>
                <Text style={styles.upcomingCount}>{upcomingRequests.length}</Text>
                <Text style={styles.upcomingLabel}>Upcoming</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                  style={styles.primaryAction}
                  onPress={() => router.push("/(tabs)/request")}
              >
                <LinearGradient
                    colors={["#10B981", "#059669"]}
                    style={styles.actionGradient}
                >
                  <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.primaryActionText}>Request Pickup</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                  style={styles.secondaryAction}
                  onPress={() => router.push("/(tabs)/history")}
              >
                <Ionicons name="calendar" size={20} color="#10B981" />
                <Text style={styles.secondaryActionText}>View History</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Upcoming Pickups */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Pickups</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/history")}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {upcomingRequests.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyStateTitle}>No upcoming pickups</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    Schedule your first waste pickup
                  </Text>
                  <TouchableOpacity
                      style={styles.emptyStateButton}
                      onPress={() => router.push("/(tabs)/request")}
                  >
                    <Text style={styles.emptyStateButtonText}>Schedule Pickup</Text>
                  </TouchableOpacity>
                </View>
            ) : (
                <>
                  {upcomingRequests.slice(0, MAX_UPCOMING).map((request) => (
                      <TouchableOpacity
                          key={request.id}
                          style={styles.requestCard}
                          onPress={() =>
                              router.push(`/requestDetails?id=${request.id}`)
                          }
                      >
                        <View style={styles.requestContent}>
                          <View style={styles.requestMain}>
                            <Text style={styles.requestDateTime}>
                              {request.date} • {request.time}
                            </Text>
                            <Text style={styles.requestAddress} numberOfLines={1}>
                              {request.address}
                            </Text>
                            <Text style={styles.requestType}>
                              {request.wasteType}
                            </Text>
                          </View>
                          <View style={styles.requestStatus}>
                            <View
                                style={[
                                  styles.statusBadge,
                                  { backgroundColor: `${getStatusColor(request.status)}20` },
                                ]}
                            >
                              <Ionicons
                                  name={getStatusIcon(request.status)}
                                  size={16}
                                  color={getStatusColor(request.status)}
                              />
                              <Text
                                  style={[
                                    styles.statusText,
                                    { color: getStatusColor(request.status) },
                                  ]}
                              >
                                {request.status}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                  ))}

                  {upcomingRequests.length > MAX_UPCOMING && (
                      <TouchableOpacity
                          style={styles.viewMoreCard}
                          onPress={() => router.push("/(tabs)/history")}
                      >
                        <Text style={styles.viewMoreText}>
                          View {upcomingRequests.length - MAX_UPCOMING} more upcoming pickups
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                      </TouchableOpacity>
                  )}
                </>
            )}
          </View>

          {/* Recent Activity */}
          {completedRequests.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Activity</Text>
                  <TouchableOpacity onPress={() => router.push("/(tabs)/history")}>
                    <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                </View>

                {completedRequests.slice(0, 3).map((request) => (
                    <View key={request.id} style={styles.recentActivityCard}>
                      <View style={styles.activityContent}>
                        <Text style={styles.activityDateTime}>
                          {request.date} • {request.time}
                        </Text>
                        <Text style={styles.activityAddress} numberOfLines={1}>
                          {request.address}
                        </Text>
                      </View>
                      <View style={styles.activityStatus}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      </View>
                    </View>
                ))}
              </View>
          )}

          <View style={styles.spacer} />
        </ScrollView>
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
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  userText: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  headerActions: {
    flexDirection: "row",
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  statsCard: {
    margin: 20,
    marginTop: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  statsContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsMain: {
    flex: 1,
  },
  statsTitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 8,
  },
  nextPickupDateTime: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  nextPickupAddress: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  noPickupText: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  statsNumbers: {
    alignItems: "flex-end",
  },
  upcomingCount: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  upcomingLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    marginTop: 4,
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  primaryAction: {
    flex: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  secondaryActionText: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeAllText: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  requestCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
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
  requestContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  requestMain: {
    flex: 1,
  },
  requestDateTime: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  requestAddress: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 6,
  },
  requestType: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  requestStatus: {
    marginLeft: 12,
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
  viewMoreCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  viewMoreText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "500",
  },
  recentActivityCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  activityContent: {
    flex: 1,
  },
  activityDateTime: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 2,
  },
  activityAddress: {
    fontSize: 13,
    color: "#6B7280",
  },
  activityStatus: {
    marginLeft: 12,
  },
  spacer: {
    height: 20,
  },
});