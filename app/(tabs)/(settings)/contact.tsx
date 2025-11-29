import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
    Animated
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/Firebase/firebaseConfig";
import styles from "./style";
import {router} from "expo-router";
export default function ContactScreen() {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        if (!subject.trim() || !message.trim()) return Alert.alert("Validation", "Please fill subject and message.");
        setLoading(true);
        try {
            const u = auth.currentUser;
            await addDoc(collection(db, "supportMessages"), {
                userId: u?.uid || null,
                email: u?.email || null,
                subject: subject.trim(),
                message: message.trim(),
                createdAt: serverTimestamp(),
            });
            Alert.alert("Thanks", "We received your message and will respond shortly.");
            setSubject("");
            setMessage("");
        } catch (e) {
            console.error("send support", e);
            Alert.alert("Error", "Failed to send message. Try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">


                <Animated.View >
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={styles.title}>Contact Us</Text>
                            <Text style={styles.small}>Describe your issue and we'll get back to you.</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push("/profile")} style={styles.iconBtn} accessibilityLabel="Back">
                            <Text style={styles.icon}>←</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Subject</Text>
                <TextInput style={styles.input} value={subject} onChangeText={setSubject} placeholder="Subject" />

                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Message</Text>
                <TextInput style={[styles.input, { height: 150 }]} value={message} onChangeText={setMessage} placeholder="Type your message" multiline />

                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={submit} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Send</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

