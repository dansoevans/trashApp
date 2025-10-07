// app/request.tsx
import React, { useState, useCallback } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../theme/ThemeContext";
import { sendAutoSMS } from "../utils/sms";
import { COLLECTOR_NUMBER } from "../constants";

export default function RequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const theme = useTheme();

  const estimated = (params as any).estimated as string | undefined;

  // form state
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // location loading
  const [locLoading, setLocLoading] = useState(false);

  // date + slots
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const baseSlots = ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00"];
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // sending state
  const [sending, setSending] = useState(false);

  // generate slots (exclude past slots if same day with 30 min buffer)
  const getAvailableSlots = useCallback(
    (forDate: Date) => {
      const now = new Date();
      const isToday = now.toDateString() === forDate.toDateString();
      if (!isToday) return baseSlots;
      const threshold = new Date(now.getTime() + 30 * 60 * 1000);
      return baseSlots.filter((t) => {
        const [hh, mm] = t.split(":").map(Number);
        const c = new Date(forDate);
        c.setHours(hh, mm, 0, 0);
        return c > threshold;
      });
    },
    [baseSlots]
  );

  const availableSlots = getAvailableSlots(date);

  // use device location and reverse geocode
  const handleUseLocation = async () => {
    try {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Please allow location access in settings.");
        setLocLoading(false);
        return;
      }

      const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = cur.coords;
      setCoords({ latitude, longitude });

      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const readable = [place.name, place.street, place.city, place.region, place.postalCode, place.country]
        .filter(Boolean)
        .join(", ");
      setAddress(readable);
    } catch (err) {
      console.warn(err);
      Alert.alert("Location error", "Could not fetch location. Try again.");
    } finally {
      setLocLoading(false);
    }
  };

  // when marker dragged we update address
  const onMarkerDragEnd = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setCoords({ latitude, longitude });
    try {
      const [p] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const readable = [p.name, p.street, p.city, p.region, p.postalCode, p.country].filter(Boolean).join(", ");
      setAddress(readable);
    } catch (err) {
      console.warn("reverse geocode failed", err);
    }
  };

  const onDateChange = (_: any, selected?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selected) {
      const newD = new Date(selected);
      newD.setHours(0, 0, 0, 0);
      setDate(newD);
      setSelectedSlot(null);
    }
  };

  const handleContinue = async () => {
    if (!address.trim()) return Alert.alert("Missing address", "Please supply an address or use 'Use My Location'.");
    if (!phone.trim()) return Alert.alert("Missing phone", "Please enter a phone number.");
    if (!selectedSlot) return Alert.alert("Pick time", "Select a time slot.");

    // compose pickup datetime
    const [hh, mm] = selectedSlot.split(":").map(Number);
    const pickup = new Date(date);
    pickup.setHours(hh, mm, 0, 0);

    if (pickup.getTime() <= Date.now()) return Alert.alert("Invalid time", "Choose a future time.");

    const userMessage = `TrashAway pickup confirmed\nAddress: ${address}\nPickup: ${pickup.toLocaleString()}\nEstimated cost: ${estimated || "TBD"}`;

    try {
      setSending(true);

      // send to user automatically (platform-dependent)
      const resUser = await sendAutoSMS(phone, userMessage);

      // also notify collector
      const collectorMessage = `New pickup request\nAddress: ${address}\nPickup: ${pickup.toLocaleString()}\nPhone: ${phone}`;
      const resCollector = await sendAutoSMS(COLLECTOR_NUMBER, collectorMessage);

      // navigate to confirmation with summary params
      router.push({
        pathname: "/confirmation",
        params: {
          address,
          phone,
          pickupAt: pickup.toISOString(),
          estimated: estimated || "TBD",
          smsUser: resUser.result ?? "unknown",
          smsCollector: resCollector.result ?? "unknown",
        },
      });
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to send SMS. Please try again or check your device settings.");
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: theme.text }]}>Request Pickup</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>Fill details, choose date & time — we’ll notify you</Text>

          <Text style={[styles.label, { color: theme.text }]}>Pickup Address</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text }]} value={address} onChangeText={setAddress} multiline />

          <View style={styles.row}>
            <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: theme.primary }]} onPress={handleUseLocation} disabled={locLoading}>
              {locLoading ? <ActivityIndicator color="#000" /> : <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Use My Location</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: theme.card }]} onPress={() => { setAddress(""); setCoords(null); }}>
              <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Clear</Text>
            </TouchableOpacity>
          </View>

          {coords && (
            <View style={styles.mapContainer}>
              <MapView style={styles.map} initialRegion={{ latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}>
                <Marker draggable coordinate={coords} onDragEnd={onMarkerDragEnd} title="Pickup location" description={address} />
              </MapView>
            </View>
          )}

          <Text style={[styles.label, { color: theme.text }]}>Mobile Number</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text }]} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+233..." />

          <Text style={[styles.label, { color: theme.text }]}>Pickup Date</Text>
          <TouchableOpacity style={[styles.datePickerBtn, { backgroundColor: theme.card }]} onPress={() => setShowDatePicker(true)}>
            <Text style={{ color: theme.text }}>{date.toDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && <DateTimePicker value={date} mode="date" display={Platform.OS === "ios" ? "inline" : "default"} minimumDate={new Date()} onChange={onDateChange} />}

          <Text style={[styles.label, { color: theme.text, marginTop: 12 }]}>Available Time Slots</Text>
          <View style={styles.slotsContainer}>
            {availableSlots.length === 0 ? <Text style={{ color: theme.muted }}>No available slots for this day</Text> : availableSlots.map((slot) => {
              const active = slot === selectedSlot;
              return (
                <TouchableOpacity key={slot} onPress={() => setSelectedSlot(slot)} style={[styles.slot, { backgroundColor: active ? theme.primary : theme.card }]}>
                  <Text style={{ color: active ? theme.card : theme.text }}>{slot}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={[styles.cta, { backgroundColor: theme.primary }]} onPress={handleContinue} disabled={sending}>
            {sending ? <ActivityIndicator color="#000" /> : <Text style={[styles.ctaText, { color: theme.text }]}>Continue</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 6 },
  subtitle: { marginBottom: 14 },
  label: { fontWeight: "600", marginBottom: 6 },
  input: { padding: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: "rgba(0,0,0,0.06)" },
  row: { flexDirection: "row", gap: 8, marginBottom: 12, justifyContent: "space-between" },
  secondaryButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", marginRight: 8 },
  secondaryButtonText: { fontWeight: "700" },
  mapContainer: { height: 180, borderRadius: 12, overflow: "hidden", marginBottom: 12 },
  map: { width: "100%", height: "100%" },
  datePickerBtn: { padding: 12, borderRadius: 10, marginTop: 6, marginBottom: 8 },
  slotsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  slot: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginRight: 8, marginBottom: 8 },
  cta: { paddingVertical: 14, borderRadius: 12, marginTop: 18, alignItems: "center" },
  ctaText: { fontWeight: "700" },
});
