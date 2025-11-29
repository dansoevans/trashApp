import React, { useEffect, useState } from "react";
import {View, Text, Switch, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Animated} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "@/Firebase/firebaseConfig";
import { getUserDoc, updateUserDoc } from "@/services/authService";
import styles from "./style";
import {router} from "expo-router";
export default function PrivacyScreen() {
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(true);
    const [shareData, setShareData] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const u = auth.currentUser;
                if (!u) return;
                const doc = await getUserDoc(u.uid);
                const prefs = (doc && doc.prefs) || {};
                setAnalytics(prefs.analytics ?? true);
                setShareData(prefs.shareData ?? false);
            } catch (e) {
                console.error("load privacy", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            const u = auth.currentUser;
            if (!u) throw new Error("Not signed in.");
            await updateUserDoc(u.uid, { prefs: { ...( (await getUserDoc(u.uid))?.prefs || {} ), analytics, shareData }, updatedAt: new Date().toISOString() });
            Alert.alert("Saved", "Privacy settings updated.");
        } catch (e) {
            console.error("save privacy", e);
            Alert.alert("Error", "Failed to save privacy settings.");
        } finally {
            setSaving(false);
        }
    };

    if (loading)
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.center}><ActivityIndicator color="#17cf17" /></View>
            </SafeAreaView>
        );

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Animated.View >
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={styles.title}>Privacy Settings</Text>
                            <Text style={styles.small}>Control privacy and data sharing.</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push("/profile")} style={styles.iconBtn} accessibilityLabel="Back">
                            <Text style={styles.icon}>←</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                <View style={{ height: 12 }} />

                <View style={styles.rowPlain}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>Usage analytics</Text>
                        <Text style={styles.rowSubtitle}>Help us improve the app (anonymous)</Text>
                    </View>
                    <Switch value={analytics} onValueChange={setAnalytics} />
                </View>

                <View style={styles.rowPlain}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>Share data with partners</Text>
                        <Text style={styles.rowSubtitle}>Share anonymized data</Text>
                    </View>
                    <Switch value={shareData} onValueChange={setShareData} />
                </View>

                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 18 }]} onPress={save} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

