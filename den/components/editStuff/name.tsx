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

export default function NameEditForm() {
  const router = useRouter();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const inputRef = useRef<TextInput>(null);

  // const { data: profile } = useQuery("profile", getProfile);
  const { user: profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.full_name || "");
  const [error, setError] = useState("");
  

  useEffect(() => {
    if (profile?.full_name) {
      setName(profile.full_name);
    }
  }, [profile]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const mutation = useMutation(
    async (newName: string) => {
      const userId = await supabase.auth.getUser().then((res) => res.data.user?.id);
      if (!userId) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ full_name: newName })
        .eq("id", userId);

      if (error) throw error;
    },
    {
      onMutate: async (newName) => {
        await queryClient.cancelQueries("profile");
        const previous = queryClient.getQueryData("profile");
        queryClient.setQueryData("profile", (old: any) => ({
          ...old,
          full_name: newName,
        }));
        return { previous };
      },
      onError: (_, __, context) => {
        if (context?.previous) {
          queryClient.setQueryData("profile", context.previous);
        }
        Alert.alert("Update failed", "Something went wrong while updating your name.");
      },
      onSuccess: async () => {
        queryClient.invalidateQueries("profile");
        await refreshProfile()
        router.back();
      },
    }
  );

  const validateName = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return "Name cannot be empty.";
    if (trimmed.length > 50) return "Name must be 50 characters or fewer.";
    if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
      return "Only letters, spaces, hyphens, and apostrophes are allowed.";
    }
    return null;
  };

  const handleSave = () => {
    const trimmed = name.trim();
    const validationError = validateName(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (trimmed === profile?.full_name) {
      router.back(); // no changes
      return;
    }

    setError("");
    mutation.mutate(trimmed);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>Name</Text>

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
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            autoCapitalize="words"
            autoCorrect={false}
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: error ? theme.primary : theme.border,
                paddingRight: 36,
              },
            ]}
            placeholderTextColor={theme.subText}
            accessibilityLabel="Full name input"
            maxLength={25}
          />
          {name.length > 0 && (
            <TouchableOpacity
              onPress={() => setName("")}
              style={styles.inlineClearButton}
              accessibilityLabel="Clear name input"
            >
              <Ionicons name="close" size={20} color={theme.subText} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.charCount, { color: theme.subText }]}>
          {name.length}/25
        </Text>
        {!!error && <Text style={[styles.error, { color: theme.primary }]}>{error}</Text>}
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
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  inlineClearButton: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    padding: 4,
  },
  error: {
    marginTop: 8,
    fontSize: 13,
  },
  charCount: {
    marginTop: 6,
    fontSize: 12,
    alignSelf: "flex-end",
  },
});
