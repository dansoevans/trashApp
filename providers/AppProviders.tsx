// providers/AppProviders.tsx
import React from "react";
import { View, ActivityIndicator } from "react-native";
import { ThemeProvider } from "../theme/ThemeContext";
import {
  useFonts,
  WorkSans_400Regular,
  WorkSans_600SemiBold,
  WorkSans_700Bold,
} from "@expo-google-fonts/work-sans";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [fontsLoaded] = useFonts({
    WorkSans_400Regular,
    WorkSans_600SemiBold,
    WorkSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#17cf17" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <>{children}</>
    </ThemeProvider>
  );
}
