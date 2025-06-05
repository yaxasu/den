import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import FastImage from "react-native-fast-image";
import { useMutation, useQuery, useQueryClient } from "react-query";
import * as Haptics from "expo-haptics";

import SkeletonLoader from "../../general/SkeletonLoader";
import { ThemeType } from "@/constants/Colors";
import {
  followUser,
  unfollowUser,
  getFollowStats,
} from "@/lib/services/follow";
import { getCurrentUserId } from "@/lib/services/auth";
import { getPostCount } from "@/lib/services/post";
import { logInteraction } from "@/lib/services/interaction";

interface UserProfileHeaderProps {
  theme: ThemeType;
  insets: { top: number; left: number; right: number; bottom: number };
  profile: {
    id: string;
    full_name?: string;
    bio?: string;
    avatar_url?: string;
    is_following?: boolean;
  };
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

export default function UserProfileHeader({
  theme,
  insets,
  profile,
}: UserProfileHeaderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isAvatarLoaded, setIsAvatarLoaded] = useState(false);
  const [isFollowing, setIsFollowing] = useState(profile.is_following ?? false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const avatarUrl = profile.avatar_url?.trim() || null;

  const { data: followStats } = useQuery(
    ["followStats", profile.id],
    () => getFollowStats(profile.id),
    { enabled: !!profile.id }
  );

  const { data: postCount } = useQuery(
    ["postCount", profile.id],
    () => getPostCount(profile.id),
    { enabled: !!profile.id }
  );

  useEffect(() => {
    getCurrentUserId().then(setCurrentUserId);
  }, []);

  useEffect(() => {
    setIsFollowing(profile.is_following ?? false);
  }, [profile.is_following]);

  const followMutation = useMutation(
    () => (isFollowing ? unfollowUser(profile.id) : followUser(profile.id)),
    {
      onMutate: async () => {
        setIsFollowing((prev) => !prev);

        await queryClient.cancelQueries(["profile", profile.id]);

        const previousProfile = queryClient.getQueryData<any>([
          "profile",
          profile.id,
        ]);

        queryClient.setQueryData(["profile", profile.id], (old: any) => ({
          ...old,
          is_following: !isFollowing,
        }));

        return { previousProfile };
      },
      onError: (_err, _vars, context) => {
        setIsFollowing((prev) => !prev);
        if (context?.previousProfile) {
          queryClient.setQueryData(["profile", profile.id], context.previousProfile);
        }
      },
      onSettled: async () => {
        const currentId = await getCurrentUserId();

        if (currentId) {
          await logInteraction({
            type: "follow",
            targetUserId: profile.id,
            direction: isFollowing ? "negative" : "positive",
            userId: currentId,
          });
        }

        queryClient.invalidateQueries(["profile", profile.id]);
        queryClient.invalidateQueries(["followStats", profile.id]);
        queryClient.invalidateQueries(["followStats", currentId]);
        queryClient.invalidateQueries(["followers", profile.id]);
        queryClient.invalidateQueries(["following", currentUserId]);
      },
    }
  );

  const handleFollowPress = () => {
    if (profile.id === currentUserId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    followMutation.mutate();
  };

  const handleFollowersPress = () => {
    router.push({
      pathname: "/(settings)/follow",
      params: { type: "followers", userId: profile.id },
    });
  };
  
  const handleFollowingPress = () => {
    router.push({
      pathname: "/(settings)/follow",
      params: { type: "following", userId: profile.id },
    });
  };

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
            source={{ uri: avatarUrl }}
            style={styles.profileAvatar}
            resizeMode={FastImage.resizeMode.cover}
            onLoad={() => setIsAvatarLoaded(true)}
            onError={() => {
              console.error("Error loading avatar");
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
          onPress={handleFollowersPress}
        />
        <StatItem
          theme={theme}
          value={followStats?.followingCount ?? "—"}
          label="Following"
          onPress={handleFollowingPress}
        />
      </View>

      {/* Follow Button */}
      {profile.id !== currentUserId && (
        <TouchableOpacity
          style={[
            styles.editButton,
            {
              backgroundColor: isFollowing ? theme.border : theme.primary,
              borderWidth: isFollowing ? 1 : 0,
              borderColor: theme.border,
            },
          ]}
          onPress={handleFollowPress}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.editButtonText,
              {
                color: isFollowing ? theme.text : theme.onPrimary,
              },
            ]}
          >
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      )}

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
    borderWidth: 1,
    borderColor: "#ccc",
    overflow: "hidden",
    backgroundColor: "transparent",
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
