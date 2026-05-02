import React, { createContext, useContext, useState, useRef } from 'react';
import { Animated, Dimensions, Pressable, Text, View, StyleSheet, ScrollView } from 'react-native';
import { Feather, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "./AuthContext";
import { useNotifications } from "./NotificationContext";

const SidebarContext = createContext();

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.7, 300);

export function SidebarProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggleSidebar = () => {
    if (isOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  };

  const openSidebar = () => {
    setIsOpen(true);
    Animated.timing(anim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeSidebar = () => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setIsOpen(false));
  };

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_WIDTH, 0],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar, openSidebar, closeSidebar }}>
      <View style={{ flex: 1 }}>
        {children}

        {/* Overlay */}
        {isOpen && (
          <Animated.View style={[styles.overlay, { opacity }]}>
            <Pressable style={{ flex: 1 }} onPress={closeSidebar} />
          </Animated.View>
        )}

        {/* Sidebar */}
        <Animated.View 
          style={[
            styles.drawer, 
            { width: DRAWER_WIDTH, transform: [{ translateX }] }
          ]}
        >
           <View style={styles.drawerContent}>
              <SidebarContent onClose={closeSidebar} />
           </View>
        </Animated.View>
      </View>
    </SidebarContext.Provider>
  );
}

function SidebarContent({ onClose }) {
  const navigation = useNavigation();
  const { signOut, user } = useAuth();
  const { unreadCount } = useNotifications();
  
  const handleNavigate = (route) => {
    onClose();
    navigation.navigate(route);
  };

  const handleSignOut = () => {
    onClose();
    signOut();
  };

  const isAdmin = user?.role === "admin";

  return (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
       <View style={styles.header}>
         <View style={styles.avatar}>
           <Text style={styles.avatarText}>{(user?.name || "N")[0].toUpperCase()}</Text>
         </View>
         <View style={styles.userInfo}>
           <Text style={styles.userName}>{user?.name || "Nearshare"}</Text>
           <Text style={styles.userEmail}>{user?.email || "Welcome"}</Text>
         </View>
       </View>
       
       <View style={styles.divider} />

       <MenuLink label="Home" icon="home" onPress={() => handleNavigate(isAdmin ? "AdminHome" : "Home")} />
       <MenuLink label="Browse Items" icon="compass" onPress={() => handleNavigate("Catalog")} />
       <MenuLink label="My Items" icon="list" onPress={() => handleNavigate("MyItems")} />
       <MenuLink label="Notifications" icon="bell" onPress={() => handleNavigate("Notifications")} badge={unreadCount} />
       <MenuLink label="My Requests" icon="upload-cloud" onPress={() => handleNavigate("Requests")} />
       <MenuLink label="Incoming Requests" icon="download-cloud" onPress={() => handleNavigate("IncomingRequests")} />
       <MenuLink label="Messages" icon="message-circle" onPress={() => handleNavigate("Conversations")} />
       <MenuLink label="My Account" icon="user" onPress={() => handleNavigate("Profile")} />
       
       {isAdmin && (
         <MenuLink label="Manage Users" icon="users" onPress={() => handleNavigate("UsersManagement")} />
       )}
       
       <View style={styles.footer}>
          <MenuLink label="Sign Out" icon="log-out" onPress={handleSignOut} isDestructive />
       </View>
    </ScrollView>
  );
}

function MenuLink({ label, icon, onPress, isDestructive, badge }) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
       <View style={styles.iconContainer}>
          <Feather 
            name={icon} 
            size={22} 
            color={isDestructive ? "#ef4444" : "#1f6f59"} 
            style={styles.menuIcon} 
          />
          {badge > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text></View>}
       </View>
       <Text style={[styles.menuLabel, isDestructive && styles.destructiveLabel]}>
         {label}
       </Text>
    </Pressable>
  );
}

export const useSidebar = () => useContext(SidebarContext);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1001,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 20,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 56
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#d4f0e8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1f6f59",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1a2e28",
  },
  userEmail: {
    fontSize: 13,
    color: "#7a9e94",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f4f2",
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 8,
    borderRadius: 12,
  },
  iconContainer: {
    width: 24,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    textAlign: "center"
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff'
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800'
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a2e28'
  },
  destructiveLabel: {
    color: '#ef4444'
  },
  scrollContent: {
    paddingBottom: 100,
  },
  footer: {
    marginTop: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f4f2",
    paddingTop: 24,
  }
});


