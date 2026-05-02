import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import {
  getBorrowRequestById,
  startConversation,
  updateBorrowRequestPriority,
  updateBorrowRequestStatus
} from "../services/api";

const priorityLevels = ["low", "medium", "high", "urgent"];

export default function RequestDetailScreen({ route, navigation }) {
  const { token, user } = useAuth();
  const requestId = route.params?.requestId;
  const [request, setRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [error, setError] = useState("");

  const roleContext = useMemo(() => {
    if (!request || !user) return { isBorrower: false, isLender: false };
    return {
      isBorrower: user._id === request.borrower_id?._id,
      isLender: user._id === request.lender_id?._id,
      isAdmin: user.role === "admin"
    };
  }, [request, user]);

  const loadRequest = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getBorrowRequestById(token, requestId);
      setRequest(response.request || null);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Unable to load request details");
    } finally {
      setIsLoading(false);
    }
  }, [token, requestId]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  async function updateStatus(status) {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await updateBorrowRequestStatus(token, requestId, status);
      setRequest(response.request || null);
      
      // Auto-redirect to relevant page after status update
      if (status === "approved" || status === "rejected" || status === "returned") {
        navigation.navigate("IncomingRequests");
      } else if (status === "canceled") {
        navigation.navigate("Requests");
      }
    } catch (updateError) {
      setError(updateError.message || "Unable to update request status");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updatePriority(priority) {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await updateBorrowRequestPriority(token, requestId, priority);
      setRequest(response.request || null);
    } catch (updateError) {
      setError(updateError.message || "Unable to update request priority");
    } finally {
      setIsSubmitting(false);
    }
  }

  const showLenderActions = request?.status === "pending" && roleContext.isLender;
  const showBorrowerCancel = request?.status === "pending" && roleContext.isBorrower;
  const showReturnAction = request?.status === "approved" && roleContext.isLender;
  const showReviewAction = request?.status === "returned" && (roleContext.isBorrower || roleContext.isLender);
  const showMessageAction = roleContext.isBorrower || roleContext.isLender;

  async function handleStartChat() {
    if (!request || !user) return;

    const targetId = roleContext.isBorrower ? request.lender_id?._id : request.borrower_id?._id;
    if (!targetId) {
      setError("Unable to find participant for chat");
      return;
    }

    setIsStartingChat(true);
    setError("");

    try {
      const response = await startConversation(token, targetId);
      const conversationId = response.conversation?._id;
      if (!conversationId) {
        throw new Error("Conversation could not be created");
      }

      navigation.navigate("Chat", { conversationId });
    } catch (chatError) {
      setError(chatError.message || "Unable to start chat");
    } finally {
      setIsStartingChat(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isLoading ? <Text style={styles.infoText}>Loading request details...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {request ? (
        <View style={styles.card}>
          <Text style={styles.title}>{request.item_id?.title || "Borrow request"}</Text>
          <Text style={styles.meta}>Status: {request.status}</Text>
          <Text style={styles.meta}>Priority: {request.priority || "medium"}</Text>
          <Text style={styles.meta}>Borrower: {request.borrower_id?.name || "Unknown"}</Text>
          <Text style={styles.meta}>Lender: {request.lender_id?.name || "Unknown"}</Text>
          <Text style={styles.meta}>Category: {request.item_id?.category || "-"}</Text>
          <Text style={styles.note}>{request.note || "No note provided."}</Text>

          {roleContext.isAdmin ? (
            <View style={styles.priorityWrap}>
              <Text style={styles.priorityLabel}>Set Priority (Admin)</Text>
              <View style={styles.priorityChipWrap}>
                {priorityLevels.map((priority) => {
                  const selected = (request.priority || "medium") === priority;
                  return (
                    <Pressable
                      key={priority}
                      style={[styles.priorityChip, selected && styles.priorityChipSelected, isSubmitting && styles.buttonDisabled]}
                      disabled={isSubmitting}
                      onPress={() => updatePriority(priority)}
                    >
                      <Text style={[styles.priorityChipText, selected && styles.priorityChipTextSelected]}>{priority}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {showLenderActions ? (
            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.successButton, isSubmitting && styles.buttonDisabled]}
                disabled={isSubmitting}
                onPress={() => updateStatus("approved")}
              >
                <Text style={styles.actionButtonText}>Approve</Text>
              </Pressable>
              <Pressable
                style={[styles.dangerButton, isSubmitting && styles.buttonDisabled]}
                disabled={isSubmitting}
                onPress={() => updateStatus("rejected")}
              >
                <Text style={styles.actionButtonText}>Reject</Text>
              </Pressable>
            </View>
          ) : null}

          {showBorrowerCancel ? (
            <Pressable
              style={[styles.secondaryButton, isSubmitting && styles.buttonDisabled]}
              disabled={isSubmitting}
              onPress={() => updateStatus("canceled")}
            >
              <Text style={styles.secondaryButtonText}>Cancel Request</Text>
            </Pressable>
          ) : null}

          {showReturnAction ? (
            <Pressable
              style={[styles.successButton, isSubmitting && styles.buttonDisabled]}
              disabled={isSubmitting}
              onPress={() => updateStatus("returned")}
            >
              <Text style={styles.actionButtonText}>Mark as Returned</Text>
            </Pressable>
          ) : null}

          {showReviewAction ? (
            <Pressable
              style={styles.secondaryButton}
              onPress={() => navigation.navigate("Review", { requestId })}
            >
              <Text style={styles.secondaryButtonText}>Write Review</Text>
            </Pressable>
          ) : null}

          {showMessageAction ? (
            <Pressable
              style={[styles.secondaryButton, isStartingChat && styles.buttonDisabled]}
              onPress={handleStartChat}
              disabled={isStartingChat}
            >
              <Text style={styles.secondaryButtonText}>{isStartingChat ? "Opening Chat..." : "Message"}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7fbf8"
  },
  content: {
    padding: 16
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d8e8e0",
    padding: 16
  },
  title: {
    color: "#1f4237",
    fontSize: 21,
    fontWeight: "700",
    marginBottom: 8
  },
  meta: {
    color: "#3f5f55",
    marginBottom: 4,
    textTransform: "capitalize"
  },
  note: {
    marginTop: 10,
    color: "#29453d",
    lineHeight: 22
  },
  priorityWrap: {
    marginTop: 12
  },
  priorityLabel: {
    color: "#385b4f",
    fontWeight: "600",
    marginBottom: 8
  },
  priorityChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  priorityChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#a4cbbd",
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  priorityChipSelected: {
    borderColor: "#1f6f59",
    backgroundColor: "#d5eee4"
  },
  priorityChipText: {
    color: "#406358",
    textTransform: "capitalize"
  },
  priorityChipTextSelected: {
    color: "#1f6f59",
    fontWeight: "600"
  },
  infoText: {
    color: "#58766d",
    marginBottom: 10
  },
  error: {
    color: "#b93a3a",
    marginBottom: 10
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16
  },
  successButton: {
    borderRadius: 10,
    backgroundColor: "#1f6f59",
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 12,
    flex: 1
  },
  dangerButton: {
    borderRadius: 10,
    backgroundColor: "#b93a3a",
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 12,
    flex: 1
  },
  secondaryButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1f6f59",
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 12
  },
  actionButtonText: {
    color: "#ffffff",
    fontWeight: "600"
  },
  secondaryButtonText: {
    color: "#1f6f59",
    fontWeight: "600"
  },
  buttonDisabled: {
    opacity: 0.6
  }
});