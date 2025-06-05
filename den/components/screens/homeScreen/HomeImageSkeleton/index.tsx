import React, { useCallback, useState, useMemo } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/lib/contexts/ThemeProvider";
import { useMutation, useQueryClient } from "react-query";

import PostHeader from "./PostHeader";
import PostMedia from "./PostMedia";
import PostFooter from "./PostFooter";

import { likePost, unlikePost } from "@/lib/services/like";
import { extractUrl } from "@/lib/utilities/extractUrl";
import { styles as localStyles } from "./styles";

import { useFloatingOptionsModal } from "@/lib/hooks/useFloatingOptionsModal";
import { useAuth } from "@/lib/contexts/AuthContext";
import { logInteraction } from "@/lib/services/interaction";

interface HomeSkeletonProps {
  item: any;
  profile: any;
  onRequestClose: () => void;
  onDeleteStart?: () => void;
  onDeleteFinish?: () => void;
  disabled?: boolean;
}

const ImageSkeleton: React.FC<HomeSkeletonProps> = ({
  item,
  profile,
  onRequestClose,
  onDeleteStart,
  onDeleteFinish,
}) => {
  const router = useRouter();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const { openOptionsModal } = useFloatingOptionsModal();
  const { user } = useAuth();

  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);

  const avatarUrl = useMemo(() => {
    return profile?.avatar_url?.trim() ? extractUrl(profile.avatar_url) : null;
  }, [profile?.avatar_url]);

  const likeMutation = useMutation(
    async (postId: string) =>
      item.is_liked ? unlikePost(postId) : likePost(postId),
    {
      onMutate: async (postId: string) => {
        await Promise.all([
          queryClient.cancelQueries(["posts", profile?.id, "image"]),
          queryClient.cancelQueries(["homeFeed", user?.id]),
        ]);

        const previousProfilePosts = queryClient.getQueryData(["posts", profile?.id, "image"]);
        const previousHomeFeed = queryClient.getQueryData(["homeFeed", user?.id]);

        const updateLikes = (old: any) => {
          if (!old?.pages) return old;

          return {
            ...old,
            pages: old.pages.map((page: any[]) =>
              page.map((p) => {
                if (p.id !== postId) return p;
                const newLiked = !p.is_liked;
                if (user?.id) {
                  logInteraction({
                    type: "like",
                    postId,
                    targetUserId: p.user_id,
                    direction: newLiked ? "positive" : "negative",
                    userId: user.id,
                  });
                }
                return {
                  ...p,
                  is_liked: newLiked,
                  like_count: newLiked ? (p.like_count ?? 0) + 1 : (p.like_count ?? 1) - 1,
                };
              })
            ),
          };
        };

        queryClient.setQueryData(["posts", profile?.id, "image"], updateLikes);
        queryClient.setQueryData(["homeFeed", user?.id], updateLikes);

        return { previousProfilePosts, previousHomeFeed };
      },

      onError: (_err, _postId, ctx) => {
        if (ctx?.previousProfilePosts) {
          queryClient.setQueryData(["posts", profile?.id, "image"], ctx.previousProfilePosts);
        }
        if (ctx?.previousHomeFeed) {
          queryClient.setQueryData(["homeFeed", user?.id], ctx.previousHomeFeed);
        }
        console.error("Error toggling like");
      },

      onSettled: (_data, _err, _postId) => {
        queryClient.invalidateQueries(["posts", profile?.id, "image"]);
        queryClient.invalidateQueries(["homeFeed", user?.id]);
      },
    }
  );

  const toggleCaption = useCallback(() => {
    setShowFullCaption((prev) => !prev);
  }, []);

  const openPlaceholderModal = useCallback(() => {
    openOptionsModal([]);
  }, [openOptionsModal]);

  return (
    <View
      style={[
        localStyles.container,
        {
          backgroundColor: theme.background,
          paddingBottom: 15,
        },
      ]}
    >
      <PostHeader
        profile={profile}
        avatarUrl={avatarUrl}
        isProfileLoaded={isProfileLoaded}
        setIsProfileLoaded={setIsProfileLoaded}
        setDeleteModalVisible={openPlaceholderModal}
        theme={theme}
      />

      <PostMedia
        item={item}
        isMediaLoaded={isMediaLoaded}
        setIsMediaLoaded={setIsMediaLoaded}
        theme={theme}
      />

      <PostFooter
        item={item}
        showFullCaption={showFullCaption}
        toggleCaption={toggleCaption}
        needsTruncation={needsTruncation}
        setNeedsTruncation={setNeedsTruncation}
        likeMutation={likeMutation}
        theme={theme}
      />
    </View>
  );
};

export default ImageSkeleton;
