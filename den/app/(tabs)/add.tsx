import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  TouchableOpacity,
  View,
  TextInput,
  ScrollView,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/contexts/ThemeProvider";
import { getImageUploadUrl } from "@/lib/supabaseClient";
import { useMutation, useQueryClient } from "react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MediaPreview from "@/components/screens/addScreen/MediaPreview";
import ImagePicker from "react-native-image-crop-picker";
import { createPost } from "@/lib/services/post";
import { useAuth } from "@/lib/contexts/AuthContext";

interface MediaItem {
  uri: string;
  type: "image" | "video";
  id?: string; // ✅ new
}

interface ProfileData {
  id: string;
}

export default function AddPostScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [error, setError] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const { user: profileData } = useAuth();

  const hasMedia = useMemo(() => media.length > 0, [media]);

  useEffect(() => {
    const loadDraft = async () => {
      const draft = await AsyncStorage.getItem("draft_caption");
      if (draft) setCaption(draft);
    };
    loadDraft();
  }, []);

  useEffect(() => {
    const saveDraft = async () => {
      if (caption) {
        await AsyncStorage.setItem("draft_caption", caption);
      }
    };
    return () => {
      saveDraft();
    };
  }, [caption]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const postMutation = useMutation(
    (newPost: { userId: string; caption: string; media: MediaItem }) =>
      createPost(newPost),
    {
      onMutate: async () => {
        await queryClient.cancelQueries(["posts", profileData?.id]);
      },
      onSettled: () => {
        queryClient.invalidateQueries("profile");
        if (profileData?.id) {
          queryClient.invalidateQueries(["posts", profileData.id]);
          queryClient.invalidateQueries(["postCount", profileData.id]);
        }
      },
      onSuccess: () => {
        setMedia([]);
        setCaption("");
        AsyncStorage.removeItem("draft_caption");
        setIsPosting(false);
        router.replace("/profile");
      },
      onError: () => {
        setError("Failed to post. Please try again.");
        setIsPosting(false);
      },
    }
  );

  const handleAddMedia = useCallback(async () => {
    try {
      const result = await ImagePicker.openPicker({
        cropping: true,
        cropperToolbarTitle: "Crop your photo",
        compressImageQuality: 0.9,
        width: 1080,
        height: 1350,
        cropperCircleOverlay: false,
        freeStyleCropEnabled: false,
      });

      if (result?.path) {
        setMedia([{ uri: result.path, type: "image" }]);
      }
    } catch (err: any) {
      if (err.code !== "E_PICKER_CANCELLED") {
        console.error("Cropper error:", err);
        setError("Something went wrong while selecting media.");
      }
    }
  }, []);

  const handlePost = async () => {
    if (isPosting || postMutation.isLoading || !hasMedia || !profileData) {
      if (!hasMedia) setError("Please add media.");
      if (!profileData) setError("User profile not loaded.");
      return;
    }
  
    setIsPosting(true);
    try {
      const uploadUrl = await getImageUploadUrl();
      const file = {
        uri: media[0].uri,
        name: "photo.jpg",
        type: "image/jpeg",
      };
  
      const formData = new FormData();
      formData.append("file", file as any);
  
      const xhr = new XMLHttpRequest();
      xhr.open("POST", uploadUrl);
  
      xhr.onload = () => {
        try {
          const response = JSON.parse(xhr.responseText);
          const imageUrl = response?.result?.variants?.[0];
          const imageId = response?.result?.id;
  
          if (!imageUrl || !imageId) throw new Error("Upload failed.");
  
          postMutation.mutate({
            userId: profileData.id,
            caption,
            media: {
              uri: imageUrl,
              type: "image",
              id: imageId, // ✅ include image_id
            },
          });
        } catch (err) {
          console.error("Upload parsing error:", err);
          setError("Image upload failed.");
          setIsPosting(false);
        }
      };
  
      xhr.onerror = () => {
        setError("Image upload failed.");
        setIsPosting(false);
      };
  
      xhr.send(formData);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Image upload failed.");
      setIsPosting(false);
    }
  };

  const clearMedia = useCallback(() => setMedia([]), []);

  const scrollToInput = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 50);
  }, []);

  const mediaStyle = useMemo(
    () => ({
      backgroundColor: theme.surface,
      borderColor: hasMedia ? "transparent" : theme.border,
      aspectRatio: 4 / 5,
    }),
    [theme, hasMedia]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.background,
              borderColor: theme.border,
              paddingTop: insets.top,
              height: 60 + insets.top,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handlePost}
            style={[
              styles.postButton,
              {
                backgroundColor:
                  !hasMedia || isPosting ? theme.surface : theme.primary,
                opacity: !hasMedia || isPosting ? 0.6 : 1,
              },
            ]}
            disabled={!hasMedia || isPosting}
          >
            {isPosting ? (
              <ActivityIndicator color={theme.subText} />
            ) : (
              <Text
                style={[
                  styles.postButtonText,
                  {
                    color:
                      !hasMedia || isPosting
                        ? theme.secondaryText
                        : theme.onPrimary,
                  },
                ]}
              >
                Post
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
          {!!error && (
            <Text style={[styles.errorText, { color: theme.primary }]}>
              {error}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.mediaUploadContainer, mediaStyle]}
            activeOpacity={0.8}
            onPress={handleAddMedia}
          >
            {hasMedia ? (
              <>
                <MediaPreview media={media} />
                <TouchableOpacity style={styles.clearButton} onPress={clearMedia}>
                  <Ionicons
                    name="close-circle"
                    size={30}
                    color={theme.secondaryText}
                  />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Ionicons name="camera" size={40} color={theme.secondaryText} />
                <Text style={[styles.uploadText, { color: theme.secondaryText }]}>
                  Tap to add a photo
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={inputRef}
                value={caption}
                onChangeText={setCaption}
                placeholder="Write a caption"
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
                placeholderTextColor={theme.secondaryText}
                returnKeyType="done"
                onFocus={scrollToInput}
                onSubmitEditing={handlePost}
                blurOnSubmit
                onContentSizeChange={scrollToInput}
              />
              {caption.length > 0 && (
                <TouchableOpacity
                  onPress={() => setCaption("")}
                  style={styles.inlineClearButton}
                  accessibilityLabel="Clear caption input"
                >
                  <Ionicons name="close" size={20} color={theme.secondaryText} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.charCount, { color: theme.secondaryText }]}>
              {caption.length}/300
            </Text>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  postButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  postButtonText: {
    fontWeight: "600",
    fontSize: 16,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  errorText: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    fontWeight: "500",
    fontSize: 14,
    textAlign: "center",
    borderWidth: 1,
  },
  mediaUploadContainer: {
    marginTop: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    width: "90%",
    position: "relative",
    borderWidth: 1,
    overflow: "hidden",
  },
  uploadText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "500",
  },
  clearButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  form: {
    marginTop: 16,
    width: "90%",
    alignSelf: "center",
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  input: {
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    backgroundColor: "transparent",
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
    fontWeight: "400",
  },
});