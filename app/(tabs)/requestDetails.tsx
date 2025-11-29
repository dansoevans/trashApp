// app/(tabs)/requestDetails.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Animated,
    RefreshControl,
    Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { auth, db } from "@/Firebase/firebaseConfig";
import {
    getRequestById,
    updateRequest,
    cancelRequest,
    getBookedTimes,
    canCancelRequest,
    canEditRequest,
    rescheduleRequest
} from "@/services/requestService";
import { sendLocalNotification } from "@/services/notificationService";
import { PickupRequest, WasteType, RequestStatus } from "@/types";
import { LinearGradient } from "expo-linear-gradient";

const TIME_START = 8;
const TIME_END = 18;

export default function RequestDetailsScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [request, setRequest] = useState<PickupRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Editing state
    const [editing, setEditing] = useState(false);
    const [newDate, setNewDate] = useState("");
    const [newTime, setNewTime] = useState("");
    const [bookedTimes, setBookedTimes] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Modals
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showRescheduleConfirm, setShowRescheduleConfirm] = useState(false);

    const fadeAnim = new Animated.Value(0);
    const slideAnim = new Animated.Value(20);

    const loadRequest = useCallback(async () => {
        if (!id) {
            Alert.alert("Error", "No request ID provided.");
            router.back();
            return;
        }

        try {
            setLoading(true);
            const requestData = await getRequestById(id);

            if (!requestData) {
                Alert.alert("Not Found", "This pickup request could not be found.");
                router.back();
                return;
            }

            setRequest(requestData);

            // Initialize editing state with current values
            setNewDate(requestData.date);
            setNewTime(requestData.time);

            // Start animations
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
        } catch (error) {
            console.error("Error loading request:", error);
            Alert.alert("Error", "Failed to load request details. Please try again.");
            router.back();
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadRequest();
    }, [loadRequest]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadRequest();
        setRefreshing(false);
    }, [loadRequest]);

    // Load booked times when date changes for editing
    useEffect(() => {
        const loadBookedSlots = async () => {
            if (!newDate || !editing) return;

            setLoadingSlots(true);
            try {
                const booked = await getBookedTimes(newDate);
                setBookedTimes(booked);
            } catch (error) {
                console.error("Error loading booked times:", error);
                setBookedTimes([]);
            } finally {
                setLoadingSlots(false);
            }
        };

        loadBookedSlots();
    }, [newDate, editing]);

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

    const getWasteTypeIcon = (wasteType: WasteType): keyof typeof Ionicons.glyphMap => {
        const wasteIcons: Record<WasteType, keyof typeof Ionicons.glyphMap> = {
            Household: "home-outline",
            Plastic: "water-outline",
            Organic: "leaf-outline",
            Paper: "document-text-outline",
            Electronic: "hardware-chip-outline",
            Hazardous: "warning-outline",
        };
        return wasteIcons[wasteType];
    };

    const handleReschedule = async () => {
        if (!request || !newDate || !newTime) {
            Alert.alert("Missing Information", "Please select both a date and time.");
            return;
        }

        // Check if the new slot is the same as current
        if (newDate === request.date && newTime === request.time) {
            Alert.alert("No Changes", "The selected date and time are the same as the current schedule.");
            return;
        }

        // Check if the new slot is available
        if (bookedTimes.includes(newTime) && !(newDate === request.date && newTime === request.time)) {
            Alert.alert("Slot Unavailable", "The selected time slot is already booked. Please choose a different time.");
            return;
        }

        setActionLoading(true);
        try {
            await rescheduleRequest(request.id, newDate, newTime, "User requested reschedule");

            // Refresh the request data
            const updatedRequest = await getRequestById(request.id);
            setRequest(updatedRequest);

            setEditing(false);
            setShowRescheduleConfirm(false);

            await sendLocalNotification(
                "Pickup Rescheduled ✅",
                `Your ${request.wasteType} pickup has been rescheduled to ${newDate} at ${newTime}.`
            );

            Alert.alert("Success", "Your pickup has been rescheduled successfully.");
        } catch (error: any) {
            console.error("Error rescheduling request:", error);
            Alert.alert("Error", error.message || "Failed to reschedule pickup. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!request) return;

        setActionLoading(true);
        try {
            await cancelRequest(request.id, {
                cancelledBy: auth.currentUser?.uid || "user",
                reason: "User requested cancellation",
            });

            // Refresh the request data
            const updatedRequest = await getRequestById(request.id);
            setRequest(updatedRequest);

            setShowCancelConfirm(false);

            await sendLocalNotification(
                "Pickup Cancelled ❌",
                `Your ${request.wasteType} pickup scheduled for ${request.date} has been cancelled.`
            );

            Alert.alert("Cancelled", "Your pickup has been cancelled successfully.");
        } catch (error: any) {
            console.error("Error cancelling request:", error);
            Alert.alert("Error", error.message || "Failed to cancel pickup. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    const startEditing = () => {
        setEditing(true);
        setNewDate(request?.date || "");
        setNewTime(request?.time || "");
    };

    const cancelEditing = () => {
        setEditing(false);
        setNewDate(request?.date || "");
        setNewTime(request?.time || "");
    };

    // Generate time slots
    const timeSlots = Array.from(
        { length: Math.floor((TIME_END - TIME_START) / 1) + 1 },
        (_, i) => {
            const hour = TIME_START + i * 1;
            const label = hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;
            return label;
        }
    );

    const isSlotBooked = (slot: string) => bookedTimes.includes(slot);
    const isSlotSelected = (slot: string) => newTime === slot;

    if (loading) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.loadingText}>Loading pickup details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!request) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.errorContainer}>
                    <Ionicons name="warning" size={64} color="#EF4444" />
                    <Text style={styles.errorTitle}>Request Not Found</Text>
                    <Text style={styles.errorSubtitle}>
                        The pickup request you're looking for doesn't exist or has been removed.
                    </Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoid}
            >
                <Animated.ScrollView
                    style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
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
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                            disabled={actionLoading}
                        >
                            <Ionicons name="chevron-back" size={24} color="#111827" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Pickup Details</Text>
                        <View style={styles.headerSpacer} />
                    </View>

                    {/* Status Card */}
                    <View style={styles.statusCard}>
                        <LinearGradient
                            colors={["#10B981", "#059669"]}
                            style={styles.statusGradient}
                        >
                            <View style={styles.statusContent}>
                                <View style={styles.statusIconContainer}>
                                    <Ionicons
                                        name={getStatusIcon(request.status)}
                                        size={32}
                                        color="#FFFFFF"
                                    />
                                </View>
                                <View style={styles.statusText}>
                                    <Text style={styles.statusTitle}>Status</Text>
                                    <Text style={styles.statusValue}>{request.status}</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Pickup Information */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Pickup Information</Text>

                        <InfoRow
                            icon="calendar"
                            label="Date"
                            value={new Date(request.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        />

                        <InfoRow
                            icon="time"
                            label="Time"
                            value={request.time}
                        />

                        <InfoRow
                            icon={getWasteTypeIcon(request.wasteType)}
                            label="Waste Type"
                            value={request.wasteType}
                        />

                        {request.notes && (
                            <InfoRow
                                icon="document-text"
                                label="Special Instructions"
                                value={request.notes}
                                multiline
                            />
                        )}
                    </View>

                    {/* Location Information */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Location</Text>

                        <InfoRow
                            icon="location"
                            label="Address"
                            value={request.address}
                            multiline
                        />

                        <InfoRow
                            icon="call"
                            label="Contact Phone"
                            value={request.phone}
                        />
                    </View>

                    {/* Request Metadata */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Request Details</Text>

                        <InfoRow
                            icon="person"
                            label="Requested By"
                            value={request.userName}
                        />

                        <InfoRow
                            icon="information-circle"
                            label="Request ID"
                            value={`#${request.id.slice(-8).toUpperCase()}`}
                        />

                        {request.createdAt && (
                            <InfoRow
                                icon="calendar"
                                label="Submitted On"
                                value={new Date(request.createdAt.toDate()).toLocaleDateString()}
                            />
                        )}
                    </View>

                    {/* Editing Interface */}
                    {editing && (
                        <View style={styles.editingSection}>
                            <Text style={styles.sectionTitle}>Reschedule Pickup</Text>

                            {/* Date Selection */}
                            <View style={styles.editField}>
                                <Text style={styles.editLabel}>Select New Date</Text>
                                <View style={styles.calendarContainer}>
                                    <Calendar
                                        onDayPress={(day) => setNewDate(day.dateString)}
                                        markedDates={{
                                            [newDate]: {
                                                selected: true,
                                                selectedColor: "#10B981",
                                                selectedTextColor: "#FFFFFF",
                                            },
                                        }}
                                        minDate={new Date().toISOString().split("T")[0]}
                                        theme={{
                                            backgroundColor: "#FFFFFF",
                                            calendarBackground: "#FFFFFF",
                                            textSectionTitleColor: "#6B7280",
                                            selectedDayBackgroundColor: "#10B981",
                                            selectedDayTextColor: "#FFFFFF",
                                            todayTextColor: "#10B981",
                                            dayTextColor: "#111827",
                                            textDisabledColor: "#D1D5DB",
                                            arrowColor: "#10B981",
                                            monthTextColor: "#111827",
                                        }}
                                    />
                                </View>
                            </View>

                            {/* Time Selection */}
                            {newDate && (
                                <View style={styles.editField}>
                                    <View style={styles.timeHeader}>
                                        <Text style={styles.editLabel}>Select Time Slot</Text>
                                        {loadingSlots && (
                                            <ActivityIndicator size="small" color="#10B981" />
                                        )}
                                    </View>

                                    <View style={styles.timeGrid}>
                                        {timeSlots.map((slot) => {
                                            const booked = isSlotBooked(slot);
                                            const selected = isSlotSelected(slot);
                                            const isCurrentSlot = request.date === newDate && request.time === slot;

                                            return (
                                                <TouchableOpacity
                                                    key={slot}
                                                    style={[
                                                        styles.timeSlot,
                                                        booked && styles.timeSlotBooked,
                                                        selected && styles.timeSlotSelected,
                                                        isCurrentSlot && styles.timeSlotCurrent,
                                                    ]}
                                                    onPress={() => !booked && setNewTime(slot)}
                                                    disabled={booked && !isCurrentSlot}
                                                >
                                                    {booked ? (
                                                        <>
                                                            <Ionicons
                                                                name={isCurrentSlot ? "information-circle" : "close-circle"}
                                                                size={16}
                                                                color={isCurrentSlot ? "#10B981" : "#9CA3AF"}
                                                            />
                                                            <Text style={[
                                                                styles.timeSlotText,
                                                                booked && styles.timeSlotTextBooked,
                                                                isCurrentSlot && styles.timeSlotTextCurrent,
                                                            ]}>
                                                                {slot}
                                                            </Text>
                                                            <Text style={styles.bookedLabel}>
                                                                {isCurrentSlot ? "Current" : "Booked"}
                                                            </Text>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Ionicons
                                                                name={selected ? "checkmark-circle" : "time-outline"}
                                                                size={16}
                                                                color={selected ? "#FFFFFF" : "#6B7280"}
                                                            />
                                                            <Text style={[
                                                                styles.timeSlotText,
                                                                selected && styles.timeSlotTextSelected,
                                                            ]}>
                                                                {slot}
                                                            </Text>
                                                        </>
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            {/* Editing Actions */}
                            <View style={styles.editActions}>
                                <TouchableOpacity
                                    style={styles.cancelEditButton}
                                    onPress={cancelEditing}
                                    disabled={actionLoading}
                                >
                                    <Text style={styles.cancelEditText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.confirmEditButton,
                                        (!newDate || !newTime) && styles.confirmEditButtonDisabled,
                                    ]}
                                    onPress={() => setShowRescheduleConfirm(true)}
                                    disabled={!newDate || !newTime || actionLoading}
                                >
                                    {actionLoading ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <Text style={styles.confirmEditText}>Confirm Reschedule</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Action Buttons (when not editing) */}
                    {!editing && (
                        <View style={styles.actionsSection}>
                            {canEditRequest(request) && (
                                <TouchableOpacity
                                    style={styles.primaryAction}
                                    onPress={startEditing}
                                    disabled={actionLoading}
                                >
                                    <Ionicons name="calendar" size={20} color="#FFFFFF" />
                                    <Text style={styles.primaryActionText}>Reschedule Pickup</Text>
                                </TouchableOpacity>
                            )}

                            {canCancelRequest(request) && (
                                <TouchableOpacity
                                    style={styles.secondaryAction}
                                    onPress={() => setShowCancelConfirm(true)}
                                    disabled={actionLoading}
                                >
                                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                                    <Text style={styles.secondaryActionText}>Cancel Pickup</Text>
                                </TouchableOpacity>
                            )}

                            {(request.status === "Completed" || request.status === "Cancelled") && (
                                <TouchableOpacity
                                    style={styles.tertiaryAction}
                                    onPress={() => router.push("/(tabs)/request")}
                                >
                                    <Ionicons name="add-circle" size={20} color="#10B981" />
                                    <Text style={styles.tertiaryActionText}>Schedule New Pickup</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    <View style={styles.spacer} />
                </Animated.ScrollView>
            </KeyboardAvoidingView>

            {/* Reschedule Confirmation Modal */}
            <Modal
                visible={showRescheduleConfirm}
                animationType="slide"
                transparent
                statusBarTranslucent
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.confirmationModal}>
                        <Text style={styles.modalTitle}>Confirm Reschedule</Text>

                        <View style={styles.modalContent}>
                            <Text style={styles.modalText}>
                                Are you sure you want to reschedule your pickup?
                            </Text>

                            <View style={styles.changeDetails}>
                                <Text style={styles.changeLabel}>From:</Text>
                                <Text style={styles.changeValue}>
                                    {request.date} at {request.time}
                                </Text>

                                <Text style={styles.changeLabel}>To:</Text>
                                <Text style={styles.changeValue}>
                                    {newDate} at {newTime}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancel}
                                onPress={() => setShowRescheduleConfirm(false)}
                                disabled={actionLoading}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalConfirm}
                                onPress={handleReschedule}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <Text style={styles.modalConfirmText}>Confirm</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Cancel Confirmation Modal */}
            <Modal
                visible={showCancelConfirm}
                animationType="slide"
                transparent
                statusBarTranslucent
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.confirmationModal}>
                        <Ionicons name="warning" size={48} color="#EF4444" style={styles.warningIcon} />

                        <Text style={styles.modalTitle}>Cancel Pickup</Text>

                        <View style={styles.modalContent}>
                            <Text style={styles.modalText}>
                                Are you sure you want to cancel this pickup? This action cannot be undone.
                            </Text>

                            <View style={styles.cancelDetails}>
                                <Text style={styles.cancelDetail}>
                                    {request.wasteType} pickup on {request.date} at {request.time}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancel}
                                onPress={() => setShowCancelConfirm(false)}
                                disabled={actionLoading}
                            >
                                <Text style={styles.modalCancelText}>Keep Pickup</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalConfirm, styles.modalConfirmDanger]}
                                onPress={handleCancel}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <Text style={styles.modalConfirmText}>Cancel Pickup</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// Helper component for info rows
const InfoRow = ({
                     icon,
                     label,
                     value,
                     multiline = false
                 }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    multiline?: boolean;
}) => (
    <View style={styles.infoRow}>
        <View style={styles.infoIcon}>
            <Ionicons name={icon} size={20} color="#6B7280" />
        </View>
        <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={[styles.infoValue, multiline && styles.infoValueMultiline]}>
                {value}
            </Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    keyboardAvoid: {
        flex: 1,
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
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#F9FAFB",
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        marginTop: 16,
        marginBottom: 8,
    },
    errorSubtitle: {
        fontSize: 16,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 24,
    },
    backButton: {
        backgroundColor: "#10B981",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
    },
    headerSpacer: {
        width: 24,
    },
    statusCard: {
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    statusGradient: {
        padding: 20,
    },
    statusContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    statusIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    statusText: {
        flex: 1,
    },
    statusTitle: {
        fontSize: 14,
        color: "rgba(255, 255, 255, 0.9)",
        marginBottom: 4,
    },
    statusValue: {
        fontSize: 24,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    section: {
        backgroundColor: "#FFFFFF",
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    infoIcon: {
        width: 40,
        alignItems: "center",
        marginTop: 2,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 4,
        fontWeight: "500",
    },
    infoValue: {
        fontSize: 16,
        color: "#111827",
        fontWeight: "500",
    },
    infoValueMultiline: {
        lineHeight: 20,
    },
    editingSection: {
        backgroundColor: "#FFFFFF",
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    editField: {
        marginBottom: 20,
    },
    editLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 12,
    },
    timeHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    calendarContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        overflow: "hidden",
    },
    timeGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    timeSlot: {
        width: "30%",
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: "#FFFFFF",
        gap: 6,
    },
    timeSlotBooked: {
        backgroundColor: "#F9FAFB",
        borderColor: "#F3F4F6",
    },
    timeSlotSelected: {
        backgroundColor: "#10B981",
        borderColor: "#10B981",
    },
    timeSlotCurrent: {
        borderColor: "#10B981",
        backgroundColor: "#F0FDF4",
    },
    timeSlotText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#374151",
        flex: 1,
    },
    timeSlotTextSelected: {
        color: "#FFFFFF",
    },
    timeSlotTextBooked: {
        color: "#9CA3AF",
        textDecorationLine: "line-through",
    },
    timeSlotTextCurrent: {
        color: "#10B981",
    },
    bookedLabel: {
        fontSize: 10,
        color: "#EF4444",
        fontWeight: "600",
    },
    editActions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 8,
    },
    cancelEditButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        alignItems: "center",
    },
    cancelEditText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#6B7280",
    },
    confirmEditButton: {
        flex: 2,
        backgroundColor: "#10B981",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },
    confirmEditButtonDisabled: {
        opacity: 0.6,
    },
    confirmEditText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    actionsSection: {
        backgroundColor: "#FFFFFF",
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        gap: 12,
    },
    primaryAction: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#10B981",
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    primaryActionText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    secondaryAction: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#EF4444",
        gap: 8,
    },
    secondaryActionText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#EF4444",
    },
    tertiaryAction: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F0FDF4",
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#10B981",
        gap: 8,
    },
    tertiaryActionText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#10B981",
    },
    spacer: {
        height: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    confirmationModal: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 24,
        width: "100%",
        maxWidth: 400,
    },
    warningIcon: {
        alignSelf: "center",
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        textAlign: "center",
        marginBottom: 16,
    },
    modalContent: {
        marginBottom: 24,
    },
    modalText: {
        fontSize: 16,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 16,
    },
    changeDetails: {
        backgroundColor: "#F9FAFB",
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    changeLabel: {
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "600",
        marginBottom: 4,
    },
    changeValue: {
        fontSize: 16,
        color: "#111827",
        fontWeight: "500",
        marginBottom: 12,
    },
    cancelDetails: {
        backgroundColor: "#FEF2F2",
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#FECACA",
    },
    cancelDetail: {
        fontSize: 16,
        color: "#DC2626",
        fontWeight: "500",
        textAlign: "center",
    },
    modalActions: {
        flexDirection: "row",
        gap: 12,
    },
    modalCancel: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        alignItems: "center",
    },
    modalCancelText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#6B7280",
    },
    modalConfirm: {
        flex: 1,
        backgroundColor: "#10B981",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },
    modalConfirmDanger: {
        backgroundColor: "#EF4444",
    },
    modalConfirmText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },
});