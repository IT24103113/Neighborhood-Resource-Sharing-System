import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function AdminHomeScreen({ navigation }) {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heading}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>System Management Panel</Text>
      </View>

      <Pressable style={styles.searchBar} onPress={() => navigation.navigate("Search")}>
        <Text style={styles.searchBarText}>Search items and users...</Text>
      </Pressable>

      <View style={styles.quickActionsWrap}>
        <Pressable style={styles.quickActionCard} onPress={() => navigation.navigate("Catalog")}>
          <Text style={styles.quickActionTitle}>Browse Catalog</Text>
          <Text style={styles.quickActionText}>Inspect and moderate listed items.</Text>
        </Pressable>
        <Pressable style={styles.quickActionCard} onPress={() => navigation.navigate("UsersManagement")}>
          <Text style={styles.quickActionTitle}>Manage Users</Text>
          <Text style={styles.quickActionText}>Control user accounts and permissions.</Text>
        </Pressable>
        <Pressable style={styles.quickActionCard} onPress={() => navigation.navigate("IncomingRequests")}>
          <Text style={styles.quickActionTitle}>Global Requests</Text>
          <Text style={styles.quickActionText}>Monitor and manage system-wide borrow requests.</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#f7fbf8"
  },
  heroCard: {
    backgroundColor: "#2a6f5b",
    borderRadius: 14,
    padding: 24,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  heading: {
    fontSize: 28,
    color: "#ffffff",
    fontWeight: "800",
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: "#d1e7df",
    fontWeight: "600"
  },
  searchBar: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c7ddd3",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16
  },
  searchBarText: {
    color: "#406358",
    fontSize: 16,
    fontWeight: "500"
  },
  quickActionsWrap: {
    gap: 12
  },
  quickActionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d8e8e0",
    padding: 20,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2
  },
  quickActionTitle: {
    color: "#1f4237",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6
  },
  quickActionText: {
    color: "#4b6b60",
    fontSize: 14,
    lineHeight: 20
  }
});