import { useTheme } from "@/lib/contexts/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ImagePicker from "react-native-image-crop-picker";
import { useMutation, useQueryClient } from "react-query";
import { deleteImageFromCloudflare } from "@/lib/services/post";
import { useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getImageUploadUrl } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function PictureEditForm() {
  const router = useRouter();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const { user: profile, refreshProfile } = useAuth();
  const [newImage, setNewImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const hasChanges = useMemo(
    () => !!newImage && newImage !== profile?.avatar_url,
    [newImage, profile?.avatar_url]
  );

  const mutation = useMutation(
    async (avatarUrl: string) => {
      const userId = await supabase.auth.getUser().then(res => res.data.user?.id);
      if (!userId) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId);

      if (error) throw error;
    },
    {
      onSuccess: async () => {
        queryClient.invalidateQueries("profile");
        await refreshProfile();
        router.back();
      },
      onError: () => {
        Alert.alert("Error", "Failed to update your profile picture.");
      },
    }
  );

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.openPicker({
        width: 800,
        height: 800,
        cropping: true,
        cropperToolbarTitle: "Crop your profile picture",
        cropperCircleOverlay: true,
        compressImageQuality: 0.9,
      });

      if (result?.path) {
        setNewImage(result.path);
      }
    } catch (err: any) {
      if (err.code !== "E_PICKER_CANCELLED") {
        console.error("Image picker error:", err);
        Alert.alert("Error", "Something went wrong while picking the image.");
      }
    }
  };

  const handleSave = async () => {
    if (!newImage) return;

    try {
      setUploading(true);

      const uploadUrl = await getImageUploadUrl();
      const formData = new FormData();

      formData.append("file", {
        uri: newImage,
        name: "avatar.jpg",
        type: "image/jpeg",
      } as any);

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      const newAvatarUrl = result?.result?.variants?.[0];
      if (!newAvatarUrl) throw new Error("Upload failed");

      if (profile?.avatar_url) {
        await deleteImageFromCloudflare(profile.avatar_url);
      }

      mutation.mutate(newAvatarUrl);
    } catch (err) {
      console.error("Error uploading image:", err);
      Alert.alert("Error", "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const hasImage = !!newImage || !!profile?.avatar_url;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Picture
        </Text>

        <TouchableOpacity
          onPress={handleSave}
          disabled={!hasChanges || uploading}
          style={[
            styles.saveButton,
            {
              backgroundColor: hasChanges && !uploading ? theme.primary : theme.surface,
              opacity: hasChanges && !uploading ? 1 : 0.5,
            },
          ]}
        >
          {uploading || mutation.isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              style={[
                styles.saveButtonText,
                {
                  color: hasChanges && !uploading ? "#fff" : theme.secondaryText,
                },
              ]}
            >
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TouchableOpacity onPress={handlePickImage} style={{ alignItems: "center" }} activeOpacity={0.8}>
          {hasImage ? (
            <Image
              source={{ uri: newImage || profile?.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: theme.border,
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              <Ionicons name="person" size={60} color={theme.text} />
            </View>
          )}
          <Text style={[styles.changeText, { color: theme.primary }]}>Change Photo</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  saveButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  content: {
    marginTop: 40,
    alignItems: "center",
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  changeText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },
});
