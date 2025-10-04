// app/request.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

export default function RequestScreen() {
  const router = useRouter();

  // basic details
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  // location state
  const [locationCoords, setLocationCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locLoading, setLocLoading] = useState(false);

  // date & time booking
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Example static time slots — you can replace these with dynamic logic later
  const baseSlots = ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00"];

  // Generate available slots for a date (example: disable past slots on same-day)
  const getAvailableSlots = (forDate: Date) => {
    const now = new Date();
    const isToday =
      now.getFullYear() === forDate.getFullYear() &&
      now.getMonth() === forDate.getMonth() &&
      now.getDate() === forDate.getDate();

    if (!isToday) return baseSlots;

    // filter out slots earlier than current time (+ 30 min buffer)
    const threshold = new Date(now.getTime() + 30 * 60 * 1000);
    return baseSlots.filter((t) => {
      const [hh, mm] = t.split(":").map(Number);
      const candidate = new Date(forDate);
      candidate.setHours(hh, mm, 0, 0);
      return candidate > threshold;
    });
  };

  const availableSlots = getAvailableSlots(date);

  // Location handler (get current position + reverse geocode)
  const handleUseLocation = async () => {
    try {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Enable location permissions in settings.");
        setLocLoading(false);
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const [place] = await Location.reverseGeocodeAsync({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });

      // build readable address (fallbacks if parts missing)
      const readable = [
        place.name,
        place.street,
        place.city,
        place.region,
        place.postalCode,
        place.country,
      ]
        .filter(Boolean)
        .join(", ");

      setAddress(readable);
      setLocationCoords({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
      setLocLoading(false);
    } catch (err) {
      console.error(err);
      setLocLoading(false);
      Alert.alert("Error", "Unable to get location. Try again.");
    }
  };

  // Date picker change
  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(Platform.OS === "ios"); // keep open on iOS if needed
    if (selected) {
      // make time portion zeroed (we select time via slots)
      const newDate = new Date(selected);
      newDate.setHours(0, 0, 0, 0);
      setDate(newDate);
      setSelectedSlot(null); // reset selected slot if date changes
    }
  };

  // Continue to estimation — validate fields and compose pickupAt ISO string
  const handleContinue = () => {
    if (!address?.trim()) {
      Alert.alert("Missing address", "Please provide a pickup address or use 'Use My Location'.");
      return;
    }
    if (!phone?.trim()) {
      Alert.alert("Missing phone", "Please enter your phone number for notifications.");
      return;
    }
    if (!selectedSlot) {
      Alert.alert("Pick a time", "Please choose a pickup time slot.");
      return;
    }

    // combine date and selectedSlot into ISO string
    const [hh, mm] = selectedSlot.split(":").map(Number);
    const pickup = new Date(date);
    pickup.setHours(hh, mm, 0, 0);

    // basic sanity: ensure pickup is in future
    if (pickup.getTime() <= Date.now()) {
      Alert.alert("Invalid time", "Please choose a future date/time.");
      return;
    }

    // push to estimation screen with params
    router.push({
      pathname: "/estimation",
      params: {
        address,
        phone,
        pickupAt: pickup.toISOString(),
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f6f8f6" }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Request Pickup</Text>
          <Text style={styles.subtitle}>Enter pickup details and choose a date & time.</Text>

          {/* Address + Use Location */}
          <Text style={styles.label}>Pickup Address</Text>
          <TextInput
            style={[styles.input, { minHeight: 48 }]}
            placeholder="123 Main Street, City"
            value={address}
            onChangeText={setAddress}
            multiline
          />
          <View style={styles.row}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleUseLocation} disabled={locLoading}>
              {locLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.secondaryButtonText}>Use My Location</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setAddress("");
                setLocationCoords(null);
              }}
            >
              <Text style={styles.secondaryButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>

          {/* Map preview (if available) */}
          {locationCoords && (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: locationCoords.latitude,
                  longitude: locationCoords.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                pointerEvents="none"
              >
                <Marker coordinate={locationCoords} title="Pickup Location" description={address} />
              </MapView>
            </View>
          )}

          {/* Phone */}
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+233xxxxxxxxx"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          {/* Date selection */}
          <Text style={styles.label}>Pickup Date</Text>
          <View style={{ marginBottom: 8 }}>
            <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.datePickerText}>{date.toDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                minimumDate={new Date()}
                onChange={onDateChange}
              />
            )}
          </View>

          {/* Time slots */}
          <Text style={styles.label}>Available Time Slots</Text>
          <View style={styles.slotsContainer}>
            {availableSlots.length === 0 ? (
              <Text style={styles.hintText}>No available slots for this day. Pick another date.</Text>
            ) : (
              availableSlots.map((slot) => {
                const active = slot === selectedSlot;
                return (
                  <TouchableOpacity
                    key={slot}
                    onPress={() => setSelectedSlot(slot)}
                    style={[styles.slot, active && styles.slotActive]}
                  >
                    <Text style={[styles.slotText, active && styles.slotTextActive]}>{slot}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* Continue */}
          <TouchableOpacity style={styles.cta} onPress={handleContinue}>
            <Text style={styles.ctaText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 6 },
  subtitle: { color: "#555", marginBottom: 18 },
  label: { fontSize: 15, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  row: { flexDirection: "row", gap: 10, marginBottom: 12, justifyContent: "space-between" },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#17cf17",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 8,
  },
  secondaryButtonText: { color: "black", fontWeight: "700" },
  mapContainer: { height: 180, borderRadius: 10, overflow: "hidden", marginBottom: 12, borderWidth: 1, borderColor: "#eee" },
  map: { width: "100%", height: "100%" },
  datePickerBtn: {
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  datePickerText: { fontWeight: "600", color: "#222" },
  slotsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slot: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#eee",
    marginRight: 8,
    marginBottom: 8,
  },
  slotActive: {
    backgroundColor: "#112111",
    borderColor: "#112111",
  },
  slotText: { fontWeight: "600", color: "#222" },
  slotTextActive: { color: "#fff" },
  hintText: { color: "#777" },
  cta: { backgroundColor: "#17cf17", paddingVertical: 14, borderRadius: 12, marginTop: 18 },
  ctaText: { color: "black", textAlign: "center", fontWeight: "bold" },
});
