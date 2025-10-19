// app/_layout.tsx
import React, { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/Firebase/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator, Text } from "react-native";

const MAX_INACTIVE_DAYS = 30;

export default function RootLayout() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("Auth listener starting...");
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("Auth state changed:", user ? "LOGGED IN" : "LOGGED OUT");

            try {
                if (user) {
                    const now = Date.now();
                    const lastActive = await AsyncStorage.getItem("lastActive");
                    const expired =
                        lastActive && now - parseInt(lastActive) > MAX_INACTIVE_DAYS * 24 * 60 * 60 * 1000;

                    if (expired) {
                        console.log("Session expired. Logging out...");
                        await auth.signOut();
                        await AsyncStorage.removeItem("lastActive");
                        router.replace("/(auth)/login");
                    } else {
                        console.log("User active, routing to home...");
                        await AsyncStorage.setItem("lastActive", now.toString());
                        router.replace("/(tabs)/home");
                    }
                } else {
                    console.log("No user, routing to login...");
                    router.replace("/(auth)/login");
                }
            } catch (err) {
                console.error("Auth routing error:", err);
            } finally {
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    // if (loading) {
    //     return (
    //         <View
    //             style={{
    //                 flex: 1,
    //                 justifyContent: "center",
    //                 alignItems: "center",
    //                 backgroundColor: "#f6f8f6",
    //             }}
    //         >
    //             <ActivityIndicator size="large" color="#16a34a" />
    //             <Text style={{ marginTop: 10, color: "#333" }}>Loading app...</Text>
    //         </View>
    //     );
    // }

    return <Stack screenOptions={{ headerShown: false }} />;
}
