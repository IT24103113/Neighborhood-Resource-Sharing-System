import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as authApi from "../services/api";

const TOKEN_KEY = "nearshare.auth.token";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (!savedToken) {
          return;
        }

        const response = await authApi.getMe(savedToken);
        setToken(savedToken);
        setUser(response.user);
      } catch (error) {
        await AsyncStorage.removeItem(TOKEN_KEY);
        setToken("");
        setUser(null);
      } finally {
        setIsBootstrapping(false);
      }
    }

    bootstrap();
  }, []);

  const signIn = useCallback(async (credentials) => {
    setIsSubmitting(true);
    try {
      const response = await authApi.login(credentials);
      await AsyncStorage.setItem(TOKEN_KEY, response.token);
      setToken(response.token);
      setUser(response.user);
      return response.user;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const signUp = useCallback(async (payload) => {
    setIsSubmitting(true);
    try {
      const response = await authApi.register(payload);
      await AsyncStorage.setItem(TOKEN_KEY, response.token);
      setToken(response.token);
      setUser(response.user);
      return response.user;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const refreshMe = useCallback(async () => {
    if (!token) return null;
    const response = await authApi.getMe(token);
    setUser(response.user);
    return response.user;
  }, [token]);

  const patchProfile = useCallback(
    async (payload) => {
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await authApi.updateProfile(token, payload);
      setUser(response.user);
      return response.user;
    },
    [token]
  );

  const signOut = useCallback(async () => {
    if (token) {
      try {
        await authApi.logout(token);
      } catch (error) {
        // Continue local logout even if server logout fails.
      }
    }

    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isBootstrapping,
      isSubmitting,
      signIn,
      signUp,
      signOut,
      refreshMe,
      patchProfile
    }),
    [token, user, isBootstrapping, isSubmitting, signIn, signUp, signOut, refreshMe, patchProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
