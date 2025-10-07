// app/estimation.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../theme/ThemeContext";

const tiers = [
  { range: "0 - 1kg", price: "GHS 45" },
  { range: "1.1 - 2kg", price: "GHS 85" },
  { range: "2.1 - 3kg", price: "GHS 180" },
  { range: "3.1 - 4kg", price: "GHS 350" },
];

export default function Estimation() {
  const theme = useTheme();
  const router = useRouter();
  const [weight, setWeight] = useState("");

  const estimated = (() => {
    const w = Number(weight);
    if (!w || w <= 0) return null;
    // simple price function for demo (replace with your real tiers)
    if (w <= 1) return "GHS 45";
    if (w <= 2) return "GHS 85";
    if (w <= 3) return "GHS 180";
    return "GHS 350";
  })();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>How Pricing Works</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          Final price is measured at pickup using a certified scale. Use the quick estimator below.
        </Text>

        <TextInput
          value={weight}
          onChangeText={setWeight}
          placeholder="Enter estimated weight (kg)"
          keyboardType="numeric"
          style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
        />

        <View style={{ width: "100%", marginTop: 8 }}>
          {tiers.map((t) => (
            <View key={t.range} style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={{ color: theme.text }}>{t.range}</Text>
              <Text style={{ color: theme.text, fontWeight: "700" }}>{t.price}</Text>
            </View>
          ))}
        </View>

        {estimated && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ color: theme.text, fontWeight: "700" }}>Estimated cost: {estimated}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.cta, { backgroundColor: theme.primary }]}
          onPress={() =>
            router.push({
              pathname: "/request",
              params: { estimated },
            })
          }
        >
          <Text style={styles.ctaText}>Proceed to Request</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 6 },
  subtitle: { marginBottom: 12 },
  input: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#e6efe6", marginBottom: 12 },
  card: { padding: 12, borderRadius: 12, marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cta: { marginTop: 12, padding: 14, borderRadius: 12, alignItems: "center" },
  ctaText: { fontWeight: "700", color: "black" },
});
