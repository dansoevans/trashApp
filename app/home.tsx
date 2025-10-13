import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";

export default function HomeScreen() {
  const navigation = useNavigation();
  const auth = getAuth();
  const [userName, setUserName] = useState("User");
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        const name = user.email.split("@")[0];
        setUserName(name.charAt(0).toUpperCase() + name.slice(1));
      }
    });

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    return unsubscribe;
  }, []);

  const features = [
    {
      title: "Request Pickup",
      icon: "trash-outline",
      color: "#00c26e",
      onPress: () => navigation.navigate("Request" as never),
    },
    {
      title: "My Requests",
      icon: "time-outline",
      color: "#008f52",
      onPress: () => navigation.navigate("History" as never),
    },
    {
      title: "Booking Calendar",
      icon: "calendar-outline",
      color: "#00b36e",
      onPress: () => navigation.navigate("Request" as never),
    },
    {
      title: "Account Settings",
      icon: "person-outline",
      color: "#00693c",
      onPress: () => navigation.navigate("Account" as never),
    },
  ];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
        <Text style={styles.headerText}>Welcome,</Text>
        <Text style={styles.username}>{userName} 👋</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {features.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { borderColor: item.color }]}
            activeOpacity={0.8}
            onPress={item.onPress}
          >
            <Ionicons name={item.icon as any} size={32} color={item.color} />
            <Text style={styles.cardTitle}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerText: {
    fontSize: 22,
    color: "#333",
    fontWeight: "500",
  },
  username: {
    fontSize: 26,
    fontWeight: "700",
    color: "#00b26f",
    marginTop: 4,
  },
  scrollContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 40,
  },
  card: {
    width: "47%",
    backgroundColor: "#f9f9f9",
    borderRadius: 20,
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 2,
    shadowColor: "#00b26f",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
});
