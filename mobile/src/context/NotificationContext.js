import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Animated, Pressable, Text, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from './AuthContext';
import { connectSocket } from '../services/socket';
import { getMyNotifications } from '../services/api';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [notification, setNotification] = useState(null);
  const [isVisible, setIsVisible]       = useState(false);
  const [unreadCount, setUnreadCount]   = useState(0);
  const translateY = useRef(new Animated.Value(-120)).current;

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getMyNotifications(token);
      setUnreadCount(data?.unread_count || 0);
    } catch (e) {
      console.error("Failed to fetch unread count:", e.message);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
    } else {
      setUnreadCount(0);
    }
  }, [isAuthenticated, fetchUnreadCount]);

  const hideBanner = useCallback(() => {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      setNotification(null);
    });
  }, [translateY]);

  const showBanner = useCallback((notif) => {
    setNotification(notif);
    setIsVisible(true);
    setUnreadCount(prev => prev + 1);
    
    Animated.spring(translateY, {
      toValue: 48,
      useNativeDriver: true,
      tension: 40,
      friction: 7,
    }).start();
    
    setTimeout(hideBanner, 5000);
  }, [translateY, hideBanner]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const socket = connectSocket(token);
    if (!socket) return;

    const handler = ({ notification: n }) => showBanner(n);
    socket.on('notification:new', handler);
    return () => socket.off('notification:new', handler);
  }, [isAuthenticated, token, showBanner]);

  const decrementUnread = useCallback(() => {
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider value={{ unreadCount, fetchUnreadCount, decrementUnread, clearUnread, showBanner, hideBanner }}>
      {children}

      {isVisible && (
        <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
          <Pressable style={styles.inner} onPress={hideBanner}>
            <View style={styles.iconWrap}>
              <Feather name="bell" size={18} color="#fff" />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.title} numberOfLines={1}>
                {notification?.title || 'New Notification'}
              </Text>
              <Text style={styles.body} numberOfLines={2}>
                {notification?.body || notification?.message}
              </Text>
            </View>
            <Text style={styles.dismiss}>✕</Text>
          </Pressable>
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: '#1f6f59',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: { flex: 1 },
  title:    { color: '#fff', fontWeight: '800', fontSize: 14 },
  body:     { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  dismiss:  { color: 'rgba(255,255,255,0.7)', fontSize: 16, marginLeft: 8, paddingHorizontal: 4 },
});
