import { useTheme } from "@/lib/contexts/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useEffect, useRef, useState } from "react";

import { getPostById, updatePost } from "@/lib/services/post";

interface CaptionEditFormProps {
  postId: string;
}

export default function CaptionEditForm({ postId }: CaptionEditFormProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const inputRef = useRef<TextInput>(null);

  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");

  const { data: post } = useQuery(["post", postId], () => getPostById(postId), {
    enabled: !!postId,
  });

  useEffect(() => {
    if (post?.caption) setCaption(post.caption);
  }, [post]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const mutation = useMutation(
    (newCaption: string) => updatePost(postId, { caption: newCaption }),
    {
      onMutate: async (newCaption) => {
        await queryClient.cancelQueries(["post", postId]);
        const previous = queryClient.getQueryData(["post", postId]);

        queryClient.setQueryData(["post", postId], (old: any) => ({
          ...old,
          caption: newCaption,
        }));

        return { previous };
      },
      onError: (_, __, context) => {
        if (context?.previous) {
          queryClient.setQueryData(["post", postId], context.previous);
        }

        Alert.alert("Update failed", "Something went wrong while updating your caption.");
      },
      onSuccess: () => {
        queryClient.invalidateQueries(["post", postId]);

        if (post?.user_id) {
          queryClient.invalidateQueries(["posts", post.user_id, "image"]);
        }

        router.back();
      },
    }
  );

  const handleSave = () => {
    const trimmed = caption.trim();

    if (trimmed.length > 300) {
      setError("Caption must be 300 characters or less.");
      return;
    }

    if (trimmed === post?.caption) {
      router.back();
      return;
    }

    setError("");
    mutation.mutate(trimmed);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Caption</Text>

        <TouchableOpacity
          onPress={handleSave}
          style={[
            styles.saveButton,
            {
              backgroundColor: theme.primary,
              opacity: mutation.isLoading ? 0.6 : 1,
            },
          ]}
          disabled={mutation.isLoading}
        >
          {mutation.isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            value={caption}
            onChangeText={setCaption}
            placeholder="Write a caption for your post..."
            multiline
            maxLength={300}
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: error ? theme.primary : theme.border,
                textAlignVertical: "top",
                paddingRight: 36,
              },
            ]}
            placeholderTextColor={theme.subText}
            accessibilityLabel="Caption input"
          />
          {caption.length > 0 && (
            <TouchableOpacity
              onPress={() => setCaption("")}
              style={styles.inlineClearButton}
              accessibilityLabel="Clear caption input"
            >
              <Ionicons name="close" size={20} color={theme.subText} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.charCount, { color: theme.subText }]}>
          {caption.length}/300
        </Text>

        {!!error && (
          <Text style={[styles.error, { color: theme.primary }]}>{error}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 15,
    padding: 5,
  },
  saveButton: {
    position: "absolute",
    right: 15,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  form: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  input: {
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
  },
  inlineClearButton: {
    position: "absolute",
    right: 10,
    top: 10,
    padding: 4,
  },
  charCount: {
    marginTop: 8,
    fontSize: 12,
    textAlign: "right",
  },
  error: {
    marginTop: 8,
    fontSize: 13,
  },
});
