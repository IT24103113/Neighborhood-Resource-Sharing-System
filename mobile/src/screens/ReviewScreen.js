import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { createReview } from "../services/api";

const ratingLevels = [1, 2, 3, 4, 5];

export default function ReviewScreen({ navigation, route }) {
  const { token } = useAuth();
  const requestId = route.params?.requestId;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canSubmit = useMemo(() => {
    return Boolean(requestId) && !isSubmitting;
  }, [requestId, isSubmitting]);

  async function handleSubmit() {
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await createReview(token, {
        borrow_request_id: requestId,
        rating,
        comment: comment.trim()
      });

      setSuccess("Review submitted successfully.");
      navigation.goBack();
    } catch (submitError) {
      setError(submitError.message || "Unable to submit review");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Submit review</Text>
        <Text style={styles.subtitle}>Rate your experience for this completed borrow request.</Text>

        <Text style={styles.label}>Rating</Text>
        <View style={styles.ratingWrap}>
          {ratingLevels.map((value) => {
            const selected = value === rating;
            return (
              <Pressable
                key={value}
                style={[styles.ratingChip, selected && styles.ratingChipSelected]}
                onPress={() => setRating(value)}
              >
                <Text style={[styles.ratingChipText, selected && styles.ratingChipTextSelected]}>{value}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Comment (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Share your experience"
          placeholderTextColor="#7f948c"
          multiline
          numberOfLines={4}
          value={comment}
          onChangeText={setComment}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        <Pressable
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          disabled={!canSubmit}
          onPress={handleSubmit}
        >
          <Text style={styles.buttonText}>{isSubmitting ? "Submitting..." : "Submit Review"}</Text>
        </Pressable>
      </View>
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
    marginBottom: 6
  },
  subtitle: {
    color: "#48675d",
    marginBottom: 14
  },
  label: {
    color: "#385b4f",
    fontWeight: "600",
    marginBottom: 8
  },
  ratingWrap: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14
  },
  ratingChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#a4cbbd",
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  ratingChipSelected: {
    borderColor: "#1f6f59",
    backgroundColor: "#d5eee4"
  },
  ratingChipText: {
    color: "#406358",
    fontWeight: "600"
  },
  ratingChipTextSelected: {
    color: "#1f6f59"
  },
  input: {
    borderWidth: 1,
    borderColor: "#c4ddd1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 96,
    textAlignVertical: "top",
    marginBottom: 12,
    color: "#1f4237"
  },
  error: {
    color: "#b93a3a",
    marginBottom: 10
  },
  success: {
    color: "#1f6f59",
    marginBottom: 10
  },
  button: {
    borderRadius: 10,
    backgroundColor: "#1f6f59",
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