import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList, Pressable, RefreshControl, Text,
  View, StyleSheet, ActivityIndicator,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { getMyConversations } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function ConversationsScreen({ navigation }) {
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refresh, setRefresh]   = useState(false);
  const [error, setError]       = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefresh(true); else setLoading(true);
    setError("");
    try {
      const data = await getMyConversations(token);
      // Backend returns { conversations: [...] }
      setConversations(Array.isArray(data) ? data : data?.conversations || []);
    } catch (e) {
      setError(e.message || "Failed to load conversations.");
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, [token]);

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => load());
    return unsub;
  }, [navigation, load]);

  const renderItem = ({ item }) => {
    const other = item.participants?.find(p => p._id !== user?._id) || { name: "Neighbor" };
    // Backend includes last_message_text and unread_count directly on conversation
    const lastText = item.last_message_text || "No messages yet";
    const unread = (item.unread_count || 0) > 0;

    return (
      <Pressable
        style={[styles.row, unread && styles.unreadRow]}
        onPress={() => navigation.navigate("Chat", { conversationId: item._id, receiverId: other._id, receiverName: other.name })}
      >
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarChar}>{(other.name || "Neighbor").charAt(0).toUpperCase()}</Text>
          {unread && <View style={styles.onlineDot} />}
        </View>

        {/* Body */}
        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text style={[styles.name, unread && styles.nameBold]} numberOfLines={1}>{other.name}</Text>
            <Text style={styles.time}>
              {item.updatedAt
                ? new Date(item.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : ""}
            </Text>
          </View>
          <View style={styles.bottomRow}>
            <Text style={[styles.preview, unread && styles.previewBold]} numberOfLines={1}>
              {lastText}
            </Text>
            {unread && <View style={styles.badge}><Text style={styles.badgeText}>•</Text></View>}
          </View>
        </View>
        <Feather name="chevron-right" size={16} color="#c4d9d2" />
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
      <FlatList
        data={conversations}
        keyExtractor={i => i._id}
        refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => load(true)} colors={["#1f6f59"]} />}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.center}>
            {loading
              ? <ActivityIndicator color="#1f6f59" />
              : <>
                  <Ionicons name="chatbubbles-outline" size={48} color="#d4e8e0" />
                  <Text style={styles.emptyTitle}>No conversations yet</Text>
                  <Text style={styles.emptySub}>Message a neighbor from any item listing.</Text>
                </>
            }
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  list:      { paddingBottom: 150 },
  sep:       { height: 1, backgroundColor: "#f0f4f2" },
  center:    { alignItems: "center", justifyContent: "center", paddingTop: 100 },

  errorBanner: { backgroundColor: "#fef2f2", color: "#c53030", padding: 12, textAlign: "center", fontSize: 13 },

  row:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14 },
  unreadRow: { backgroundColor: "#f5fdf9" },

  avatar:     { width: 50, height: 50, borderRadius: 25, backgroundColor: "#d4f0e8", alignItems: "center", justifyContent: "center", marginRight: 14, position: "relative" },
  avatarChar: { fontSize: 20, fontWeight: "800", color: "#1f6f59" },
  onlineDot:  { position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: "#10b981", borderWidth: 2, borderColor: "#fff" },

  body:    { flex: 1, marginRight: 8 },
  topRow:  { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  bottomRow: { flexDirection: "row", alignItems: "center" },

  name:        { fontSize: 15, fontWeight: "600", color: "#1a2e28", flex: 1 },
  nameBold:    { fontWeight: "800" },
  time:        { fontSize: 11, color: "#aac5bc" },
  preview:     { fontSize: 13, color: "#7a9e94", flex: 1 },
  previewBold: { color: "#1a2e28", fontWeight: "600" },

  badge:     { marginLeft: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: "#1f6f59" },
  badgeText: { display: "none" },

  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#1a2e28", marginTop: 16 },
  emptySub:   { fontSize: 13, color: "#7a9e94", marginTop: 4, textAlign: "center" },
});