// app/(tabs)/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={({ route }) => ({
                headerShown: false,
                gestureEnabled: false, // disable swipe-back
                tabBarStyle: { backgroundColor: "#fff", height: 64 },
                tabBarActiveTintColor: "#17cf17",
                tabBarInactiveTintColor: "#666",
                tabBarIcon: ({ color, focused }) => {
                    let name = "home-outline";
                    if (route.name === "home") name = focused ? "home" : "home-outline";
                    if (route.name === "request") name = focused ? "cube" : "cube-outline";
                    if (route.name === "history") name = focused ? "time" : "time-outline";
                    if (route.name === "profile") name = focused ? "person" : "person-outline";

                    return <Ionicons name={name as any} size={20} color={color} />;
                },
            })}
        >
            <Tabs.Screen name="home" />
            <Tabs.Screen name="request" />
            <Tabs.Screen name="history" />
            <Tabs.Screen name="profile" />
            <Tabs.Screen name = "(settings)" options={{ href: null}} />
            <Tabs.Screen name = "requestDetails" options={{ href: null}} />
            <Tabs.Screen name = "notifications" options={{ href: null}} />
        </Tabs>
    );
}
