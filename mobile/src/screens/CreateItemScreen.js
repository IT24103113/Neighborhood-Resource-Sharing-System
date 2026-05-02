import React, { useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import { createItem, updateItem, uploadImages } from "../services/api";

const conditions = ["new", "like_new", "good", "fair", "poor"];

export default function CreateItemScreen({ navigation, route }) {
  const { token } = useAuth();
  const mode = route.params?.mode === "edit" ? "edit" : "create";
  const existingItem = route.params?.item;

  const [title, setTitle] = useState(existingItem?.title || "");
  const [description, setDescription] = useState(existingItem?.description || "");
  const [category, setCategory] = useState(existingItem?.category || "");
  const [condition, setCondition] = useState(existingItem?.condition || "good");
  const [address, setAddress] = useState(existingItem?.address || "");
  const [imageUrls, setImageUrls] = useState(existingItem?.image_urls || []);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return (
      title.trim().length > 2 &&
      description.trim().length > 10 &&
      category.trim().length > 1 &&
      address.trim().length > 3 &&
      imageUrls.length > 0 &&
      !isUploading &&
      !isSubmitting
    );
  }, [title, description, category, address, imageUrls.length, isUploading, isSubmitting]);

  async function handlePickImages() {
    setError("");

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Media library permission is required to select images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5
    });

    if (result.canceled) return;

    const files = (result.assets || []).map((asset, index) => {
      const extension = asset.mimeType?.split("/")?.[1] || "jpg";
      return {
        uri: asset.uri,
        type: asset.mimeType || "image/jpeg",
        name: asset.fileName || `picked-${Date.now()}-${index + 1}.${extension}`
      };
    });

    setSelectedFiles(files);
  }

  async function handleUploadSelected() {
    if (selectedFiles.length === 0) {
      setError("Pick at least one image before upload.");
      return;
    }

    setError("");
    setIsUploading(true);

    try {
      const response = await uploadImages(token, selectedFiles);
      const uploadedUrls = (response.files || [])
        .map((file) => file.url)
        .filter((url) => typeof url === "string" && url.length > 0);

      setImageUrls((prev) => Array.from(new Set([...prev, ...uploadedUrls])));
      setSelectedFiles([]);
    } catch (uploadError) {
      setError(uploadError.message || "Unable to upload selected images");
    } finally {
      setIsUploading(false);
    }
  }

  function handleRemoveUploadedImage(url) {
    setImageUrls((prev) => prev.filter((item) => item !== url));
  }

  async function handleSubmit() {
    setError("");
    setIsSubmitting(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim().toLowerCase(),
      condition,
      address: address.trim(),
      image_urls: imageUrls
    };

    try {
      if (mode === "edit" && existingItem?._id) {
        await updateItem(token, existingItem._id, payload);
      } else {
        await createItem(token, payload);
      }

      navigation.navigate("Catalog");
    } catch (submitError) {
      setError(submitError.message || "Unable to save item");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>{mode === "edit" ? "Edit item" : "Add an item"}</Text>

          <TextInput
            style={styles.input}
            placeholder="Title"
            placeholderTextColor="#7f948c"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Description"
            placeholderTextColor="#7f948c"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />

          <TextInput
            style={styles.input}
            placeholder="Category (e.g. tools, books)"
            placeholderTextColor="#7f948c"
            value={category}
            onChangeText={setCategory}
          />

          <Text style={styles.label}>Condition</Text>
          <View style={styles.chipWrap}>
            {conditions.map((option, idx) => {
              const selected = option === condition;
              return (
                <Pressable
                  key={option + idx}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setCondition(option)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Pickup address"
            placeholderTextColor="#7f948c"
            value={address}
            onChangeText={setAddress}
          />

          <Text style={styles.label}>Item images</Text>
          <View style={styles.imageActionsRow}>
            <Pressable style={styles.secondaryButton} onPress={handlePickImages}>
              <Text style={styles.secondaryButtonText}>Pick Images</Text>
            </Pressable>
            <Pressable
              style={[
                styles.secondaryButton,
                (selectedFiles.length === 0 || isUploading) && styles.buttonDisabled
              ]}
              disabled={selectedFiles.length === 0 || isUploading}
              onPress={handleUploadSelected}
            >
              <Text style={styles.secondaryButtonText}>{isUploading ? "Uploading..." : "Upload Selected"}</Text>
            </Pressable>
          </View>

          {selectedFiles.length > 0 ? (
            <Text style={styles.helperText}>{selectedFiles.length} image(s) selected and waiting for upload.</Text>
          ) : null}

          {selectedFiles.length > 0 ? (
            <Text style={styles.helperText}>{selectedFiles.length} image(s) selected and waiting for upload.</Text>
          ) : null}

          {imageUrls.length > 0 ? (
            <View style={styles.previewWrap}>
              {imageUrls.map((url, idx) => (
                <View key={url + idx} style={styles.previewCard}>
                  <Image source={{ uri: url }} style={styles.previewImage} />
                  <Pressable style={styles.removeImageButton} onPress={() => handleRemoveUploadedImage(url)}>
                    <Text style={styles.removeImageButtonText}>Remove</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.helperText}>Upload at least one image before creating the item.</Text>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            disabled={!canSubmit}
            onPress={handleSubmit}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? "Saving..." : mode === "edit" ? "Update Item" : "Create Item"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f7fbf8"
  },
  content: {
    padding: 16
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d8e8e0",
    padding: 16
  },
  title: {
    color: "#1f4237",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 14
  },
  input: {
    borderWidth: 1,
    borderColor: "#c4ddd1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: "#ffffff",
    color: "#1f4237"
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: "top"
  },
  label: {
    color: "#385b4f",
    fontWeight: "600",
    marginBottom: 8
  },
  helperText: {
    color: "#53736a",
    marginBottom: 10
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#a4cbbd",
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  chipSelected: {
    borderColor: "#1f6f59",
    backgroundColor: "#d5eee4"
  },
  chipText: {
    color: "#406358",
    textTransform: "capitalize"
  },
  chipTextSelected: {
    color: "#1f6f59",
    fontWeight: "600"
  },
  imageActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1f6f59",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  secondaryButtonText: {
    color: "#1f6f59",
    fontWeight: "600"
  },
  previewWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12
  },
  previewCard: {
    width: 96
  },
  previewImage: {
    width: 96,
    height: 96,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#c4ddd1",
    marginBottom: 6
  },
  removeImageButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#b93a3a",
    paddingVertical: 5,
    alignItems: "center"
  },
  removeImageButtonText: {
    color: "#b93a3a",
    fontSize: 12,
    fontWeight: "600"
  },
  error: {
    marginBottom: 10,
    color: "#b93a3a"
  },
  button: {
    backgroundColor: "#1f6f59",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center"
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16
  }
});