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
import { useMutation, useQueryClient, useQuery } from "react-query";
import { getProfile } from "@/lib/services/profile";
import { isUsernameAvailable, updateUsername } from "@/lib/services/profile";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function UsernameEditForm() {
  const router = useRouter();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const inputRef = useRef<TextInput>(null);

  // const { data: profile } = useQuery("profile", getProfile);
  const { user: profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username || "");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username);
    }
  }, [profile]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const mutation = useMutation(updateUsername, {
    onMutate: async (newUsername) => {
      await queryClient.cancelQueries("profile");
      const previous = queryClient.getQueryData("profile");
      queryClient.setQueryData("profile", (old: any) => ({
        ...old,
        username: newUsername,
      }));
      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData("profile", context.previous);
      }
      Alert.alert("Update failed", "Something went wrong while updating username.");
    },
    onSuccess: async () => {
      queryClient.invalidateQueries("profile");
      await refreshProfile();
      router.back();
    },
  });

  const validateUsername = (value: string): string | null => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return "Username cannot be empty.";
    if (trimmed.length < 3) return "Username must be at least 3 characters.";
    if (trimmed.length > 20) return "Username must be 20 characters max.";
    if (/[\s]/.test(trimmed)) return "Username cannot contain spaces.";
    if (/^@/.test(trimmed)) return "Username cannot start with '@'.";
    if (/^user_/.test(trimmed)) return "Username cannot start with 'user_'.";
    if (!/^[a-z0-9._]+$/.test(trimmed)) return "Only letters, numbers, underscores and dots allowed.";
    if (/^[_\.]/.test(trimmed) || /[_\.]$/.test(trimmed)) return "Username cannot start or end with '.' or '_'";
    return null;
  };

  const handleSave = async () => {
    const trimmed = username.trim().toLowerCase();
    const validationError = validateUsername(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (trimmed === profile?.username) {
      router.back();
      return;
    }

    setChecking(true);
    setError("");

    try {
      const available = await isUsernameAvailable(trimmed);
      if (!available) {
        setError("That username is already taken.");
        return;
      }

      mutation.mutate(trimmed);
    } catch (err) {
      setError("Unable to check availability.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>Username</Text>

        <TouchableOpacity
          onPress={handleSave}
          style={[
            styles.saveButton,
            {
              backgroundColor: theme.primary,
              opacity: checking || mutation.isLoading ? 0.6 : 1,
            },
          ]}
          disabled={checking || mutation.isLoading}
          accessibilityLabel="Save username"
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
            value={username}
            onChangeText={setUsername}
            placeholder="Enter a username"
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: error ? theme.primary : theme.border,
                paddingRight: 36, // make space for the "X" icon
              },
            ]}
            placeholderTextColor={theme.subText}
            accessibilityLabel="Username input"
            maxLength={20}
          />
          {username.length > 0 && (
            <TouchableOpacity
              onPress={() => setUsername("")}
              style={styles.inlineClearButton}
              accessibilityLabel="Clear username input"
            >
              <Ionicons name="close" size={20} color={theme.subText} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.charCount, { color: theme.subText }]}>
          {username.length}/20
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
