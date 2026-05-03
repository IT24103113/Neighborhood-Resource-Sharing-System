import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

// Map each notification "type" string → an icon name from the Feather set.

const TYPE_ICONS = { 
  borrow_request_created: "plus-circle", 
  borrow_request_approved: "check-circle",
  borrow_request_rejected: "x-circle",
  borrow_request_returned: "corner-up-left",
  borrow_request_canceled: "slash",
  borrow_request_priority_changed: "arrow-up",
  message_received: "message-square",
  review_received: "star" 
};

export default function NotificationsScreen() {
  const { token } = useAuth();
  const { unreadCount: globalUnread, decrementUnread, clearUnread, fetchUnreadCount } = useNotifications();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefresh(true); else setLoading(true);
    try {
      const data = await getMyNotifications(token);
      setItems(data?.notifications || []);
      fetchUnreadCount();
    } catch (e) {
      console.error("Notifications load failed:", e.message);
    } finally { setLoading(false); setRefresh(false); }
  }, [token, fetchUnreadCount]);

  useEffect(() => { load(); }, [load]);

  const navigation = useNavigation();

  const handlePress = async (item) => {
    // 1. Mark as read if unread
    if (!item.is_read) {
      try {
        await markNotificationRead(token, item._id);
        setItems(p => p.map(n => n._id === item._id ? { ...n, is_read: true } : n));
        decrementUnread();
      } catch (_) {}
    }

    // 2. Navigate based on type
    const data = item.data || {};
    
    switch (item.type) {
      case "borrow_request_created":
      case "borrow_request_approved":
      case "borrow_request_rejected":
      case "borrow_request_returned":
      case "borrow_request_canceled":
      case "borrow_request_priority_changed":
        if (data.borrow_request_id) {
          navigation.navigate("RequestDetail", { requestId: data.borrow_request_id });
        }
        break;
      case "message_received":
        if (data.conversation_id) {
          navigation.navigate("Chat", { conversationId: data.conversation_id });
        }
        break;
      case "review_received":
        // Navigate to the user's profile to see reviews
        navigation.navigate("Profile");
        break;
      default:
        break;
    }
  };

  const handleMarkAllRead = async () => {
    if (globalUnread === 0) return;
    
    try {
      setLoading(true);
      await markAllNotificationsRead(token);
      setItems(p => p.map(n => ({ ...n, is_read: true })));
      clearUnread();
    } catch (e) {
      Alert.alert("Error", "Failed to mark all as read");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Notifications {globalUnread > 0 && <Text style={styles.badge}>({globalUnread})</Text>}
        </Text>
        {globalUnread > 0 && (
          <Pressable onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={i => i._id}
        refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => load(true)} colors={["#1f6f59"]} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => {
          const icon = TYPE_ICONS[item.type] || "bell";
          return (
            <Pressable style={[styles.row, !item.is_read && styles.unread]} onPress={() => handlePress(item)}>
              <View style={styles.iconWrap}>
                <Feather name={icon} size={18} color="#1f6f59" />
              </View>
              <View style={styles.body}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={[styles.msg, !item.is_read && styles.msgBold]}>{item.body}</Text>
                <Text style={styles.time}>
                  {new Date(item.created_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
              {!item.is_read && <View style={styles.dot} />}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.center}>
            {loading
              ? <ActivityIndicator color="#1f6f59" />
              : <Text style={styles.empty}>All caught up!</Text>}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: 20, 
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f4f2"
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#1a2e28" },
  badge: { color: "#1f6f59" },
  markAllBtn: { padding: 5 },
  markAllText: { color: "#1f6f59", fontWeight: "600", fontSize: 14 },
  list:      { paddingBottom: 150 },
  sep:       { height: 1, backgroundColor: "#f0f4f2" },
  center:    { alignItems: "center", paddingTop: 100 },
  empty:     { color: "#aac5bc", fontSize: 15 },

  row:     { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 20, paddingVertical: 16 },
  unread:  { backgroundColor: "#f5fdf9" },
  iconWrap:{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#f0faf6", alignItems: "center", justifyContent: "center", marginRight: 14, marginTop: 2 },
  body:    { flex: 1 },
  title:   { fontSize: 12, fontWeight: "600", color: "#1f6f59", textTransform: "uppercase", marginBottom: 2 },
  msg:     { fontSize: 14, color: "#4a6a60", lineHeight: 20 },
  msgBold: { fontWeight: "700", color: "#1a2e28" },
  time:    { fontSize: 11, color: "#aac5bc", marginTop: 6 },
  dot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: "#1f6f59", marginLeft: 10, marginTop: 14 },
});
