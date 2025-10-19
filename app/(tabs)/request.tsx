// app/(tabs)/request.tsx
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { auth } from "../../Firebase/firebaseConfig";
import { submitRequest, getBookedTimes } from "../../services/requestService";

export default function RequestScreen() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [wasteType, setWasteType] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  const timeSlots = Array.from({ length: 11 }, (_, i) => {
    const hour = 10 + i;
    return hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;
  });

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      if (!selectedDate) return;
      const times = await getBookedTimes(selectedDate);
      setBookedTimes(times);
    };
    load();
  }, [selectedDate]);

  const handleGetLocation = async () => {
    try {
      setGettingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required.");
        setGettingLocation(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const geo = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      const place = geo[0] || {};
      const formatted = `${place.name || ""}, ${place.city || ""}, ${place.region || ""}, ${place.country || ""}`;
      setAddress(formatted);
    } catch (e) {
      Alert.alert("Error", "Unable to fetch location.");
      console.error(e);
    } finally {
      setGettingLocation(false);
    }
  };

  const handleConfirm = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Not signed in", "Please sign in to submit a request.");
      router.replace("/auth/login");
      return;
    }

    if (!address || !phone || !wasteType || !selectedDate || !selectedTime) {
      Alert.alert("Missing fields", "Please complete all fields.");
      return;
    }

    try {
      setLoading(true);
      await submitRequest({
        userId: user.uid,
        userName: user.displayName || user.email || "User",
        address,
        phone,
        wasteType,
        date: selectedDate,
        time: selectedTime,
      });
      setLoading(false);
      Alert.alert("Success", "Request submitted.");
      router.push("/confirmation");
    } catch (e: any) {
      setLoading(false);
      Alert.alert("Error", e.message || "Failed to submit request.");
    }
  };

  return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Schedule a Pickup</Text>

            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Address" placeholderTextColor="#888" value={address} onChangeText={setAddress} />
              <TouchableOpacity onPress={handleGetLocation} style={styles.locationButton}>
                {gettingLocation ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: "#fff" }}>📍</Text>}
              </TouchableOpacity>
            </View>

            <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#888" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <TextInput style={styles.input} placeholder="Type of Waste" placeholderTextColor="#888" value={wasteType} onChangeText={setWasteType} />

            <View style={styles.calendarCard}>
              <Text style={styles.sectionTitle}>Select Pickup Date</Text>
              <Calendar
                  theme={{
                    calendarBackground: "#fff",
                    dayTextColor: "#000",
                    monthTextColor: "#17cf17",
                    arrowColor: "#17cf17",
                    todayTextColor: "#17cf17",
                    selectedDayBackgroundColor: "#17cf17",
                    selectedDayTextColor: "#fff",
                  }}
                  minDate={today}
                  onDayPress={(day) => {
                    setSelectedDate(day.dateString);
                    setSelectedTime("");
                  }}
                  markedDates={selectedDate ? { [selectedDate]: { selected: true, selectedColor: "#17cf17" } } : {}}
              />
            </View>

            {selectedDate && (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Select Time Slot</Text>
                  <View style={styles.timeGrid}>
                    {timeSlots.map((slot) => {
                      const isBooked = bookedTimes.includes(slot);
                      const isSelected = selectedTime === slot;
                      return (
                          <TouchableOpacity
                              key={slot}
                              onPress={() => !isBooked && setSelectedTime(slot)}
                              disabled={isBooked}
                              style={[styles.timeSlot, isBooked && styles.timeBooked, isSelected && styles.timeSelected]}
                          >
                            <Text style={[styles.timeText, isBooked && { color: "#aaa" }, isSelected && { color: "#fff" }]}>{slot}</Text>
                          </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
            )}

            <TouchableOpacity onPress={handleConfirm} disabled={loading} style={[styles.button, loading && { opacity: 0.8 }]}>
              <Text style={styles.buttonText}>{loading ? "Submitting..." : "Submit Request"}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "700", color: "#17cf17", marginBottom: 14 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  input: { backgroundColor: "#f5f5f5", padding: 12, borderRadius: 10, marginBottom: 12 },
  locationButton: { marginLeft: 8, backgroundColor: "#17cf17", borderRadius: 10, padding: 12 },
  calendarCard: { backgroundColor: "#fff", borderRadius: 12, padding: 12, elevation: 2, borderColor: "#eee", borderWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 8 },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  timeSlot: { width: "30%", paddingVertical: 10, marginVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: "#ddd", backgroundColor: "#fff", alignItems: "center" },
  timeSelected: { backgroundColor: "#17cf17", borderColor: "#17cf17" },
  timeBooked: { backgroundColor: "#fafafa", borderColor: "#f0f0f0" },
  timeText: { color: "#333", fontWeight: "500" },
  button: { backgroundColor: "#17cf17", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
