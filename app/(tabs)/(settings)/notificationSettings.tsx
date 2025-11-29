import React, { useEffect, useState } from "react";
import {View, Text, Switch, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Animated} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { auth } from "@/Firebase/firebaseConfig";
import { getUserDoc, updateUserDoc } from "@/services/authService";
import styles from "./style"
import {router} from "expo-router";
export default function NotificationsScreen() {
    const [loading, setLoading] = useState(true);
    const [pushNotif, setPushNotif] = useState(true);
    const [emailNotif, setEmailNotif] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const u = auth.currentUser;
                if (!u) return;
                const doc = await getUserDoc(u.uid);
                const prefs = (doc && doc.prefs) || {};
                setPushNotif(prefs.pushNotif ?? true);
                setEmailNotif(prefs.emailNotif ?? true);
            } catch (e) {
                console.error("load notifications", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const requestPushPermission = async () => {
        try {
            const { status } = await Notifications.getPermissionsAsync();
            if (status !== "granted") {
                const res = await Notifications.requestPermissionsAsync();
                return res.status === "granted";
            }
            return true;
        } catch (e) {
            console.warn("push permission error", e);
            return false;
        }
    };

    const save = async () => {
        setSaving(true);
        try {
            if (pushNotif) {
                const ok = await requestPushPermission();
                if (!ok) {
                    Alert.alert("Permission denied", "Push notifications permission not granted.");
                    setPushNotif(false);
                }
            }
            const u = auth.currentUser;
            if (!u) throw new Error("Not signed in.");
            await updateUserDoc(u.uid, { prefs: { ...( (await getUserDoc(u.uid))?.prefs || {} ), pushNotif, emailNotif }, updatedAt: new Date().toISOString() });
            Alert.alert("Saved", "Notification settings updated.");
        } catch (e) {
            console.error("save notifications", e);
            Alert.alert("Error", "Failed to save notification settings.");
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
                            <Text style={styles.title}>Notifications</Text>
                            <Text style={styles.small}>Control Alerts and reminders.</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push("/profile")} style={styles.iconBtn} accessibilityLabel="Back">
                            <Text style={styles.icon}>←</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
                <View style={{ height: 12 }} />

                <View style={styles.rowPlain}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>Push notifications</Text>
                        <Text style={styles.rowSubtitle}>Receive reminders and updates</Text>
                    </View>
                    <Switch value={pushNotif} onValueChange={setPushNotif} />
                </View>

                <View style={styles.rowPlain}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>Email notifications</Text>
                        <Text style={styles.rowSubtitle}>Promotions and receipts</Text>
                    </View>
                    <Switch value={emailNotif} onValueChange={setEmailNotif} />
                </View>

                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 18 }]} onPress={save} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
