import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Alert
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

export default function RegisterScreen({ navigation }) {
  const { signUp, isSubmitting } = useAuth();
  
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [address, setAddress]   = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);

  const canSubmit = useMemo(() => {
    return (
      name.trim().length > 1 &&
      email.trim().includes("@") &&
      phone.trim().length > 5 &&
      address.trim().length > 3 &&
      password.length >= 8 &&
      !isSubmitting
    );
  }, [name, email, phone, address, password, isSubmitting]);

  const handleRegister = async () => {
    try {
      await signUp({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        address: address.trim(),
        password
      });
    } catch (e) {
      Alert.alert("Registration Failed", e.message || "Please check your details.");
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.flex} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        contentContainerStyle={styles.container} 
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.sub}>Join your neighborhood sharing network</Text>

        <Text style={styles.label}>Full Name</Text>
        <View style={styles.field}>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            placeholderTextColor="#aac5bc"
            value={name}
            onChangeText={setName}
          />
        </View>

        <Text style={styles.label}>Email Address</Text>
        <View style={styles.field}>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#aac5bc"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.label}>Phone</Text>
            <View style={styles.field}>
              <TextInput
                style={styles.input}
                placeholder="071..."
                placeholderTextColor="#aac5bc"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>
          <View style={{ flex: 1.5 }}>
            <Text style={styles.label}>Address</Text>
            <View style={styles.field}>
              <TextInput
                style={styles.input}
                placeholder="City, Street"
                placeholderTextColor="#aac5bc"
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </View>
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.field}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Min 8 characters"
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
          style={[styles.btn, (!canSubmit || isSubmitting) && styles.btnDisabled]}
          onPress={handleRegister}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Register Now</Text>}
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>Login</Text>
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
  sub:   { fontSize: 15, color: "#7a9e94", marginBottom: 32, textAlign: "center" },

  label: { fontSize: 13, fontWeight: "700", color: "#1a2e28", marginBottom: 8 },
  field: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#f5f9f7", borderRadius: 12,
    paddingHorizontal: 16, height: 52,
    marginBottom: 18, borderWidth: 1, borderColor: "#e5eee9",
  },
  input:   { flex: 1, fontSize: 15, color: "#1a2e28" },
  
  row: { flexDirection: "row" },

  btn:         { backgroundColor: "#1f6f59", height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 12 },
  btnDisabled: { backgroundColor: "#aac5bc" },
  btnText:     { color: "#fff", fontSize: 16, fontWeight: "700" },

  footerRow:  { flexDirection: "row", justifyContent: "center", marginTop: 28 },
  footerText: { color: "#7a9e94", fontSize: 14 },
  link:       { color: "#1f6f59", fontWeight: "700", fontSize: 14 },
});
