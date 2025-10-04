// app/status.tsx
import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import useRequests from "../hooks/useRequests";

export default function Status() {
  const { requests } = useRequests();

  const pending = requests.filter((r) => r.status === "pending");
  const completed = requests.filter((r) => r.status === "completed");

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Request Status</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pending</Text>
        {pending.length === 0 ? <Text style={styles.empty}>No pending requests</Text> :
          <FlatList data={pending} keyExtractor={(i) => i.id} renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.type} • {item.weight} kg</Text>
              <Text style={styles.cardSubtitle}>{item.address}</Text>
            </View>
          )} />
        }
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Completed</Text>
        {completed.length === 0 ? <Text style={styles.empty}>No completed requests</Text> :
          <FlatList data={completed} keyExtractor={(i) => i.id} renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.type} • {item.weight} kg</Text>
              <Text style={styles.cardSubtitle}>{item.address}</Text>
            </View>
          )} />
        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "800", paddingTop: 48, paddingHorizontal: 20 },
  section: { padding: 20, borderTopWidth: 1, borderColor: "#eef3ee" },
  sectionTitle: { fontWeight: "800", marginBottom: 8 },
  empty: { color: "#666" },
  card: { backgroundColor: "#f3f6f3", padding: 10, borderRadius: 8, marginBottom: 10 },
  cardTitle: { fontWeight: "700" },
  cardSubtitle: { color: "#444" },
});
