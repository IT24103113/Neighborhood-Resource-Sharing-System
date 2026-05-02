import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

const ACTIONS = [
  { label: "Browse Items",     sub: "Find tools nearby",         icon: "compass", route: "Catalog" },
  { label: "Share an Item",    sub: "List something you own",    icon: "plus-circle", route: "CreateItem" },
  { label: "My Requests",      sub: "Items I am borrowing",      icon: "upload-cloud", route: "Requests" },
  { label: "Incoming Requests", sub: "People borrowing from me",  icon: "download-cloud", route: "IncomingRequests" },
];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetName}>Hi, {user?.name?.split(" ")[0] || "there"}</Text>
        <Text style={styles.greetSub}>What do you need today?</Text>
      </View>

      {/* Actions */}
      {ACTIONS.map((a) => (
        <Pressable key={a.route} style={styles.card} onPress={() => navigation.navigate(a.route)}>
          <View style={styles.cardIcon}>
            <Feather name={a.icon} size={20} color="#1f6f59" />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardLabel}>{a.label}</Text>
            <Text style={styles.cardSub}>{a.sub}</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#c4d9d2" />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  content:   { padding: 20, paddingBottom: 150 },

  greeting:  { marginBottom: 24 },
  greetName: { fontSize: 26, fontWeight: "800", color: "#1a2e28" },
  greetSub:  { fontSize: 15, color: "#7a9e94", marginTop: 2 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#edf2f0",
  },
  cardIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: "#f0faf6",
    alignItems: "center", justifyContent: "center",
    marginRight: 14,
  },
  cardText:  { flex: 1 },
  cardLabel: { fontSize: 16, fontWeight: "700", color: "#1a2e28" },
  cardSub:   { fontSize: 13, color: "#7a9e94", marginTop: 2 },
});
