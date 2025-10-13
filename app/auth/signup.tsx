import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { registerUser } from "../../services/authService";
import { useNavigation } from "@react-navigation/native";

export default function SignupScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    try {
      await registerUser(email, password, name);
    } catch (e: any) {
      Alert.alert("Signup Failed", e.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#121212", justifyContent: "center", padding: 20 }}>
      <Text style={{ color: "#fff", fontSize: 28, fontWeight: "bold", marginBottom: 20 }}>Create Account</Text>
      <TextInput
        placeholder="Full Name"
        placeholderTextColor="#aaa"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />
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

      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("auth/login" as never)}>
        <Text style={{ color: "#00e060", textAlign: "center", marginTop: 15 }}>Already have an account? Login</Text>
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
    alignItems: "center" as 'center', // Ensure alignItems is a valid type
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
};
