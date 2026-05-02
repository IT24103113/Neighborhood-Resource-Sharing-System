import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getItemById, createBorrowRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";

const W = Dimensions.get("window").width;

export default function ItemDetailScreen({ route, navigation }) {
  const { itemId } = route.params;
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [item, setItem]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    getItemById(itemId)
      .then(data => setItem(data.item))
      .catch(() => { Alert.alert("Error", "Could not load item."); navigation.goBack(); })
      .finally(() => setLoading(false));
  }, [itemId]);

  const handleRequest = () => {
    Alert.alert("Borrow Request", "Send a request to the owner?", [
      { text: "Cancel", style: "cancel" },
      { text: "Send", onPress: async () => {
          setRequesting(true);
          try {
            await createBorrowRequest(token, { item_id: itemId });
            Alert.alert("Sent!", "Your request has been sent.");
            navigation.navigate("Requests");
          } catch (e) {
            Alert.alert("Error", e.message || "Request failed.");
          } finally { setRequesting(false); }
        }
      }
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#1f6f59" /></View>;

  const img = item?.image_urls?.[0] || item?.images?.[0]?.url || "";
  const owner = item?.owner_id?.name || "Neighbor";

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Image */}
        {img ? (
          <Image source={{ uri: img }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.noImage]}>
            <Feather name="image" size={40} color="#c4d9d2" />
          </View>
        )}

        <View style={styles.body}>
          {/* Category + status */}
          <View style={styles.tags}>
            <Text style={styles.tag}>{item.category || "General"}</Text>
            <Text style={[styles.tag, { backgroundColor: item.is_available ? "#d4f5e4" : "#fee2e2", color: item.is_available ? "#166534" : "#991b1b" }]}>
              {item.is_available ? "Available" : "On Loan"}
            </Text>
          </View>

          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>Condition: <Text style={styles.metaBold}>{(item.condition || "good").replace("_", " ")}</Text></Text>

          {/* Owner */}
          <View style={styles.ownerRow}>
            <View style={styles.avatar}><Text style={styles.avatarChar}>{(owner || "N").charAt(0).toUpperCase()}</Text></View>
            <View>
              <Text style={styles.ownerLabel}>Shared by</Text>
              <Text style={styles.ownerName}>{owner}</Text>
            </View>
            <Pressable style={styles.msgBtn} onPress={() => navigation.navigate("Chat", { receiverId: item.owner_id?._id })}>
              <Feather name="message-square" size={18} color="#1f6f59" />
            </Pressable>
          </View>

          {item.description ? (
            <>
              <Text style={styles.sectionLabel}>About this item</Text>
              <Text style={styles.desc}>{item.description}</Text>
            </>
          ) : null}
        </View>
      </ScrollView>

      {/* Bottom action */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <Pressable
          style={[styles.btn, (!item.is_available || requesting) && styles.btnDisabled]}
          onPress={handleRequest}
          disabled={!item.is_available || requesting}
        >
          {requesting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Request to Borrow</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center:    { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll:    { paddingBottom: 100 },

  image:   { width: W, height: W * 0.65, backgroundColor: "#f5f9f7" },
  noImage: { alignItems: "center", justifyContent: "center" },

  body: { padding: 20 },

  tags: { flexDirection: "row", gap: 8, marginBottom: 14 },
  tag:  { fontSize: 11, fontWeight: "700", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: "#f0faf6", color: "#1f6f59", textTransform: "uppercase" },

  title:    { fontSize: 22, fontWeight: "800", color: "#1a2e28", marginBottom: 6 },
  meta:     { fontSize: 13, color: "#7a9e94", marginBottom: 20, textTransform: "capitalize" },
  metaBold: { fontWeight: "700", color: "#1a2e28" },

  ownerRow:   { flexDirection: "row", alignItems: "center", backgroundColor: "#f5f9f7", padding: 14, borderRadius: 12, marginBottom: 24 },
  avatar:     { width: 40, height: 40, borderRadius: 20, backgroundColor: "#d4f0e8", alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarChar: { fontWeight: "800", fontSize: 16, color: "#1f6f59" },
  ownerLabel: { fontSize: 11, color: "#7a9e94" },
  ownerName:  { fontSize: 15, fontWeight: "700", color: "#1a2e28" },
  msgBtn:     { marginLeft: "auto", padding: 8 },

  sectionLabel: { fontSize: 12, fontWeight: "700", color: "#7a9e94", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  desc:         { fontSize: 15, color: "#4a6a60", lineHeight: 22 },

  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 28, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f0f4f2" },
  btn:         { backgroundColor: "#1f6f59", height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  btnDisabled: { backgroundColor: "#aac5bc" },
  btnText:     { color: "#fff", fontSize: 16, fontWeight: "700" },
});