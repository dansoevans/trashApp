// app/home.tsx
import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import useRequests from "../hooks/useRequests";

export default function Home() {
  const router = useRouter();
  const { requests, loading, removeRequest } = useRequests();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>TrashAway</Text>
      <View style={styles.body}>
        <TouchableOpacity style={styles.requestButton} onPress={() => router.push("/request")}>
          <Text style={styles.requestButtonText}>Request Pickup</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Your Requests</Text>
        {loading ? (
          <Text>Loading...</Text>
        ) : requests.length === 0 ? (
          <Text style={styles.emptyText}>No requests yet. Tap "Request Pickup" to create one.</Text>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.type} • {item.weight} kg</Text>
                  <Text style={styles.cardSubtitle}>{item.address}</Text>
                  <Text style={styles.cardSubtitle}>Pickup: {new Date(item.pickupAt).toLocaleString()}</Text>
                  <Text style={[styles.cardSubtitle, { marginTop: 6 }]}>Status: {item.status}</Text>
                </View>
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeRequest(item.id)}>
                  <Text style={{ color: "#fff" }}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { fontSize: 28, fontWeight: "800", paddingTop: 48, paddingHorizontal: 20 },
  body: { padding: 20, flex: 1 },
  requestButton: { backgroundColor: "#17cf17", padding: 14, borderRadius: 10, alignItems: "center", marginBottom: 16 },
  requestButtonText: { color: "#0f1a0f", fontWeight: "700" },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  emptyText: { color: "#666" },
  card: { flexDirection: "row", backgroundColor: "#f3f6f3", padding: 12, borderRadius: 10, marginBottom: 12, alignItems: "center" },
  cardTitle: { fontWeight: "700" },
  cardSubtitle: { color: "#444", fontSize: 13, marginTop: 2 },
  removeBtn: { backgroundColor: "#ff4d4d", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
});
