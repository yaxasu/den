import { useTheme } from "@/lib/contexts/ThemeProvider";
import { getProfile } from "@/lib/services/profile";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "react-query";
import FastImage from "react-native-fast-image";
import { Profile } from "@/lib/schema";
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback";

export default function EditProfile() {
  const router = useRouter();
  const { theme } = useTheme();

  const debouncedPush = useDebouncedCallback(
    (destination: "/(tabs)" | "/(auth)/EnterEmail") => {
      router.push(destination);
    },
    500
  );

  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Profile | null>("profile", getProfile, {
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="small" color={theme.text} />
      </View>
    );
  }

  if (isError || !profile) {
    console.error("Error loading profile", error);
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, marginBottom: 12 }}>
          Failed to load profile.
        </Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text style={{ color: theme.primary }}>Tap to retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { username, full_name, bio, avatar_url } = profile;

  const navigateToEdit = (field: string) => {
    debouncedPush({ pathname: `/edit/${field}` });
  };

  const displayAvatar = avatar_url && avatar_url.trim() !== "";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Edit Profile
        </Text>

        {/* Invisible spacer to balance layout */}
        <View style={styles.rightSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Picture */}
        <View style={styles.avatarWrapper}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => navigateToEdit("picture")}
            accessibilityLabel="Edit profile picture"
            activeOpacity={0.8}
          >
            {displayAvatar ? (
              <FastImage
                source={{ uri: avatar_url }}
                style={styles.avatar}
                resizeMode={FastImage.resizeMode.cover}
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
                <Ionicons name="person" size={40} color={theme.text} />
              </View>
            )}
            <View style={styles.editIcon}>
              <Ionicons name="camera" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Editable Fields */}
        <View style={styles.fieldsContainer}>
          <ProfileField
            label="Username"
            value={`@${username}`}
            onPress={() => navigateToEdit("username")}
            theme={theme}
          />
          <ProfileField
            label="Name"
            value={full_name}
            onPress={() => navigateToEdit("name")}
            theme={theme}
          />
          <ProfileField
            label="Bio"
            value={bio}
            onPress={() => navigateToEdit("bio")}
            theme={theme}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function ProfileField({
  label,
  value,
  onPress,
  theme,
}: {
  label: string;
  value?: string | null;
  onPress: () => void;
  theme: any;
}) {
  return (
    <TouchableOpacity
      style={styles.fieldRow}
      onPress={onPress}
      accessibilityLabel={`Edit ${label.toLowerCase()}`}
      activeOpacity={0.5}
    >
      <View>
        <Text style={[styles.fieldLabel, { color: theme.subText }]}>
          {label}
        </Text>
        <Text
          style={[styles.fieldValue, { color: theme.text }]}
          numberOfLines={1}
        >
          {value?.trim() || "Not set"}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.subText} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    position: "relative",
  },
  backButton: {
    padding: 5,
    zIndex: 2,
  },
  rightSpacer: {
    width: 28,
  },
  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 60, // ensures vertical centering
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  avatarWrapper: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    position: "relative",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    backgroundColor: "#ccc",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#000",
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  fieldsContainer: {
    gap: 20,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  fieldLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: "500",
    maxWidth: 240,
  },
});
