// components/PickupCard.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function PickupCard({ item }: { item: any }) {
    // Helper: get color for status
    const getStatusColor = (status: string) => {
        switch (status) {
            case "Pending":
                return "#fcaa12"; // orange
            case "Assigned":
                return "#007bff"; // blue
            case "Completed":
                return "#17cf17"; // green
            case "Cancelled":
                return "#ef1d1d"
            default:
                return "#444"; // gray
        }
    };

    return (
        <View style={styles.card}>
            <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                    {item.date} • {item.time}
                </Text>
                <Text style={styles.address} numberOfLines={2}>
                    {item.address}
                </Text>
                <Text style={styles.sub}>{item.wasteType || "General waste"}</Text>
            </View>
            <View style={{ marginLeft: 12 }}>
                <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
                    {item.status}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderColor: "#eee",
        borderWidth: 1,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    title: { fontWeight: "700", color: "#111" },
    address: { color: "#666", marginTop: 6, maxWidth: 260 },
    sub: { color: "#888", marginTop: 8, fontSize: 12 },
    status: { fontWeight: "700" },
});
