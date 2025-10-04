import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function ConfirmationScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.circle}>
        <Text style={styles.check}>✓</Text>
      </View>
      <Text style={styles.title}>Request Submitted</Text>
      <Text style={styles.subtitle}>
        We've sent you an SMS confirming your request.
      </Text>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/")}>
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f6f8f6", padding: 20 },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#17cf17",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  check: { fontSize: 48, color: "white" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  subtitle: { textAlign: "center", color: "#555", marginBottom: 40 },
  button: { backgroundColor: "#17cf17", padding: 14, borderRadius: 10, width: "100%" },
  buttonText: { textAlign: "center", fontWeight: "bold", color: "black" },
});
