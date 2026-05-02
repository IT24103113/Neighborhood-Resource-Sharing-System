import React from "react";
import { ActivityIndicator, StyleSheet, View, Pressable, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import { useNotifications } from "../context/NotificationContext";
import { useNavigation } from "@react-navigation/native";

// Auth Screens
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";

// Main Screens
import HomeScreen from "../screens/HomeScreen";
import AdminHomeScreen from "../screens/AdminHomeScreen";
import UsersManagementScreen from "../screens/UsersManagementScreen";
import CatalogScreen from "../screens/CatalogScreen";
import MyItemsScreen from "../screens/MyItemsScreen";
import ItemDetailScreen from "../screens/ItemDetailScreen";
import CreateItemScreen from "../screens/CreateItemScreen";
import MyRequestsScreen from "../screens/MyRequestsScreen";
import IncomingRequestsScreen from "../screens/IncomingRequestsScreen";
import RequestDetailScreen from "../screens/RequestDetailScreen";
import ReviewScreen from "../screens/ReviewScreen";
import ConversationsScreen from "../screens/ConversationsScreen";
import ChatScreen from "../screens/ChatScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Stack = createNativeStackNavigator();

function NotificationHeaderBtn() {
  const navigation = useNavigation();
  const { unreadCount } = useNotifications();

  return (
    <Pressable 
      onPress={() => navigation.navigate("Notifications")} 
      style={styles.headerBtnRight}
    >
      <Feather name="bell" size={22} color="#1a2e28" />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isBootstrapping, user } = useAuth();
  const { toggleSidebar } = useSidebar();

  if (isBootstrapping) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#1f6f59" />
      </View>
    );
  }

  // A common screen options configuration that includes the hamburger menu
  const screenWithSidebar = (title) => ({
    headerShown: true,
    title,
    headerLeft: () => (
      <Pressable onPress={toggleSidebar} style={styles.headerBtn}>
         <Feather name="menu" size={24} color="#1a2e28" />
      </Pressable>
    ),
    headerRight: () => <NotificationHeaderBtn />,
    headerStyle: { 
      backgroundColor: "#ffffff",
    },
    headerShadowVisible: false, // Cleaner UX
    headerTitleStyle: { 
      color: "#1a2e28", 
      fontWeight: "800",
      fontSize: 18
    },
    headerTitleAlign: "center",
  });

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, headerBackTitleVisible: false, headerTintColor: "#1f6f59" }}>
      {isAuthenticated ? (
        <>
          {/* Main Top-Level Screens (Accessible from Sidebar) */}
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={screenWithSidebar("Dashboard")} 
          />
          <Stack.Screen 
            name="AdminHome" 
            component={AdminHomeScreen} 
            options={screenWithSidebar("Admin Panel")} 
          />
          <Stack.Screen 
            name="Catalog" 
            component={CatalogScreen} 
            options={screenWithSidebar("Browse Items")} 
          />
          <Stack.Screen 
            name="Requests" 
            component={MyRequestsScreen} 
            options={screenWithSidebar("My Requests")} 
          />
          <Stack.Screen 
            name="IncomingRequests" 
            component={IncomingRequestsScreen} 
            options={screenWithSidebar("Incoming Requests")} 
          />
          <Stack.Screen 
            name="Conversations" 
            component={ConversationsScreen} 
            options={screenWithSidebar("Messages")} 
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={screenWithSidebar("Account")} 
          />
          <Stack.Screen 
            name="UsersManagement" 
            component={UsersManagementScreen} 
            options={screenWithSidebar("User Control")} 
          />

          {/* Deep Navigation Screens (Accessible via links/buttons) */}
          <Stack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ headerShown: true, title: "Details", headerRight: () => <NotificationHeaderBtn /> }} />
          <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: true, title: "Chat", headerRight: () => <NotificationHeaderBtn /> }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: true, title: "Notifications", headerRight: () => <NotificationHeaderBtn /> }} />
          <Stack.Screen name="MyItems" component={MyItemsScreen} options={{ headerShown: true, title: "My Listings", headerRight: () => <NotificationHeaderBtn /> }} />
          <Stack.Screen name="CreateItem" component={CreateItemScreen} options={{ headerShown: true, title: "New Listing", headerRight: () => <NotificationHeaderBtn /> }} />
          <Stack.Screen name="RequestDetail" component={RequestDetailScreen} options={{ headerShown: true, title: "Request Details", headerRight: () => <NotificationHeaderBtn /> }} />
          <Stack.Screen name="Review" component={ReviewScreen} options={{ headerShown: true, title: "Leave Feedback", headerRight: () => <NotificationHeaderBtn /> }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa"
  },
  headerBtn: {
    marginLeft: 4,
    padding: 8,
  },
  headerBtnRight: {
    marginRight: 4,
    padding: 8,
    position: "relative"
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 4,
    backgroundColor: "#ef4444",
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: "#fff"
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800"
  }
});
