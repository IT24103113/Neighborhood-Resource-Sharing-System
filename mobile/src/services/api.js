import { Platform } from "react-native";

const EXPO_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const EMULATOR_ANDROID_API = "http://172.26.118.54:5000";
const EMULATOR_IOS_API = "http://172.26.118.54:5000";
const WEB_LOCAL_API = "http://172.26.118.54:5000";
const REQUEST_TIMEOUT_MS = 15000;

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, "");
}

function resolveApiBaseUrl() {
  if (typeof EXPO_API_BASE_URL === "string" && EXPO_API_BASE_URL.trim().length > 0) {
    return normalizeBaseUrl(EXPO_API_BASE_URL.trim());
  }

  if (Platform.OS === "android") return EMULATOR_ANDROID_API;
  if (Platform.OS === "ios") return EMULATOR_IOS_API;
  return WEB_LOCAL_API;
}

export const API_BASE_URL = resolveApiBaseUrl();

function buildHeaders(token) {
  const headers = {
    "Content-Type": "application/json"
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function buildQueryString(query) {
  if (!query || Object.keys(query).length === 0) return "";
  const parts = [];
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}

function extractErrorMessage(payload) {
  if (!payload) return "Unknown error occurred";
  return payload.message || payload.error || "Unknown error occurred";
}

async function request(path, { method = "GET", body, token } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: buildHeaders(token),
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.message || payload.error || "Request failed");
    }

    return payload;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw new Error(error.message || "Network error. Please check your connection.");
  }
}

export async function login(payload) {
  return request("/api/auth/login", {
    method: "POST",
    body: payload
  });
}

export async function register(payload) {
  return request("/api/auth/register", {
    method: "POST",
    body: payload
  });
}

export async function getMe(token) {
  return request("/api/auth/me", {
    method: "GET",
    token
  });
}

export async function logout(token) {
  return request("/api/auth/logout", {
    method: "POST",
    token
  });
}

export async function updateProfile(token, payload) {
  return request("/api/auth/profile", {
    method: "PATCH",
    token,
    body: payload
  });
}

export async function getItems(query = {}) {
  return request(`/api/items${buildQueryString(query)}`, {
    method: "GET"
  });
}

export async function getItemById(itemId) {
  return request(`/api/items/${itemId}`, {
    method: "GET"
  });
}

export async function createItem(token, payload) {
  return request("/api/items", {
    method: "POST",
    token,
    body: payload
  });
}

export async function updateItem(token, itemId, payload) {
  return request(`/api/items/${itemId}`, {
    method: "PATCH",
    token,
    body: payload
  });
}

export async function deleteItem(token, itemId) {
  return request(`/api/items/${itemId}`, {
    method: "DELETE",
    token
  });
}

export async function createBorrowRequest(token, payload) {
  return request("/api/borrow-requests", {
    method: "POST",
    token,
    body: payload
  });
}

export async function getMyBorrowRequests(token, query = {}) {
  return request(`/api/borrow-requests/mine${buildQueryString(query)}`, {
    method: "GET",
    token
  });
}

export async function getBorrowRequestById(token, requestId) {
  return request(`/api/borrow-requests/${requestId}`, {
    method: "GET",
    token
  });
}

export async function updateBorrowRequestStatus(token, requestId, status) {
  return request(`/api/borrow-requests/${requestId}/status`, {
    method: "PATCH",
    token,
    body: { status }
  });
}

export async function updateBorrowRequestPriority(token, requestId, priority) {
  return request(`/api/borrow-requests/${requestId}/priority`, {
    method: "PATCH",
    token,
    body: { priority }
  });
}

export async function createReview(token, payload) {
  return request("/api/reviews", {
    method: "POST",
    token,
    body: payload
  });
}

export async function getReviewsForUser(userId) {
  return request(`/api/reviews/users/${userId}`, {
    method: "GET"
  });
}

export async function startConversation(token, participantId) {
  return request("/api/messages/conversations", {
    method: "POST",
    token,
    body: {
      participant_id: participantId
    }
  });
}

export async function getMyConversations(token) {
  return request("/api/messages/conversations", {
    method: "GET",
    token
  });
}

export async function getConversationMessages(token, conversationId) {
  return request(`/api/messages/conversations/${conversationId}/messages`, {
    method: "GET",
    token
  });
}

export async function sendConversationMessage(token, conversationId, text) {
  return request(`/api/messages/conversations/${conversationId}/messages`, {
    method: "POST",
    token,
    body: {
      text
    }
  });
}

export async function markConversationAsRead(token, conversationId) {
  return request(`/api/messages/conversations/${conversationId}/read`, {
    method: "PATCH",
    token
  });
}

export async function getMyNotifications(token) {
  return request("/api/notifications", {
    method: "GET",
    token
  });
}

export async function markNotificationRead(token, notificationId) {
  return request(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
    token
  });
}

export async function markAllNotificationsRead(token) {
  return request("/api/notifications/read-all", {
    method: "PATCH",
    token
  });
}

export async function getAdminUsers(token) {
  return request("/api/admin/users", {
    method: "GET",
    token
  });
}

export async function createAdminUser(token, payload) {
  return request("/api/admin/users", {
    method: "POST",
    token,
    body: payload
  });
}

export async function deleteAdminUser(token, userId) {
  return request(`/api/admin/users/${userId}`, {
    method: "DELETE",
    token
  });
}

export async function searchItems(query = {}) {
  return request(`/api/search/items${buildQueryString(query)}`, {
    method: "GET"
  });
}

export async function searchUsers(query = {}) {
  return request(`/api/search/users${buildQueryString(query)}`, {
    method: "GET"
  });
}

export async function uploadImages(token, files = []) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("At least one image file is required");
  }

  const formData = new FormData();
  files.forEach((file, index) => {
    formData.append("images", {
      uri: file.uri,
      name: file.name || `image-${index + 1}.jpg`,
      type: file.type || "image/jpeg"
    });
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/uploads/images`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Upload timed out. Check network and server status.");
    }

    throw new Error("Unable to upload images. Check network and backend URL.");
  } finally {
    clearTimeout(timeoutId);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(extractErrorMessage(payload));
  }

  return payload;
}

