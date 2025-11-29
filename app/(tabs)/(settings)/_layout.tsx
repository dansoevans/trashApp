// app/(settings)/_layout.tsx
import React from "react";
import { Stack } from "expo-router";

export default function settingsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: "default",
                gestureEnabled : false
            }}
        />

    );
}
