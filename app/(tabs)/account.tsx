// app/(tabs)/account.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "@/Firebase/firebaseConfig";
import { logoutUser, getUserDoc } from "@/services/authService";
import { useRouter } from "expo-router";

export default function AccountScreen() {
    const router = useRouter();
    const [userDoc, setUserDoc] = useState<any>(null);

    useEffect(() => {
        const load = async () => {
            const u = auth.currentUser;
            if (!u) return;
            const doc = await getUserDoc(u.uid);
            setUserDoc(doc || { name: u.displayName, email: u.email });
        };
        load();
    }, []);

    const handleLogout = async () => {
        try {
            await logoutUser();
            router.replace("/login");
        } catch (e) {
            Alert.alert("Error", "Failed to logout. Try again.");
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
            <View style={styles.container}>
                <Text style={styles.title}>My Account</Text>

                <View style={styles.card}>
                    <Text style={styles.label}>Name</Text>
                    <Text style={styles.value}>{userDoc?.name || auth.currentUser?.displayName || "—"}</Text>

                    <Text style={[styles.label, { marginTop: 12 }]}>Email</Text>
                    <Text style={styles.value}>{userDoc?.email || auth.currentUser?.email}</Text>
                </View>

                <TouchableOpacity style={styles.logout} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#fff" },
    container: { padding: 20 },
    title: { fontSize: 22, fontWeight: "700", color: "#17cf17", marginBottom: 16 },
    card: { backgroundColor: "#f8f8f8", padding: 14, borderRadius: 10 },
    label: { color: "#666", fontWeight: "600" },
    value: { marginTop: 6, fontSize: 16, color: "#111", fontWeight: "600" },
    logout: { marginTop: 30, backgroundColor: "#ffdddd", padding: 12, borderRadius: 10, alignItems: "center" },
    logoutText: { color: "#cc2222", fontWeight: "700" },
});
