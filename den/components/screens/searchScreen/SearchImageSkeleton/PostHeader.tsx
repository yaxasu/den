import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import SkeletonLoader from "@/components/general/SkeletonLoader";
import Avatar from "@/components/general/Avatar";
import { styles } from "./styles";
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback";
import { useRouter } from "expo-router";

interface PostHeaderProps {
  profile: any;
  avatarUrl: string | null;
  isProfileLoaded: boolean;
  setIsProfileLoaded: (val: boolean) => void;
  setDeleteModalVisible: (val: boolean) => void;
  theme: any;
}

const PostHeader: React.FC<PostHeaderProps> = ({
  profile,
  avatarUrl,
  setDeleteModalVisible,
  theme,
}) => {
  const router = useRouter()

  const debouncedPush = useDebouncedCallback(
        (destination: Parameters<typeof router.push>[0]) => {
          router.push(destination);
        },
        500
      );
  
    const goToUserProfile = () => {
      if (profile?.id) {
        debouncedPush({
          pathname: "/(userProfile)",
          params: { userProfileId: profile.id },
        });
      }
    };

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.profilePressable}
        onPress={goToUserProfile}
        activeOpacity={0.8}
      >
        <View style={styles.avatarWrapper}>
          <Avatar
            uri={avatarUrl}
            fallbackText={profile.username || ""}
            size={40}
            theme={theme}
          />
        </View>

        <View style={styles.headerTextContainer}>
          {profile.username ? (
            <Text style={[styles.username, { color: theme.text }]}>
              {profile.username}
            </Text>
          ) : (
            <SkeletonLoader theme={theme} style={styles.usernamePlaceholder} />
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setDeleteModalVisible(true)}>
        <Ionicons name="ellipsis-horizontal" size={24} color={theme.text} />
      </TouchableOpacity>
    </View>
  );
};


export default PostHeader;
