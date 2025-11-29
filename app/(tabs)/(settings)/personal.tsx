import React, {useEffect, useState, useCallback, useRef} from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "@/Firebase/firebaseConfig";
import { getUserDoc, updateUserDoc } from "@/services/authService";
import { updateProfile } from "firebase/auth";
import {router} from "expo-router";
import  styles  from "./style"
export default function PersonalScreen() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [photoURL, setPhotoURL] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const u = auth.currentUser;
            if (!u) return;
            const doc = await getUserDoc(u.uid);
            setName((doc && doc.name) || u.displayName || "");
            setPhone((doc && doc.phone) || "");
            setAddress((doc && doc.address) || "");
            setPhotoURL((doc && doc.photoURL) || u.photoURL || null);
        } catch (e) {
            console.error("load personal", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const onSave = async () => {
        if (!name.trim()) return Alert.alert("Validation", "Please enter your full name.");
        if (phone && !/^\+?\d{7,15}$/.test(phone.replace(/\s+/g, "")))
            return Alert.alert("Validation", "Phone number looks invalid (digits only).");

        setSaving(true);
        try {
            const u = auth.currentUser;
            if (!u) throw new Error("Not authenticated.");

            // update auth profile (displayName)
            try {
                await updateProfile(u, { displayName: name.trim(), photoURL: photoURL || undefined });
            } catch (e) {
                console.warn("updateProfile warning", e);
            }

            // update firestore doc
            await updateUserDoc(u.uid, {
                name: name.trim(),
                phone: phone.trim(),
                address: address.trim(),
                photoURL: photoURL || null,
                updatedAt: new Date().toISOString(),
            });

            Alert.alert("Saved", "Personal information updated.");
        } catch (e) {
            console.error("save personal", e);
            Alert.alert("Error", "Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    if (loading)
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#17cf17" />
                </View>
            </SafeAreaView>
        );

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.container}>
                    <Animated.View >
                        <View style={styles.headerRow}>
                            <View>
                                <Text style={styles.title}>Personal Information</Text>
                                <Text style={styles.small}>Keep your profile up to date.</Text>
                            </View>
                            <TouchableOpacity onPress={() => router.push("/profile")} style={styles.iconBtn} accessibilityLabel="Back">
                                <Text style={styles.icon}>←</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>


                    <Text style={styles.fieldLabel}>Full name</Text>
                    <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Full name" />

                    <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Phone</Text>
                    <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

                    <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Address</Text>
                    <TextInput style={[styles.input, { height: 100 }]} value={address} onChangeText={setAddress} multiline />

                    <TouchableOpacity style={[styles.primaryBtn, { marginTop: 18 }]} onPress={onSave} disabled={saving}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save changes</Text>}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

