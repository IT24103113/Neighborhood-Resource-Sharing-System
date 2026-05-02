import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, TextInput, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, Pressable, ActivityIndicator,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getConversationMessages, sendConversationMessage, startConversation } from "../services/api";
import { useAuth } from "../context/AuthContext";
import socket from "../services/socket";

export default function ChatScreen({ route, navigation }) {
  const { conversationId: initialConvId, receiverId, receiverName } = route.params;
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();

  const [messages, setMessages]     = useState([]);
  const [inputText, setInputText]   = useState("");
  const [loading, setLoading]       = useState(true);
  const [convId, setConvId]         = useState(initialConvId || null);
  const flatListRef = useRef(null);

  // Set navigation header title to the other person's name
  useEffect(() => {
    if (receiverName) navigation.setOptions({ title: receiverName });
  }, [receiverName, navigation]);

  const loadMessages = useCallback(async (cId) => {
    if (!cId) { setLoading(false); return; }
    try {
      const data = await getConversationMessages(token, cId);
      // Backend returns { messages: [...] }
      setMessages(Array.isArray(data) ? data : data?.messages || []);
    } catch (e) {
      console.error("Load messages failed:", e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // Start conversation with the owner if no conversationId provided
    if (convId) {
      loadMessages(convId);
    } else if (receiverId) {
      startConversation(token, receiverId)
        .then(res => {
          // Backend returns { conversation: {...} }
          const newId = res?.conversation?._id || res?._id;
          setConvId(newId);
          return loadMessages(newId);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [convId, receiverId, token, loadMessages]);

  // Real-time: listen for incoming messages
  useEffect(() => {
    if (!convId) return;
    socket.emit("join_chat", user?._id);

    // Backend emits 'message:new' (not 'message:received')
    const handler = ({ message: msg, conversation_id }) => {
      if (conversation_id === convId) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };

    socket.on("message:new", handler);
    return () => socket.off("message:new", handler);
  }, [convId, user?._id]);

  const handleSend = async () => {
    const content = inputText.trim();
    if (!content || !convId) return;
    setInputText("");

    try {
      // Backend sendConversationMessage accepts (token, convId, text)
      const newMsg = await sendConversationMessage(token, convId, content);
      // Backend returns { message: {...} }
      const msg = newMsg?.message || newMsg;
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    } catch (e) {
      console.error("Send failed:", e.message);
    }
  };

  const renderMessage = ({ item }) => {
    // sender_id can be object (populated) or string
    const senderId = item.sender_id?._id || item.sender_id;
    const isMine = senderId?.toString() === user?._id?.toString();
    return (
      <View style={[styles.msgRow, isMine ? styles.myRow : styles.theirRow]}>
        {!isMine && (
          <View style={styles.miniAvatar}>
            <Text style={styles.miniAvatarChar}>{(receiverName || "Neighbor").charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
          {/* Backend stores message body as 'text', not 'content' */}
          <Text style={[styles.msgText, isMine ? styles.myText : styles.theirText]}>
            {item.text || item.content}
          </Text>
          <Text style={[styles.msgTime, isMine ? styles.myTime : styles.theirTime]}>
            {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#1f6f59" /></View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={i => i._id || String(Math.random())}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={<Text style={styles.empty}>No messages yet. Say hi!</Text>}
        />
      )}

      {/* Input */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#aac5bc"
          value={inputText}
          onChangeText={setInputText}
          multiline
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <Pressable
          style={[styles.sendBtn, !inputText.trim() && styles.sendDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f9f7" },
  center:    { flex: 1, justifyContent: "center", alignItems: "center" },
  list:      { padding: 16, paddingBottom: 8 },
  empty:     { textAlign: "center", color: "#aac5bc", marginTop: 80, fontSize: 14 },

  msgRow:   { flexDirection: "row", marginBottom: 12, alignItems: "flex-end" },
  myRow:    { justifyContent: "flex-end" },
  theirRow: { justifyContent: "flex-start" },

  miniAvatar:     { width: 28, height: 28, borderRadius: 14, backgroundColor: "#d4f0e8", alignItems: "center", justifyContent: "center", marginRight: 8 },
  miniAvatarChar: { fontSize: 11, fontWeight: "800", color: "#1f6f59" },

  bubble:     { maxWidth: "75%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  myBubble:   { backgroundColor: "#1f6f59", borderBottomRightRadius: 4 },
  theirBubble:{ backgroundColor: "#fff", borderBottomLeftRadius: 4, borderWidth: 1, borderColor: "#e5eee9" },

  msgText:   { fontSize: 15, lineHeight: 20 },
  myText:    { color: "#fff" },
  theirText: { color: "#1a2e28" },

  msgTime:   { fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
  myTime:    { color: "rgba(255,255,255,0.6)" },
  theirTime: { color: "#aac5bc" },

  inputBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", paddingHorizontal: 16,
    paddingTop: 12, paddingBottom: Platform.OS === "ios" ? 28 : 12,
    borderTopWidth: 1, borderTopColor: "#f0f4f2",
  },
  input:       { flex: 1, backgroundColor: "#f5f9f7", borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: "#1a2e28", maxHeight: 100, marginRight: 10, borderWidth: 1, borderColor: "#e5eee9" },
  sendBtn:     { width: 42, height: 42, borderRadius: 21, backgroundColor: "#1f6f59", alignItems: "center", justifyContent: "center" },
  sendDisabled:{ backgroundColor: "#c4d9d2" },
});