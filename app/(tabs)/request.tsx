// app/(tabs)/request.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Platform,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { auth, db } from "@/Firebase/firebaseConfig";
import { getBookedTimes, submitRequest } from "@/services/requestService";
import { getUserDoc, updateUserDoc } from "@/services/authService";
import { setupNotifications } from "@/services/notificationService";
import { WasteType, RequestSubmission } from "@/types";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const WASTE_TYPES: WasteType[] = ["Household", "Plastic", "Organic", "Paper", "Electronic", "Hazardous"];
const TIME_START = 8; // 8 AM
const TIME_END = 18; // 6 PM
const SLOT_STEP_HOURS = 1;
const NOTE_MAX = 500;

export default function RequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [formData, setFormData] = useState({
    address: "",
    phone: "",
    wasteType: null as WasteType | null,
    date: params.date as string || "",
    time: "",
    notes: "",
  });

  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isPhoneEditing, setIsPhoneEditing] = useState(false);
  const [isAddressEditing, setIsAddressEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate time slots
  const timeSlots = Array.from(
      { length: Math.floor((TIME_END - TIME_START) / SLOT_STEP_HOURS) + 1 },
      (_, i) => {
        const hour = TIME_START + i * SLOT_STEP_HOURS;
        const label = hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;
        return label;
      }
  );

  const updateFormData = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Load user data and setup
  const loadUserData = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace("/(auth)/login");
        return;
      }

      const userDoc = await getUserDoc(user.uid);
      if (userDoc) {
        if (!isAddressEditing && !formData.address) {
          updateFormData("address", userDoc.address || "");
        }
        if (!isPhoneEditing && !formData.phone) {
          updateFormData("phone", userDoc.phone || "");
        }
      }

      await setupNotifications();
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, [formData.address, formData.phone, isAddressEditing, isPhoneEditing]);

  useEffect(() => {
    loadUserData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Load booked times when date changes
  useEffect(() => {
    const loadBookedSlots = async () => {
      if (!formData.date) {
        setBookedTimes([]);
        return;
      }

      try {
        const booked = await getBookedTimes(formData.date);
        setBookedTimes(booked);
      } catch (error) {
        console.error("Error loading booked times:", error);
        setBookedTimes([]);
      }
    };

    loadBookedSlots();
  }, [formData.date]);

  // Auto-save phone number
  useEffect(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    if (formData.phone.trim() && !isPhoneEditing) {
      saveTimerRef.current = setTimeout(async () => {
        setSaveStatus("saving");
        try {
          const user = auth.currentUser;
          if (user) {
            await updateUserDoc(user.uid, { phone: formData.phone.trim() });
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 2000);
          }
        } catch (error) {
          setSaveStatus("error");
          setSaveError("Failed to save phone number");
          console.error("Error saving phone:", error);
        }
      }, 1000);
    }

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [formData.phone, isPhoneEditing]);

  const handleUseLocation = async () => {
    try {
      setLocating(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
            "Location Permission Required",
            "Please enable location services to automatically fill your address.",
            [{ text: "OK" }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const [placemark] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (placemark) {
        const addressParts = [
          placemark.name,
          placemark.street,
          placemark.city,
          placemark.region,
          placemark.postalCode,
        ].filter(Boolean);

        updateFormData("address", addressParts.join(", "));

        // Also save location to user profile
        const user = auth.currentUser;
        if (user) {
          await updateUserDoc(user.uid, {
            location: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              street: placemark.street,
              city: placemark.city,
              region: placemark.region,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert(
          "Location Error",
          "Unable to fetch your current location. Please enter your address manually.",
          [{ text: "OK" }]
      );
    } finally {
      setLocating(false);
    }
  };

  const validateForm = (): boolean => {
    const { address, phone, wasteType, date, time } = formData;

    if (!address.trim()) {
      Alert.alert("Missing Information", "Please enter your pickup address.");
      return false;
    }

    if (!phone.trim()) {
      Alert.alert("Missing Information", "Please enter your phone number.");
      return false;
    }

    if (!/^\+?[\d\s\-\(\)]{7,15}$/.test(phone.replace(/\s/g, ""))) {
      Alert.alert("Invalid Phone Number", "Please enter a valid phone number.");
      return false;
    }

    if (!wasteType) {
      Alert.alert("Missing Information", "Please select a waste type.");
      return false;
    }

    if (!date) {
      Alert.alert("Missing Information", "Please select a pickup date.");
      return false;
    }

    if (!time) {
      Alert.alert("Missing Information", "Please select a pickup time.");
      return false;
    }

    // Check if selected slot is still available
    if (bookedTimes.includes(time)) {
      Alert.alert(
          "Time Slot Unavailable",
          "The selected time slot has been booked. Please choose another time.",
          [{ text: "OK" }]
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Authentication Required", "Please sign in to schedule a pickup.");
        router.replace("/(auth)/login");
        return;
      }

      const requestData: RequestSubmission = {
        userId: user.uid,
        userName: user.displayName || user.email || "User",
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        wasteType: formData.wasteType!,
        date: formData.date,
        time: formData.time,
        notes: formData.notes.trim() || null,
        status: "Pending",
      };

      await submitRequest(requestData);

      // Reset form
      setFormData(prev => ({
        ...prev,
        wasteType: null,
        date: "",
        time: "",
        notes: "",
      }));

      setConfirmVisible(false);

      // Navigate to confirmation screen
      router.push({
        pathname: "/confirmation",
        params: {
          date: formData.date,
          time: formData.time,
          wasteType: formData.wasteType,
        },
      });
    } catch (error: any) {
      console.error("Error submitting request:", error);
      Alert.alert(
          "Submission Failed",
          error.message || "Unable to schedule pickup. Please try again.",
          [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const isSlotBooked = (slot: string) => bookedTimes.includes(slot);
  const isSlotSelected = (slot: string) => formData.time === slot;

  const getWasteTypeColor = (type: WasteType) => {
    const colors: Record<WasteType, string> = {
      Household: "#10B981",
      Plastic: "#3B82F6",
      Organic: "#8B5CF6",
      Paper: "#F59E0B",
      Electronic: "#EF4444",
      Hazardous: "#DC2626",
    };
    return colors[type];
  };

  return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoid}
        >
          <Animated.ScrollView
              style={[styles.container, { opacity: fadeAnim }]}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.subtitle}>Schedule a Pickup</Text>
                <Text style={styles.title}>Request Waste Collection</Text>
              </View>
              <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Address Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Pickup Address</Text>
              <View style={styles.addressRow}>
                <TextInput
                    style={[styles.input, styles.addressInput]}
                    placeholder="Enter your full address"
                    placeholderTextColor="#9CA3AF"
                    value={formData.address}
                    onChangeText={(value) => updateFormData("address", value)}
                    onFocus={() => setIsAddressEditing(true)}
                    onBlur={() => setIsAddressEditing(false)}
                    multiline
                    numberOfLines={2}
                />
                <TouchableOpacity
                    style={styles.locationButton}
                    onPress={handleUseLocation}
                    disabled={locating}
                >
                  {locating ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                      <Ionicons name="location" size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Phone Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Contact Phone</Text>
              <View>
                <TextInput
                    style={styles.input}
                    placeholder="Your phone number"
                    placeholderTextColor="#9CA3AF"
                    value={formData.phone}
                    onChangeText={(value) => updateFormData("phone", value)}
                    keyboardType="phone-pad"
                    onFocus={() => setIsPhoneEditing(true)}
                    onBlur={() => setIsPhoneEditing(false)}
                />
                {saveStatus === "saving" && (
                    <View style={styles.saveStatus}>
                      <ActivityIndicator size="small" color="#10B981" />
                      <Text style={styles.saveStatusText}>Saving...</Text>
                    </View>
                )}
                {saveStatus === "saved" && (
                    <View style={styles.saveStatus}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={[styles.saveStatusText, styles.saveStatusSuccess]}>
                        Phone number saved
                      </Text>
                    </View>
                )}
                {saveStatus === "error" && (
                    <View style={styles.saveStatus}>
                      <Ionicons name="warning" size={16} color="#EF4444" />
                      <Text style={[styles.saveStatusText, styles.saveStatusError]}>
                        {saveError}
                      </Text>
                    </View>
                )}
              </View>
            </View>

            {/* Waste Type Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Waste Type</Text>
              <View style={styles.wasteTypeGrid}>
                {WASTE_TYPES.map((type) => (
                    <TouchableOpacity
                        key={type}
                        style={[
                          styles.wasteTypeButton,
                          formData.wasteType === type && {
                            backgroundColor: `${getWasteTypeColor(type)}15`,
                            borderColor: getWasteTypeColor(type),
                          },
                        ]}
                        onPress={() => updateFormData("wasteType", type)}
                    >
                      <View
                          style={[
                            styles.wasteTypeIcon,
                            { backgroundColor: getWasteTypeColor(type) },
                          ]}
                      >
                        <Ionicons
                            name={
                              type === "Household" ? "home-outline" :
                                  type === "Plastic" ? "water-outline" :
                                      type === "Organic" ? "leaf-outline" :
                                          type === "Paper" ? "document-text-outline" :
                                              type === "Electronic" ? "hardware-chip-outline" :
                                                  "warning-outline"
                            }
                            size={20}
                            color="#FFFFFF"
                        />
                      </View>
                      <Text
                          style={[
                            styles.wasteTypeText,
                            formData.wasteType === type && {
                              color: getWasteTypeColor(type),
                              fontWeight: "600",
                            },
                          ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Calendar Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Pickup Date</Text>
              <View style={styles.calendarContainer}>
                <Calendar
                    onDayPress={(day) => updateFormData("date", day.dateString)}
                    markedDates={{
                      [formData.date]: {
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
                      dotColor: "#10B981",
                      selectedDotColor: "#FFFFFF",
                      arrowColor: "#10B981",
                      monthTextColor: "#111827",
                      textDayFontWeight: "500",
                      textMonthFontWeight: "600",
                      textDayHeaderFontWeight: "600",
                      textDayFontSize: 14,
                      textMonthFontSize: 16,
                      textDayHeaderFontSize: 14,
                    }}
                    style={styles.calendar}
                />
              </View>
            </View>

            {/* Time Slots Section */}
            {formData.date && (
                <View style={styles.section}>
                  <View style={styles.timeHeader}>
                    <Text style={styles.sectionLabel}>Available Time Slots</Text>
                    <Text style={styles.slotsInfo}>
                      {bookedTimes.length} of {timeSlots.length} booked
                    </Text>
                  </View>
                  <View style={styles.timeGrid}>
                    {timeSlots.map((slot) => {
                      const booked = isSlotBooked(slot);
                      const selected = isSlotSelected(slot);

                      return (
                          <TouchableOpacity
                              key={slot}
                              style={[
                                styles.timeSlot,
                                booked && styles.timeSlotBooked,
                                selected && styles.timeSlotSelected,
                              ]}
                              onPress={() => !booked && updateFormData("time", slot)}
                              disabled={booked}
                          >
                            {booked ? (
                                <>
                                  <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                                  <Text style={styles.timeSlotTextBooked}>{slot}</Text>
                                  <Text style={styles.bookedLabel}>Booked</Text>
                                </>
                            ) : (
                                <>
                                  <Ionicons
                                      name={selected ? "checkmark-circle" : "time-outline"}
                                      size={16}
                                      color={selected ? "#FFFFFF" : "#6B7280"}
                                  />
                                  <Text
                                      style={[
                                        styles.timeSlotText,
                                        selected && styles.timeSlotTextSelected,
                                      ]}
                                  >
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

            {/* Notes Section */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                Special Instructions {formData.notes && `(${formData.notes.length}/${NOTE_MAX})`}
              </Text>
              <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="Any special instructions for the collector (gate code, specific location, etc.)"
                  placeholderTextColor="#9CA3AF"
                  value={formData.notes}
                  onChangeText={(value) => updateFormData("notes", value)}
                  multiline
                  numberOfLines={4}
                  maxLength={NOTE_MAX}
              />
            </View>

            {/* Submit Button */}
            <View style={styles.submitSection}>
              <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!formData.date || !formData.time || !formData.wasteType) && styles.submitButtonDisabled,
                  ]}
                  onPress={() => setConfirmVisible(true)}
                  disabled={!formData.date || !formData.time || !formData.wasteType || loading}
              >
                <LinearGradient
                    colors={["#10B981", "#059669"]}
                    style={styles.submitGradient}
                >
                  {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                      <>
                        <Ionicons name="calendar" size={20} color="#FFFFFF" />
                        <Text style={styles.submitButtonText}>Schedule Pickup</Text>
                      </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.ScrollView>
        </KeyboardAvoidingView>

        {/* Confirmation Modal */}
        <Modal
            visible={confirmVisible}
            animationType="slide"
            transparent
            statusBarTranslucent
        >
          <TouchableWithoutFeedback onPress={() => setConfirmVisible(false)}>
            <View style={styles.modalOverlay} />
          </TouchableWithoutFeedback>

          <View style={styles.confirmationSheet}>
            <View style={styles.confirmationHeader}>
              <Text style={styles.confirmationTitle}>Confirm Pickup Details</Text>
              <TouchableOpacity
                  style={styles.confirmationClose}
                  onPress={() => setConfirmVisible(false)}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.confirmationContent}>
              <DetailRow label="Date" value={formData.date} />
              <DetailRow label="Time" value={formData.time} />
              <DetailRow label="Waste Type" value={formData.wasteType} />
              <DetailRow label="Address" value={formData.address} />
              {formData.notes && <DetailRow label="Instructions" value={formData.notes} />}
            </View>

            <View style={styles.confirmationActions}>
              <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleSubmit}
                  disabled={loading}
              >
                {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                    <Text style={styles.confirmButtonText}>Confirm & Schedule</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
  );
}

// Helper component for confirmation details
const DetailRow = ({ label, value }: { label: string; value: any }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value || "Not specified"}
      </Text>
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
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  headerContent: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  backButton: {
    padding: 4,
    marginLeft: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
  },
  addressInput: {
    flex: 1,
    marginRight: 12,
    minHeight: 60,
    textAlignVertical: "top",
  },
  locationButton: {
    backgroundColor: "#10B981",
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },
  saveStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  saveStatusText: {
    fontSize: 12,
    color: "#6B7280",
  },
  saveStatusSuccess: {
    color: "#10B981",
  },
  saveStatusError: {
    color: "#EF4444",
  },
  wasteTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  wasteTypeButton: {
    width: (width - 64) / 3,
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  wasteTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  wasteTypeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
  },
  calendarContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  calendar: {
    borderRadius: 12,
  },
  timeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  slotsInfo: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeSlot: {
    width: (width - 56) / 3,
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
    fontSize: 12,
    color: "#9CA3AF",
    flex: 1,
    textDecorationLine: "line-through",
  },
  bookedLabel: {
    fontSize: 10,
    color: "#EF4444",
    fontWeight: "600",
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitSection: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  confirmationSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: "80%",
  },
  confirmationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  confirmationClose: {
    padding: 4,
  },
  confirmationContent: {
    padding: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    width: "30%",
  },
  detailValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
    width: "65%",
    textAlign: "right",
  },
  confirmationActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  confirmButton: {
    flex: 2,
    backgroundColor: "#10B981",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});