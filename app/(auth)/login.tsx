// app/(auth)/login.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/Firebase/firebaseConfig";
import { useRouter, Link } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Missing Fields", "Please fill in all fields.");
            return;
        }

        try {
            setLoading(true);
            await signInWithEmailAndPassword(auth, email.trim(), password);
            await AsyncStorage.setItem("lastActive", Date.now().toString());
            router.replace("/(tabs)/home");
        } catch (error: any) {
            Alert.alert("Login Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome Back 👋</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            <TextInput
                placeholder="Email"
                placeholderTextColor="#999"
                style={styles.input}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />

            <TextInput
                placeholder="Password"
                placeholderTextColor="#999"
                style={styles.input}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <TouchableOpacity onPress={handleLogin} style={styles.button} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
            </TouchableOpacity>

            <Text style={styles.footer}>
                Don't have an account?{" "}
                <Link href="/signup" style={{ color: "#16a34a", fontWeight: "600" }}>
                    Sign Up
                </Link>
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", backgroundColor: "#f6f8f6", padding: 25 },
    title: { fontSize: 28, fontWeight: "700", color: "#111" },
    subtitle: { color: "#555", marginBottom: 30 },
    input: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    button: {
        backgroundColor: "#16a34a",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10,
    },
    buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
    footer: { marginTop: 20, textAlign: "center", color: "#444" },
});
