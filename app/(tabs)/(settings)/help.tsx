import React from "react";
import {View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Animated} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {router, useRouter} from "expo-router";
import styles from "./style"

const FAQS = [
    { q: "How do I schedule a pickup?", a: "Tap Request Pickup on the Home screen and choose a date/time." },
    { q: "Can I reschedule?", a: "Yes — go to My Pickups and modify upcoming requests." },
    { q: "How are fees calculated?", a: "Fees depend on waste type and distance. You’ll see a price when requesting." },
];

export default function HelpScreen() {
    const router = useRouter();
    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container}>
                <Animated.View >
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={styles.title}>Help & Support</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push("/profile")} style={styles.iconBtn} accessibilityLabel="Back">
                            <Text style={styles.icon}>←</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                <View style={{ marginTop: 12 }}>
                    {FAQS.map((f, i) => (
                        <TouchableOpacity key={i} style={styles.card} onPress={() => Alert.alert(f.q, f.a)}>
                            <Text style={styles.cardTitle}>{f.q}</Text>
                            <Text style={styles.cardSub}>Tap to view answer</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 18 }]} onPress={() => router.push("/contact")}>
                    <Text style={styles.primaryBtnText}>Contact support</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
