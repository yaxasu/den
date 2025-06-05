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
import { getProfile } from "@/lib/services/profile";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function BioEditForm() {
  const router = useRouter();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const inputRef = useRef<TextInput>(null);

  // const { data: profile } = useQuery("profile", getProfile);
  const { user: profile, refreshProfile } = useAuth();
  const [bio, setBio] = useState(profile?.bio || "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile?.bio) setBio(profile.bio);
  }, [profile]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const mutation = useMutation(
    async (newBio: string) => {
      const userId = await supabase.auth.getUser().then(res => res.data.user?.id);
      if (!userId) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ bio: newBio })
        .eq("id", userId);

      if (error) throw error;
    },
    {
      onMutate: async (newBio) => {
        await queryClient.cancelQueries("profile");
        const previous = queryClient.getQueryData("profile");

        queryClient.setQueryData("profile", (old: any) => ({
          ...old,
          bio: newBio,
        }));

        return { previous };
      },
      onError: (_, __, context) => {
        if (context?.previous) {
          queryClient.setQueryData("profile", context.previous);
        }
        Alert.alert("Update failed", "Something went wrong while updating your bio.");
      },
      onSuccess: async () => {
        queryClient.invalidateQueries("profile");
        await refreshProfile()
        router.back();
      },
    }
  );

  const handleSave = () => {
    const trimmed = bio.trim();
    if (trimmed.length > 150) {
      setError("Bio must be 150 characters or less.");
      return;
    }

    if (trimmed === profile?.bio) {
      router.back(); // no changes
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

        <Text style={[styles.headerTitle, { color: theme.text }]}>Bio</Text>

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
            value={bio}
            onChangeText={setBio}
            placeholder="Write something about yourself"
            multiline
            maxLength={150}
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
            accessibilityLabel="Bio input"
          />
          {bio.length > 0 && (
            <TouchableOpacity
              onPress={() => setBio("")}
              style={styles.inlineClearButton}
              accessibilityLabel="Clear bio input"
            >
              <Ionicons name="close" size={20} color={theme.subText} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.charCount, { color: theme.subText }]}>
          {bio.length}/150
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
