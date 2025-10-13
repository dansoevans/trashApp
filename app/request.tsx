import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import { useRouter } from "expo-router";
import { collection, addDoc, query, where, getDocs, Timestamp } from "firebase/firestore";
import * as Location from "expo-location";
import { db } from "../Firebase/firebaseConfig";

export default function RequestScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [wasteType, setWasteType] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  // Generate time slots from 10 AM to 8 PM (1-hour intervals)
  const timeSlots = Array.from({ length: 11 }, (_, i) => {
    const hour = 10 + i;
    const label =
      hour <= 12
        ? `${hour}:00 AM`
        : `${hour - 12}:00 PM`;
    return label;
  });

  // Restrict past dates
  const today = new Date().toISOString().split("T")[0];

  // Fetch booked times for the selected date
  useEffect(() => {
    const fetchBookedTimes = async () => {
      if (!selectedDate) return;
      try {
        const q = query(collection(db, "requests"), where("date", "==", selectedDate));
        const snapshot = await getDocs(q);
        const times = snapshot.docs.map((doc) => doc.data().time);
        setBookedTimes(times);
      } catch (error) {
        console.error("Error fetching booked times:", error);
      }
    };
    fetchBookedTimes();
  }, [selectedDate]);

  const handleGetLocation = async () => {
    try {
      setGettingLocation(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
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

      const place = geo[0];
      const formattedAddress = `${place.name || ""}, ${place.city || ""}, ${place.region || ""}, ${place.country || ""}`;
      setAddress(formattedAddress);
    } catch (error) {
      console.error("Location Error:", error);
      Alert.alert("Error", "Unable to fetch location.");
    } finally {
      setGettingLocation(false);
    }
  };

  const handleConfirmRequest = async () => {
    if (!name || !address || !phone || !wasteType || !selectedDate || !selectedTime) {
      Alert.alert("Missing Fields", "Please fill in all required details.");
      return;
    }

    try {
      setLoading(true);

      // Ensure time slot is still available
      const q = query(
        collection(db, "requests"),
        where("date", "==", selectedDate),
        where("time", "==", selectedTime)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setLoading(false);
        Alert.alert("Time Unavailable", "This time slot has just been booked. Please choose another.");
        return;
      }

      await addDoc(collection(db, "requests"), {
        name,
        address,
        phone,
        wasteType,
        date: selectedDate,
        time: selectedTime,
        status: "Pending",
        createdAt: Timestamp.now(),
      });

      setLoading(false);
      Alert.alert("Success", "Your garbage collection request has been submitted.");
      router.push("/confirmation");
    } catch (error) {
      console.error("Error adding document: ", error);
      setLoading(false);
      Alert.alert("Error", "Something went wrong while submitting your request.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0e1111" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }} showsVerticalScrollIndicator={false}>
          <Text
            style={{
              color: "#00e060",
              fontSize: 26,
              fontWeight: "600",
              textAlign: "center",
              marginVertical: 10,
            }}
          >
            Garbage Collection Request
          </Text>

          {/* Name */}
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />

          {/* Address */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Address"
              placeholderTextColor="#999"
              value={address}
              onChangeText={setAddress}
            />
            <TouchableOpacity
              onPress={handleGetLocation}
              style={{
                marginLeft: 8,
                backgroundColor: "#00e060",
                borderRadius: 10,
                padding: 10,
              }}
            >
              {gettingLocation ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "600" }}>📍</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Phone */}
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          {/* Waste Type */}
          <TextInput
            style={styles.input}
            placeholder="Type of Waste (Household, Plastic, etc.)"
            placeholderTextColor="#999"
            value={wasteType}
            onChangeText={setWasteType}
          />

          {/* Calendar */}
          <View style={{ marginTop: 10, backgroundColor: "#1a1a1a", borderRadius: 12, padding: 10 }}>
            <Text style={{ color: "#ccc", marginBottom: 6, fontSize: 16 }}>
              Select Pickup Date:
            </Text>
            <Calendar
              theme={{
                calendarBackground: "#1a1a1a",
                dayTextColor: "#fff",
                monthTextColor: "#00e060",
                arrowColor: "#00e060",
                todayTextColor: "#00e060",
                selectedDayBackgroundColor: "#00e060",
              }}
              minDate={today}
              onDayPress={(day) => {
                setSelectedDate(day.dateString);
                setSelectedTime(""); // reset time when new date selected
              }}
              markedDates={
                selectedDate
                  ? { [selectedDate]: { selected: true, selectedColor: "#00e060" } }
                  : {}
              }
            />
          </View>

          {/* Time Selection */}
          {selectedDate ? (
            <View style={{ marginTop: 20 }}>
              <Text style={{ color: "#ccc", marginBottom: 8, fontSize: 16 }}>
                Select Time Slot:
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {timeSlots.map((slot) => {
                  const isBooked = bookedTimes.includes(slot);
                  const isSelected = selectedTime === slot;
                  return (
                    <View key={slot} style={{ alignItems: "center", margin: 5 }}>
                      <TouchableOpacity
                        onPress={() => !isBooked && setSelectedTime(slot)}
                        disabled={isBooked}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 15,
                          backgroundColor: isBooked
                            ? "#2a0000"
                            : isSelected
                            ? "#00e060"
                            : "#1a1a1a",
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: isSelected ? "#00e060" : "#333",
                        }}
                      >
                        <Text
                          style={{
                            color: isBooked ? "#ff6666" : isSelected ? "#fff" : "#ccc",
                            fontWeight: isSelected ? "700" : "500",
                          }}
                        >
                          {slot}
                        </Text>
                      </TouchableOpacity>
                      {isBooked && (
                        <Text style={{ color: "#ff4d4d", fontSize: 12, marginTop: 2 }}>
                          Booked
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleConfirmRequest}
            disabled={loading}
            style={{
              backgroundColor: loading ? "#222" : "#00e060",
              padding: 15,
              borderRadius: 12,
              marginTop: 25,
              alignItems: "center",
              shadowColor: "#00e060",
              shadowOpacity: 0.4,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 2 },
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "600",
              }}
            >
              {loading ? "Submitting..." : "Continue"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = {
  input: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
};
