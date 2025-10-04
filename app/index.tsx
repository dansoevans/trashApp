import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAdKVu1sBAa4Y3fyZFvrdmlHLiKMQzPr3Gt1GGqpDJ0OHBCPLWp79qpsLcb6ZDTnOfvSxIqgBJWprRN4Vgtn237BybuOGgKtmIM8OgbbjtS1fqzwXmUXi7tyJK0x7TNpsfo83rD_kJmQwS0xlLeAkZWn7jeIm8PF8UrNCTAxfc4UHoOvPBBhvURzXkZk4VvcK9PUxVjEvQ5kWX4nHngbLFNmDxGcWOeXFuRCvbbJbyw1o_Ujzhhdcy7guCI9A9ZteZZqhp7NghMnh7O",
        }}
        style={styles.headerImage}
      />
      <Text style={styles.title}>Welcome to TrashAway</Text>
      <Text style={styles.subtitle}>
        Request garbage collection services with ease. Pricing is based on
        weight, ensuring fair and transparent costs.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/request")}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f8f6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  headerImage: {
    width: "100%",
    height: 250,
    borderRadius: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#111811",
    marginTop: 24,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginVertical: 12,
    color: "#333",
  },
  button: {
    backgroundColor: "#17cf17",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    marginTop: 30,
    width: "100%",
  },
  buttonText: {
    textAlign: "center",
    color: "#112111",
    fontWeight: "bold",
    fontSize: 16,
  },
});
