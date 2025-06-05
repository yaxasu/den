import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import FastImage from "react-native-fast-image";
import { useQuery } from "react-query";

import SkeletonLoader from "../../general/SkeletonLoader";
import { ThemeType } from "@/constants/Colors";
import { Profile } from "@/lib/schema";
import { getFollowStats } from "@/lib/services/follow";
import { getPostCount } from "@/lib/services/post";
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback";

interface ProfileHeaderProps {
  theme: ThemeType;
  insets: { top: number; left: number; right: number; bottom: number };
  profile: Profile | null; // ensure profile can be null
}

const StatItem = ({
  theme,
  value,
  label,
  onPress,
}: {
  theme: ThemeType;
  value: string | number;
  label: string;
  onPress?: () => void;
}) => {
  const content = (
    <View style={styles.statItem}>
      <Text style={[styles.statNumber, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.secondaryText }]}>
        {label}
      </Text>
    </View>
  );

  return onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  ) : (
    content
  );
};

export default function ProfileHeader({
  theme,
  insets,
  profile,
}: ProfileHeaderProps) {
  const router = useRouter();
  const [isAvatarLoaded, setIsAvatarLoaded] = useState(false);

  const debouncedPush = useDebouncedCallback(
    (destination: "/(tabs)" | "/(auth)/EnterEmail") => {
      router.push(destination);
    },
    500
  );

  if (!profile) return null;

  const avatarUrl =
    profile.avatar_url && profile.avatar_url.trim() !== ""
      ? profile.avatar_url
      : null;

  const { data: followStats } = useQuery(
    ["followStats", profile.id],
    () => getFollowStats(profile.id),
    {
      enabled: !!profile?.id,
      refetchOnWindowFocus: false,
    }
  );

  const { data: postCount } = useQuery(
    ["postCount", profile.id],
    () => getPostCount(profile.id),
    {
      enabled: !!profile?.id,
      refetchOnWindowFocus: false,
    }
  );

  return (
    <View style={[styles.profileInfoContainer, { paddingHorizontal: 30 }]}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {!isAvatarLoaded && (
          <SkeletonLoader
            theme={theme}
            style={{ borderRadius: 50, backgroundColor: theme.border }}
          />
        )}
        {avatarUrl ? (
          <FastImage
            source={{ uri: avatarUrl, priority: FastImage.priority.normal }}
            style={styles.profileAvatar}
            resizeMode={FastImage.resizeMode.cover}
            onLoad={() => setIsAvatarLoaded(true)}
            onError={() => {
              console.error("ProfileHeader: Error loading avatar");
              setIsAvatarLoaded(false);
            }}
          />
        ) : (
          <View
            style={[
              styles.profileAvatar,
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
      </View>

      {/* Name */}
      <Text style={[styles.name, { color: theme.text }]}>
        {profile.full_name || "Your Name"}
      </Text>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <StatItem theme={theme} value={postCount ?? "—"} label="Posts" />
        <StatItem
          theme={theme}
          value={followStats?.followerCount ?? "—"}
          label="Followers"
          onPress={() => router.push({
            pathname: '/(settings)/follow',
            params: {type: 'followers'}
          })}
        />
        
        <StatItem
          theme={theme}
          value={followStats?.followingCount ?? "—"}
          label="Following"
          onPress={() => router.push({
            pathname: '/(settings)/follow',
            params: {type: 'following'}
          })}
        />
        
      </View>

      {/* Edit Profile */}
      <TouchableOpacity
        style={[styles.editButton, { backgroundColor: theme.primary }]}
        onPress={() => debouncedPush("/(settings)/editProfile")}
        activeOpacity={0.7}
      >
        <Text style={[styles.editButtonText, { color: theme.onPrimary }]}>
          Edit profile
        </Text>
      </TouchableOpacity>

      {/* Bio */}
      <View style={{ marginBottom: 32 }}>
        {!!profile.bio && (
          <Text style={[styles.bio, { color: theme.secondaryText }]}>
            {profile.bio}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileInfoContainer: {
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    marginBottom: 16,
    borderRadius: 50,
    overflow: "hidden",
    backgroundColor: "transparent",
    position: "relative",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  profileAvatar: {
    width: "100%",
    height: "100%",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
    marginHorizontal: 16,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  editButton: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
    height: 40,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  bio: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
});
