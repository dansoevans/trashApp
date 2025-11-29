import React, { useEffect, useState, useCallback } from "react";
import {View, Text, Switch, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Animated} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "@/Firebase/firebaseConfig";
import { getUserDoc, updateUserDoc } from "@/services/authService";
import styles from "./style";
import {router} from "expo-router";
export default function PreferencesScreen() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [autoSchedule, setAutoSchedule] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const u = auth.currentUser;
            if (!u) return;
            const doc = await getUserDoc(u.uid);
            const prefs = (doc && doc.prefs) || {};
            setPushEnabled(prefs.pushEnabled ?? true);
            setDarkMode(prefs.darkMode ?? false);
            setAutoSchedule(prefs.autoSchedule ?? false);
        } catch (e) {
            console.error("load prefs", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const save = async () => {
        setSaving(true);
        try {
            const u = auth.currentUser;
            if (!u) throw new Error("Not authenticated.");
            await updateUserDoc(u.uid, { prefs: { pushEnabled, darkMode, autoSchedule }, updatedAt: new Date().toISOString() });
            Alert.alert("Saved", "Preferences updated.");
        } catch (e) {
            console.error("save prefs", e);
            Alert.alert("Error", "Failed to save preferences.");
        } finally {
            setSaving(false);
        }
    };

    if (loading)
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.center}>
                    <ActivityIndicator color="#17cf17" />
                </View>
            </SafeAreaView>
        );

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Animated.View >
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={styles.title}>App Preferences</Text>

                        </View>
                        <TouchableOpacity onPress={() => router.push("/profile")} style={styles.iconBtn} accessibilityLabel="Back">
                            <Text style={styles.icon}>←</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
                <View style={styles.rowPlain}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>Enable push notifications</Text>
                        <Text style={styles.rowSubtitle}>Order updates and reminders</Text>
                    </View>
                    <Switch value={pushEnabled} onValueChange={setPushEnabled} />
                </View>

                <View style={styles.rowPlain}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>Dark mode</Text>
                        <Text style={styles.rowSubtitle}>Use dark theme</Text>
                    </View>
                    <Switch value={darkMode} onValueChange={setDarkMode} />
                </View>

                <View style={styles.rowPlain}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>Auto-schedule</Text>
                        <Text style={styles.rowSubtitle}>Automatically pick suggested slots</Text>
                    </View>
                    <Switch value={autoSchedule} onValueChange={setAutoSchedule} />
                </View>

                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 18 }]} onPress={save} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save preferences</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

