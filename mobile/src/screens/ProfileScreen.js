import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

function MenuItem({ icon, label, onPress, danger }) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <Feather name={icon} size={18} color={danger ? "#e53e3e" : "#1f6f59"} style={styles.menuIcon} />
      <Text style={[styles.menuLabel, danger && styles.dangerText]}>{label}</Text>
      {!danger && <Feather name="chevron-right" size={16} color="#c4d9d2" />}
    </Pressable>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();

  const confirmLogout = () =>
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar + name */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarChar}>{(user?.name || "Neighbor").charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name || "Community Member"}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.rolePill}><Text style={styles.roleText}>{user?.role || "member"}</Text></View>
      </View>

      {/* My Activity */}
      <Text style={styles.section}>My Activity</Text>
      <View style={styles.card}>
        <MenuItem icon="package"       label="My Listings"       onPress={() => navigation.navigate("MyItems")} />
        <View style={styles.div} />
        <MenuItem icon="download"      label="My Requests"       onPress={() => navigation.navigate("Requests")} />
        <View style={styles.div} />
        <MenuItem icon="inbox"         label="Incoming Requests" onPress={() => navigation.navigate("IncomingRequests")} />
      </View>

      {/* Settings */}
      <Text style={styles.section}>Settings</Text>
      <View style={styles.card}>
        <MenuItem icon="log-out" label="Sign Out" onPress={confirmLogout} danger />
      </View>

      <Text style={styles.version}>Nearshare v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  content:   { padding: 20, paddingBottom: 150 },

  header:     { alignItems: "center", marginBottom: 32, paddingTop: 12 },
  avatar:     { width: 80, height: 80, borderRadius: 40, backgroundColor: "#d4f0e8", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarChar: { fontSize: 32, fontWeight: "800", color: "#1f6f59" },
  name:       { fontSize: 20, fontWeight: "800", color: "#1a2e28" },
  email:      { fontSize: 13, color: "#7a9e94", marginTop: 2 },
  rolePill:   { marginTop: 8, backgroundColor: "#f0faf6", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  roleText:   { fontSize: 11, fontWeight: "700", color: "#1f6f59", textTransform: "uppercase" },

  section: { fontSize: 11, fontWeight: "700", color: "#7a9e94", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginLeft: 4 },

  card: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#edf2f0", overflow: "hidden", marginBottom: 24 },
  div:  { height: 1, backgroundColor: "#f0f4f2", marginLeft: 52 },

  menuItem:  { flexDirection: "row", alignItems: "center", padding: 16 },
  menuIcon:  { marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: "#1a2e28" },
  dangerText:{ color: "#e53e3e" },

  version: { textAlign: "center", color: "#aac5bc", fontSize: 12, marginTop: 8 },
});
