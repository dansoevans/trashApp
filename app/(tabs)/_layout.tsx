// app/(tabs)/_layout.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Tabs, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

function CustomHeader() {
    const pathname = usePathname();
    const routeName = (pathname || "").split("/").pop() || "home";
    const titles: Record<string, string> = {
        home: "Home",
        request: "Request Pickup",
        history: "History",
        account: "My Account",
    };
    return (
        <SafeAreaView edges={["top"]} style={styles.headerContainer}>
            <Text style={styles.headerTitle}>{titles[routeName] || "Home"}</Text>
        </SafeAreaView>
    );
}

export default function TabsLayout() {
    return (
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
            <CustomHeader />
            <Tabs
                screenOptions={({ route }) => ({
                    headerShown: false,
                    gestureEnabled: false,
                    tabBarStyle: {
                        backgroundColor: "#f6f8f6",
                        borderTopColor: "#e5e5e5",
                        height: 65,
                    },
                    tabBarActiveTintColor: "#17cf17",
                    tabBarInactiveTintColor: "#666",
                    tabBarIcon: ({ color, focused }) => {
                        let name: any = "home-outline";
                        if (route.name === "home") name = focused ? "home" : "home-outline";
                        else if (route.name === "request") name = focused ? "cube" : "cube-outline";
                        else if (route.name === "history") name = focused ? "time" : "time-outline";
                        else if (route.name === "account") name = focused ? "person" : "person-outline";
                        return <Ionicons name={name} size={22} color={color} />;
                    },
                })}
            >
                <Tabs.Screen name="home" options={{ title: "Home" }} />
                <Tabs.Screen name="request" options={{ title: "Request" }} />
                <Tabs.Screen name="history" options={{ title: "History" }} />
                <Tabs.Screen name="account" options={{ title: "Account" }} />
            </Tabs>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        borderBottomColor: "#e5e5e5",
        borderBottomWidth: 1,
        paddingVertical: 14,
        elevation: 3,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#17cf17",
    },
});
