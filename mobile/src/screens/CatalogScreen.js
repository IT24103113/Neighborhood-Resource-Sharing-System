import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Image, Pressable, RefreshControl, Text, View, StyleSheet, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { getItems } from "../services/api";

function ItemRow({ item, onPress }) {
  const img = item?.image_urls?.[0] || item?.images?.[0]?.url || "";
  const owner = item?.owner_id?.name || item?.owner_name || "Neighbor";
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowImg}>
        {img ? (
          <Image source={{ uri: img }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        ) : (
          <Feather name="box" size={22} color="#c4d9d2" />
        )}
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={1}>{item.title || "Untitled"}</Text>
        <Text style={styles.rowMeta}>
          {(item.category || "General")} · {(item.condition || "good").replace("_", " ")}
        </Text>
        <Text style={styles.rowOwner}>by {owner}</Text>
      </View>
      <Feather name="chevron-right" size={16} color="#c4d9d2" />
    </Pressable>
  );
}

export default function CatalogScreen({ navigation }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [error, setError]     = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefresh(true); else setLoading(true);
    try {
      const res = await getItems({ is_available: true, limit: 50 });
      setItems(res.items || []);
      setError("");
    } catch (e) {
      setError(e.message || "Unable to load items");
    } finally { setLoading(false); setRefresh(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#1f6f59" /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i._id}
          refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => load(true)} colors={["#1f6f59"]} />}
          contentContainerStyle={styles.list}
          ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
          ListEmptyComponent={<Text style={styles.empty}>No items available right now.</Text>}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => (
            <ItemRow item={item} onPress={() => navigation.navigate("ItemDetail", { itemId: item._id })} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center:    { flex: 1, justifyContent: "center", alignItems: "center" },
  list:      { padding: 16, paddingBottom: 150 },
  sep:       { height: 1, backgroundColor: "#f0f4f2" },

  row:    { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  rowImg: {
    width: 56, height: 56, borderRadius: 10,
    backgroundColor: "#f0faf6", alignItems: "center", justifyContent: "center",
    overflow: "hidden", marginRight: 14,
  },
  rowInfo:  { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: "700", color: "#1a2e28" },
  rowMeta:  { fontSize: 12, color: "#7a9e94", marginTop: 3, textTransform: "capitalize" },
  rowOwner: { fontSize: 12, color: "#aac5bc", marginTop: 2 },

  empty: { textAlign: "center", color: "#aac5bc", marginTop: 80, fontSize: 15 },
  error: { color: "#e53e3e", textAlign: "center", marginBottom: 12, fontSize: 14 },
});