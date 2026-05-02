import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { getMyBorrowRequests } from "../services/api";

const priorityFilters = ["all", "urgent", "high", "medium", "low"];

function RequestCard({ request, onPress }) {
  const itemTitle = request.item_id?.title || "Unknown item";
  const borrowerName = request.borrower_id?.name || "Unknown borrower";

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.cardTitle}>{itemTitle}</Text>
      <Text style={styles.cardMeta}>Borrower: {borrowerName}</Text>
      <Text style={styles.cardStatus}>Status: {request.status}</Text>
      <Text style={styles.cardPriority}>Priority: {request.priority || "medium"}</Text>
    </Pressable>
  );
}

export default function IncomingRequestsScreen({ navigation }) {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const loadRequests = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const response = await getMyBorrowRequests(token, {
          type: "received",
          sort: "priority",
          priority: priorityFilter === "all" ? undefined : priorityFilter
        });
        setRequests(response.requests || []);
        setError("");
      } catch (loadError) {
        setError(loadError.message || "Unable to load incoming requests");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, priorityFilter]
  );

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.filterWrap}>
        {priorityFilters.map((filter) => {
          const selected = priorityFilter === filter;
          return (
            <Pressable
              key={filter}
              style={[styles.filterChip, selected && styles.filterChipSelected]}
              onPress={() => setPriorityFilter(filter)}
            >
              <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>{filter}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadRequests(true)} />}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            onPress={() => navigation.navigate("RequestDetail", { requestId: item._id })}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{isLoading ? "Loading requests..." : "No incoming requests yet."}</Text>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7fbf8",
    padding: 16
  },
  listContent: {
    paddingBottom: 150,
    gap: 10
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d8e8e0",
    padding: 14
  },
  cardTitle: {
    color: "#1f4237",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4
  },
  cardMeta: {
    color: "#3f5f55",
    marginBottom: 3
  },
  cardStatus: {
    color: "#1f6f59",
    fontWeight: "600",
    textTransform: "capitalize"
  },
  cardPriority: {
    color: "#355d51",
    marginTop: 2,
    textTransform: "capitalize"
  },
  filterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#a4cbbd",
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  filterChipSelected: {
    borderColor: "#1f6f59",
    backgroundColor: "#d5eee4"
  },
  filterChipText: {
    color: "#406358",
    textTransform: "capitalize"
  },
  filterChipTextSelected: {
    color: "#1f6f59",
    fontWeight: "600"
  },
  emptyText: {
    color: "#5a786f",
    textAlign: "center",
    marginTop: 36
  },
  error: {
    color: "#b93a3a",
    marginBottom: 10
  }
});