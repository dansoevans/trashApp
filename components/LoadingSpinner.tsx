// components/LoadingSpinner.tsx
import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";

interface LoadingSpinnerProps {
    size?: "small" | "large";
    color?: string;
    text?: string;
}

export default function LoadingSpinner({
                                           size = "large",
                                           color = "#10B981",
                                           text
                                       }: LoadingSpinnerProps) {
    return (
        <View style={styles.container}>
            <ActivityIndicator size={size} color={color} />
            {text && <Text style={styles.text}>{text}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    text: {
        marginTop: 12,
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
    },
});