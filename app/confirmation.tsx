// app/confirmation.tsx
import React from "react";
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "../theme/ThemeContext";

export default function Confirmation() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const theme = useTheme();

  const address = (params as any).address as string | undefined;
  const pickupAt = (params as any).pickupAt as string | undefined;
  const estimated = (params as any).estimated as string | undefined;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <View style={[styles.badge, { backgroundColor: theme.primary }]}>
          <Text style={{ fontSize: 40, color: theme.card }}>✓</Text>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Request Submitted</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>We've sent a confirmation to your phone.</Text>

        {address && (
          <View style={[styles.summary, { backgroundColor: theme.card }]}>
            <Text style={{ fontWeight: "700", color: theme.text }}>Address</Text>
            <Text style={{ color: theme.text }}>{address}</Text>
          </View>
        )}
        {pickupAt && (
          <View style={[styles.summary, { backgroundColor: theme.card }]}>
            <Text style={{ fontWeight: "700", color: theme.text }}>Pickup Time</Text>
            <Text style={{ color: theme.text }}>{new Date(pickupAt).toLocaleString()}</Text>
          </View>
        )}
        {estimated && (
          <View style={[styles.summary, { backgroundColor: theme.card }]}>
            <Text style={{ fontWeight: "700", color: theme.text }}>Estimated Cost</Text>
            <Text style={{ color: theme.text }}>{estimated}</Text>
          </View>
        )}

        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => router.push("/")}>
          <Text style={{ color: theme.card, fontWeight: "700" }}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  badge: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 6 },
  subtitle: { marginBottom: 18 },
  summary: { width: "100%", padding: 12, borderRadius: 10, marginBottom: 10 },
  button: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, marginTop: 12 },
});
