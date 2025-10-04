// app/estimation.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as SMS from "expo-sms";

type Params = {
  address?: string;
  phone?: string;
  pickupAt?: string;
};

export default function EstimationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams() as Params;
  const { address, phone, pickupAt } = params;

  const pickupDate = pickupAt ? new Date(pickupAt) : null;

  const formatFull = (d?: Date | null) =>
    d ? d.toLocaleString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Not set";

  const sendAutoSMS = async () => {
    try {
      const message = `TrashAway Pickup Confirmed!\n\nLocation: ${address}\nPickup scheduled: ${formatFull(pickupDate)}\n\nWe’ll arrive to collect your garbage. Thank you!`;
      const recipient = phone ? [phone] : [];

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable && recipient.length) {
        // send to user automatically (this will use device SMS capability)
        await SMS.sendSMSAsync(recipient, message);
      } else {
        console.warn("SMS not available or no recipient.");
      }
    } catch (err) {
      console.error("SMS send failed:", err);
    }
  };

  const handleConfirm = async () => {
    // send SMS in background and navigate after
    await sendAutoSMS();
    router.push("/confirmation");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f6f8f6" }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Price Estimation</Text>
        <Text style={styles.subtitle}>Estimated based on weight at pickup.</Text>

        <View style={styles.card}><Text>0 - 1kg</Text><Text style={styles.bold}>GHS 45</Text></View>
        <View style={styles.card}><Text>1.1 - 2kg</Text><Text style={styles.bold}>GHS 85</Text></View>
        <View style={styles.card}><Text>2.1 - 3kg</Text><Text style={styles.bold}>GHS 180</Text></View>
        <View style={styles.card}><Text>3.1 - 4kg</Text><Text style={styles.bold}>GHS 350</Text></View>

        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={{ fontWeight: "700", marginBottom: 6 }}>Pickup Details</Text>
          <Text style={{ color: "#333" }}>{address}</Text>
          <Text style={{ color: "#333", marginTop: 6 }}>Time: {formatFull(pickupDate)}</Text>
          <Text style={{ color: "#333", marginTop: 6 }}>Phone: {phone}</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleConfirm}>
          <Text style={styles.buttonText}>Confirm Request</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
  subtitle: { color: "#444", marginBottom: 16 },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  bold: { fontWeight: "700" },
  button: {
    backgroundColor: "#17cf17",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: { textAlign: "center", fontWeight: "700", color: "#0b230b" },
});
