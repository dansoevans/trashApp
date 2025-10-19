import React from "react";
import { View, Text, TouchableOpacity, ImageBackground, ScrollView } from "react-native";
import {router} from "expo-router";

export default function HomeScreen() {
  // @ts-ignore
  let scrollView = <><ScrollView style={{flex: 1, backgroundColor: "#f6f8f6", padding: 20}}>
    <Text style={{fontSize: 28, fontWeight: "700", color: "#000", marginBottom: 6}}>
      Welcome back, Liam
    </Text>
    <Text style={{color: "#444", fontSize: 16}}>Ready to schedule your next pickup?</Text>

    <TouchableOpacity onPress={() => router.push("../request")}
        style={{
          backgroundColor: "#17cf17",
          marginTop: 20,
          borderRadius: 12,
          paddingVertical: 15,
          alignItems: "center",
        }}
    >
      <Text style={{color: "#fff", fontWeight: "700", fontSize: 16}}>
        Request a Pickup
      </Text>
    </TouchableOpacity>

    <View style={{marginTop: 35}}>
      <Text style={{fontSize: 22, fontWeight: "700", color: "#000", marginBottom: 12}}>
        Upcoming Pickups
      </Text>

      <View
          style={{
            borderRadius: 12,
            backgroundColor: "#e6ece6",
            padding: 20,
            alignItems: "center",
          }}
      >
        <ImageBackground
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuD8jRaZMbbGeLad8R700gJi8jrjHI7a2HbEfXmFLcNb-8DldCoGRQsga6HAFoAM0EyQlfrvW1AiE4x_XBgqgZrWa_BuhNpnlKpMyGxCGdE4OJBAsiBkup68U_h6cgK0pAyunrdiJ0Z6JJ7s4eqqgOmEa1rE3tL-hYzXBDdsoCxLOl1WvDFUNYWQ8LkHxKQ2UdQh-3XyJNLcYXHndHBZuNqDs349ItbCl1kZG7MEEGeCvDsSLvO9pDsFtxepnuNgi_XU4-8QFzbkW_go",
            }}
            style={{
              width: "100%",
              height: 180,
              borderRadius: 12,
              overflow: "hidden",
            }}
            imageStyle={{borderRadius: 12}}
        />
        <Text style={{marginTop: 15, fontSize: 18, fontWeight: "700", color: "#000"}}>
          No upcoming pickups
        </Text>
        <Text style={{color: "#666", fontSize: 14, marginTop: 4}}>
          Schedule a pickup to see it here.
        </Text>
      </View>
    </View>

    <View style={{marginTop: 35, marginBottom: 40}}>
      <Text style={{fontSize: 22, fontWeight: "700", color: "#000", marginBottom: 12}}>
        Past Pickups
      </Text>

      <View style={cardStyle}>
        <View>
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#000" }}>Pickup #12345</Text>
          <Text style={statusText}>Completed</Text>
        </View>
        <Text style={{ fontWeight: "600", color: "#000" }}>$25.00</Text>
      </View>

      <View style={cardStyle}>
        <View>
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#000" }}>Pickup #67890</Text>
          <Text style={statusText}>Completed</Text>
        </View>
        <Text style={{ fontWeight: "600", color: "#000" }}>$30.00</Text>
      </View>
    </View>
  </ScrollView></>;
  return scrollView;
}

const cardStyle = {
  backgroundColor: "#e6ece6",
  borderRadius: 12,
  padding: 16,
  flexDirection: "row" as const,
  justifyContent: "space-between" as const,
  alignItems: "center" as const,
  marginBottom: 10,
};

const statusText = { fontSize: 13, color: "#17cf17" };

