import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { getItems, updateItem } from "../services/api";

function resolveImageUrl(item) {
  if (Array.isArray(item?.image_urls) && item.image_urls.length > 0) {
    const first = item.image_urls[0];
    if (typeof first === "string" && first.trim().length > 0) {
      return first;
    }
  }

  if (Array.isArray(item?.images) && item.images.length > 0) {
    const first = item.images[0];
    if (typeof first?.url === "string" && first.url.trim().length > 0) {
      return first.url;
    }
    if (typeof first === "string" && first.trim().length > 0) {
      return first;
    }
  }

  return "";
}

function MyItemCard({ item, onView, onEdit, onToggleAvailability, isUpdating }) {
  const imageUrl = resolveImageUrl(item);

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Text style={styles.cardImagePlaceholderText}>No Image</Text>
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMeta}>{item.category}</Text>
          <Text style={styles.cardMeta}>Condition: {item.condition?.replace("_", " ") || "good"}</Text>
          <Text style={[styles.statusBadge, item.is_available ? styles.statusAvailable : styles.statusUnavailable]}>
            {item.is_available ? "Available" : "Unavailable"}
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.secondaryButton} onPress={onView}>
          <Text style={styles.secondaryButtonText}>View</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onEdit}>
          <Text style={styles.secondaryButtonText}>Edit</Text>
        </Pressable>
        <Pressable
          style={[styles.availabilityButton, isUpdating && styles.buttonDisabled]}
          disabled={isUpdating}
          onPress={onToggleAvailability}
        >
          <Text style={styles.availabilityButtonText}>
            {isUpdating ? "Saving..." : item.is_available ? "Mark Unavailable" : "Mark Available"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function MyItemsScreen({ navigation }) {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState("");
  const [error, setError] = useState("");

  const loadMyItems = useCallback(
    async (isRefresh = false) => {
      if (!user?._id) return;

      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const response = await getItems({ owner_id: user._id, limit: 100, page: 1 });
        setItems(response.items || []);
        setError("");
      } catch (loadError) {
        setError(loadError.message || "Unable to load your items");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?._id]
  );

  useEffect(() => {
    loadMyItems();
  }, [loadMyItems]);

  async function handleToggleAvailability(item) {
    if (!token || !item?._id) return;

    setUpdatingItemId(item._id);
    setError("");

    try {
      const response = await updateItem(token, item._id, { is_available: !item.is_available });
      const updated = response.item;

      setItems((prev) => prev.map((entry) => (entry._id === item._id ? updated : entry)));
    } catch (toggleError) {
      setError(toggleError.message || "Unable to update item availability");
    } finally {
      setUpdatingItemId("");
    }
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadMyItems(true)} />}
        renderItem={({ item }) => (
          <MyItemCard
            item={item}
            isUpdating={updatingItemId === item._id}
            onView={() => navigation.navigate("ItemDetail", { itemId: item._id })}
            onEdit={() => navigation.navigate("CreateItem", { mode: "edit", item })}
            onToggleAvailability={() => handleToggleAvailability(item)}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>{isLoading ? "Loading items..." : "No items yet."}</Text>}
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
    paddingBottom: 24,
    gap: 10
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d8e8e0",
    padding: 14
  },
  cardRow: {
    flexDirection: "row"
  },
  cardImage: {
    width: 86,
    height: 86,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: "#dfece6"
  },
  cardImagePlaceholder: {
    width: 86,
    height: 86,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: "#e9f1ed",
    alignItems: "center",
    justifyContent: "center"
  },
  cardImagePlaceholderText: {
    color: "#67867c",
    fontSize: 12,
    fontWeight: "600"
  },
  cardBody: {
    flex: 1
  },
  cardTitle: {
    color: "#1f4237",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4
  },
  cardMeta: {
    color: "#3f5f55",
    textTransform: "capitalize",
    marginBottom: 2
  },
  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    overflow: "hidden"
  },
  statusAvailable: {
    color: "#1f6f59",
    backgroundColor: "#d5eee4"
  },
  statusUnavailable: {
    color: "#9a4b3e",
    backgroundColor: "#f7ddd7"
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#1f6f59",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  secondaryButtonText: {
    color: "#1f6f59",
    fontWeight: "600"
  },
  availabilityButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#1f6f59",
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  availabilityButtonText: {
    color: "#ffffff",
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
  },
  buttonDisabled: {
    opacity: 0.6
  }
});