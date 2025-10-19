// app/(tabs)/history.tsx
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../Firebase/firebaseConfig";
import { getUserRequests } from "../../services/requestService";

export default function HistoryScreen() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const user = auth.currentUser;
            if (!user) {
                setItems([]);
                setLoading(false);
                return;
            }
            try {
                const data = await getUserRequests(user.uid);
                setItems(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Past Pickups</Text>

                {loading ? <Text style={styles.note}>Loading…</Text> : null}

                {items.length === 0 && !loading ? (
                    <View style={styles.card}><Text style={styles.cardText}>You have no past requests yet.</Text></View>
                ) : null}

                {items.map((it) => (
                    <View key={it.id} style={styles.card}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>{it.userName}</Text>
                            <Text style={styles.cardSub}>{it.date} • {it.time}</Text>
                            <Text style={styles.cardSub}>{it.address}</Text>
                        </View>
                        <Text style={[styles.amount, it.status === "Completed" ? { color: "#17cf17" } : { color: "#444" }]}>{it.status}</Text>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#fff" },
    container: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 22, fontWeight: "700", color: "#17cf17", marginBottom: 12 },
    note: { color: "#666", marginBottom: 12 },
    card: { backgroundColor: "#f8f8f8", borderRadius: 10, padding: 14, marginBottom: 12, flexDirection: "row", alignItems: "center" },
    cardText: { color: "#666" },
    cardTitle: { fontWeight: "700", color: "#111" },
    cardSub: { color: "#666", marginTop: 4 },
    amount: { fontWeight: "700", marginLeft: 12 },
});
