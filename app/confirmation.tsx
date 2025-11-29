// app/confirmation.tsx
import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function ConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const scaleAnim = new Animated.Value(0);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale: scaleAnim }],
                  opacity: fadeAnim,
                },
              ]}
          >
            <LinearGradient
                colors={["#10B981", "#059669"]}
                style={styles.gradientCircle}
            >
              <Ionicons name="checkmark" size={48} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>

          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            <Text style={styles.title}>Pickup Scheduled!</Text>
            <Text style={styles.subtitle}>
              Your waste collection has been successfully scheduled
            </Text>

            <View style={styles.detailsCard}>
              <DetailRow
                  icon="calendar"
                  label="Date"
                  value={params.date as string}
              />
              <DetailRow
                  icon="time"
                  label="Time"
                  value={params.time as string}
              />
              <DetailRow
                  icon="recycle"
                  label="Waste Type"
                  value={params.wasteType as string}
              />
            </View>

            <Text style={styles.note}>
              You'll receive a notification reminder before your pickup.
              You can track the status in your history.
            </Text>
          </Animated.View>

          <View style={styles.actions}>
            <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.replace("/(tabs)/home")}
            >
              <Text style={styles.primaryButtonText}>Back to Home</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.replace("/(tabs)/history")}
            >
              <Text style={styles.secondaryButtonText}>View History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
  );
}

const DetailRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Ionicons name={icon as any} size={20} color="#6B7280" />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  iconContainer: {
    alignItems: "center",
    marginTop: 60,
  },
  gradientCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  content: {
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "600",
  },
  note: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  actions: {
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: "#10B981",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  secondaryButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
});