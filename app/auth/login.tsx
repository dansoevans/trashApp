import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { loginUser } from "../../services/authService";
import { useNavigation } from "@react-navigation/native";

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await loginUser(email, password);
    } catch (e: any) {
      Alert.alert("Login Failed", e.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#121212", justifyContent: "center", padding: 20 }}>
      <Text style={{ color: "#fff", fontSize: 28, fontWeight: "bold", marginBottom: 20 }}>Welcome Back</Text>
      <TextInput
        placeholder="Email"
        placeholderTextColor="#aaa"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#aaa"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("auth/signup" as never)}>
        <Text style={{ color: "#00e060", textAlign: "center", marginTop: 15 }}>Create an account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  input: {
    backgroundColor: "#1f1f1f",
    color: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#00e060",
    alignItems: "center" as "flex-start" | "flex-end" | "center" | "stretch" | "baseline",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
};
