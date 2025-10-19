// app/(auth)/signup.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/Firebase/firebaseConfig";
import { setDoc, doc } from "firebase/firestore";
import { useRouter, Link } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SignupScreen() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!name || !email || !password || !confirm) {
            Alert.alert("Missing Fields", "Please fill in all fields.");
            return;
        }
        if (password !== confirm) {
            Alert.alert("Password Mismatch", "Passwords do not match.");
            return;
        }

        try {
            setLoading(true);
            const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
            await updateProfile(userCred.user, { displayName: name });

            await setDoc(doc(db, "users", userCred.user.uid), {
                name,
                email,
                createdAt: new Date(),
            });

            await AsyncStorage.setItem("lastActive", Date.now().toString());
            router.replace("/home");
        } catch (error: any) {
            Alert.alert("Signup Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create Account ✨</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>

            <TextInput placeholder="Full Name" style={styles.input} value={name} onChangeText={setName} />
            <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} />
            <TextInput placeholder="Password" style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
            <TextInput placeholder="Confirm Password" style={styles.input} secureTextEntry value={confirm} onChangeText={setConfirm} />

            <TouchableOpacity onPress={handleSignup} style={styles.button} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
            </TouchableOpacity>

            <Text style={styles.footer}>
                Already have an account?{" "}
                <Link href="/login" style={{ color: "#16a34a", fontWeight: "600" }}>
                    Log In
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
