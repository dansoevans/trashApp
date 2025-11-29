import React, { useState } from "react";
import {View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Animated} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { reauthAndChangePassword } from "@/services/authService";
import styles from "./style"
import {router} from "expo-router";
export default function PasswordScreen() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const onChange = async () => {
        if (newPassword.length < 8) return Alert.alert("Validation", "Choose a stronger password (8+ chars).");
        setLoading(true);
        try {
            await reauthAndChangePassword(newPassword, currentPassword);
            Alert.alert("Success", "Password changed.");
            setCurrentPassword("");
            setNewPassword("");
        } catch (e: any) {
            console.error("change password", e);
            Alert.alert("Failed", e?.message || "Could not change password. You may need to re-authenticate.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Animated.View >
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={styles.title}>Change Password</Text>
                            <Text style={styles.small}>You may be asked to reauthenticate.</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push("/profile")} style={styles.iconBtn} accessibilityLabel="Back">
                            <Text style={styles.icon}>←</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Current password</Text>
                <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="Current password" />

                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>New password</Text>
                <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="New password" />

                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={onChange} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Change password</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
