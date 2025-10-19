
// app/index.tsx
import React from "react";
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeContext";
import { APP_NAME } from "@/constants";

export default function Welcome() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ImageBackground
        source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAdKVu1sBAa4Y3fyZFvrdmlHLiKMQzPr3Gt1GGqpDJ0OHBCPLWp79qpsLcb6ZDTnOfvSxIqgBJWprRN4Vgtn237BybuOGgKtmIM8OgbbjtS1fqzwXmUXi7tyJK0x7TNpsfo83rD_kJmQwS0xlLeAkZWn7jeIm8PF8UrNCTAxfc4UHoOvPBBhvURzXkZk4VvcK9PUxVjEvQ5kWX4nHngbLFNmDxGcWOeXFuRCvbbJbyw1o_Ujzhhdcy7guCI9A9ZteZZqhp7NghMnh7O" }}
        style={styles.hero}
        resizeMode="cover"
      />
      <View style={styles.body}>
        <Text style={[styles.title, { color: theme.text }]}>{APP_NAME}</Text>
        <Text style={[styles.desc, { color: theme.muted }]}>
          Request garbage collection with fair pricing. Quick, reliable pickups.
        </Text>

        <TouchableOpacity style={[styles.cta, { backgroundColor: theme.primary }]} onPress={() => router.push("/home")}>
          <Text style={[styles.ctaText]}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  hero: { height: 260, width: "100%" },
  body: { flex: 1, padding: 20, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 32, fontFamily: "WorkSans_700Bold", marginBottom: 8 },
  desc: { fontSize: 15, textAlign: "center", maxWidth: 560, marginBottom: 20 },
  cta: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  ctaText: { color: "black", fontWeight: "700" },
});
