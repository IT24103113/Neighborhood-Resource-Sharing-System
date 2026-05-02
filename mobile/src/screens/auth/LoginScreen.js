import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen({ navigation }) {
  const { signIn, isSubmitting } = useAuth();
  const [email, setEmail]   = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Required", "Please enter your email and password.");
      return;
    }
    try {
      await signIn({ email: email.trim().toLowerCase(), password });
    } catch (e) {
      Alert.alert("Login Failed", e.message || "Invalid credentials.");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Login</Text>
        <Text style={styles.sub}>Welcome back to Nearshare</Text>

        <Text style={styles.label}>Email</Text>
        <View style={styles.field}>
          <TextInput
            style={styles.input}
            placeholder="you@email.com"
            placeholderTextColor="#aac5bc"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.field}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="••••••••"
            placeholderTextColor="#aac5bc"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPw}
          />
          <Pressable onPress={() => setShowPw(!showPw)}>
            <Feather name={showPw ? "eye-off" : "eye"} size={18} color="#aac5bc" />
          </Pressable>
        </View>

        <Pressable
          style={[styles.btn, isSubmitting && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Login</Text>}
        </Pressable>

        <View style={styles.row}>
          <Text style={styles.footerText}>No account? </Text>
          <Pressable onPress={() => navigation.navigate("Register")}>
            <Text style={styles.link}>Create one</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:        { flex: 1, backgroundColor: "#fff" },
  container:   { flexGrow: 1, padding: 28, justifyContent: "center" },

  title: { fontSize: 30, fontWeight: "800", color: "#1a2e28", marginBottom: 4, textAlign: "center" },
  sub:   { fontSize: 15, color: "#7a9e94", marginBottom: 36, textAlign: "center" },

  label: { fontSize: 13, fontWeight: "700", color: "#1a2e28", marginBottom: 8 },
  field: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#f5f9f7", borderRadius: 12,
    paddingHorizontal: 16, height: 54,
    marginBottom: 20, borderWidth: 1, borderColor: "#e5eee9",
  },
  input:   { flex: 1, fontSize: 15, color: "#1a2e28" },

  btn:         { backgroundColor: "#1f6f59", height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 8 },
  btnDisabled: { backgroundColor: "#aac5bc" },
  btnText:     { color: "#fff", fontSize: 16, fontWeight: "700" },

  row:        { flexDirection: "row", justifyContent: "center", marginTop: 28 },
  footerText: { color: "#7a9e94", fontSize: 14 },
  link:       { color: "#1f6f59", fontWeight: "700", fontSize: 14 },
});
