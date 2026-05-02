import React from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { createAdminUser, deleteAdminUser, getAdminUsers } from "../services/api";

export default function UsersManagementScreen({ navigation }) {
  const { token } = useAuth();
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("password123");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Manage Users",
      headerTitleStyle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1f4237"
      }
    });
  }, [navigation]);

  React.useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const response = await getAdminUsers(token);
      const nonAdminUsers = (response.users || []).filter((u) => u.role !== "admin");
      setUsers(nonAdminUsers);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser(userId, userName) {
    Alert.alert(
      "Delete User?",
      `Are you sure you want to delete ${userName}? This action will also delete all their items, requests, and related data.`,
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await deleteAdminUser(token, userId);
              Alert.alert("Success", `${userName} has been deleted`);
              loadUsers();
            } catch (error) {
              Alert.alert("Error", error.message || "Failed to delete user");
            }
          },
          style: "destructive"
        }
      ]
    );
  }

  async function handleCreateUser() {
    if (isCreating) return;

    try {
      setIsCreating(true);
      await createAdminUser(token, {
        name,
        email,
        password,
        phone,
        address
      });

      Alert.alert("Success", "User created successfully");
      setName("");
      setEmail("");
      setPassword("password123");
      setPhone("");
      setAddress("");
      await loadUsers();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to create user");
    } finally {
      setIsCreating(false);
    }
  }

  function renderCreateForm() {
    return (
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Create New User</Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min 8 chars)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          style={styles.input}
          placeholder="Address"
          value={address}
          onChangeText={setAddress}
        />
        <Pressable
          style={[styles.createButton, isCreating && styles.buttonDisabled]}
          onPress={handleCreateUser}
          disabled={isCreating}
        >
          <Text style={styles.createButtonText}>{isCreating ? "Creating..." : "Create User"}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderCreateForm()}

      <Text style={styles.sectionTitle}>Manage Existing Users</Text>
      {loading ? (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No users to manage</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                <Text style={styles.userRole}>Role: {item.role}</Text>
                {item.phone && <Text style={styles.userPhone}>{item.phone}</Text>}
              </View>
              <Pressable
                style={styles.deleteButton}
                onPress={() => handleDeleteUser(item._id, item.name)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f9f7",
    padding: 12
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#d8e8e0",
    marginBottom: 12
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f4237",
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: "#c9ddd3",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    backgroundColor: "#fff"
  },
  createButton: {
    backgroundColor: "#1f6f59",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center"
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "700"
  },
  sectionTitle: {
    color: "#1f4237",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8
  },
  buttonDisabled: {
    opacity: 0.6
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500"
  },
  emptyText: {
    fontSize: 16,
    color: "#999"
  },
  userCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#1f6f59",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f4237",
    marginBottom: 4
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4
  },
  userRole: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4
  },
  userPhone: {
    fontSize: 12,
    color: "#888"
  },
  deleteButton: {
    backgroundColor: "#b33a3a",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 12
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12
  }
});
