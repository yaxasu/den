import React, { useCallback, useState, useMemo } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/lib/contexts/ThemeProvider";
import { useMutation, useQueryClient } from "react-query";

import PostHeader from "./PostHeader";
import PostMedia from "./PostMedia";
import PostFooter from "./PostFooter";

import { deletePostAndMedia } from "@/lib/services/post";
import { likePost, unlikePost } from "@/lib/services/like";
import { extractUrl } from "@/lib/utilities/extractUrl";
import { styles as localStyles } from "./styles";
import { useFloatingOptionsModal } from "@/lib/hooks/useFloatingOptionsModal";
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback";

interface ImageSkeletonProps {
  item: any;
  profile: any;
  onRequestClose: () => void;
  onDeleteStart?: () => void;
  onDeleteFinish?: () => void;
}

const ImageSkeleton: React.FC<ImageSkeletonProps> = ({
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

  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);

  const debouncedPush = useDebouncedCallback(
    (destination: Parameters<typeof router.push>[0]) => {
      router.push(destination);
    },
    500
  );

  const avatarUrl = useMemo(() => {
    return profile?.avatar_url?.trim() ? extractUrl(profile.avatar_url) : null;
  }, [profile?.avatar_url]);

  const deleteMutation = useMutation(
    async (mediaUrl: string) => {
      return deletePostAndMedia(mediaUrl);
    },
    {
      onMutate: async () => {
        await queryClient.cancelQueries(["posts", profile?.id, "image"]);
        await queryClient.cancelQueries(["postCount", profile?.id]);

        const previousPostsData = queryClient.getQueryData([
          "posts",
          profile?.id,
          "image",
        ]);
        const previousPostCount = queryClient.getQueryData([
          "postCount",
          profile?.id,
        ]);

        // Optimistically update posts
        queryClient.setQueryData(["posts", profile?.id, "image"], (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any[]) =>
              page.filter((p) => p.id !== item.id)
            ),
          };
        });

        // Optimistically update post count
        queryClient.setQueryData(["postCount", profile?.id], (old: any) => {
          if (typeof old === "number") return old - 1;
          return old;
        });

        return { previousPostsData, previousPostCount };
      },
      onError: (err, _, context) => {
        if (context?.previousPostsData) {
          queryClient.setQueryData(
            ["posts", profile?.id, "image"],
            context.previousPostsData
          );
        }
        if (context?.previousPostCount !== undefined) {
          queryClient.setQueryData(
            ["postCount", profile?.id],
            context.previousPostCount
          );
        }
        console.error("Error deleting post:", err);
      },
      onSuccess: () => {
        queryClient.invalidateQueries(["posts", profile?.id, "image"]);
        queryClient.invalidateQueries(["postCount", profile?.id]);
      },
    }
  );

  const likeMutation = useMutation(
    async (postId: string) =>
      item.is_liked ? unlikePost(postId) : likePost(postId),
    {
      onMutate: async (postId: string) => {
        await queryClient.cancelQueries(["posts", profile?.id, "image"]);

        const previousData = queryClient.getQueryData([
          "posts",
          profile?.id,
          "image",
        ]);

        queryClient.setQueryData(["posts", profile?.id, "image"], (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any[]) =>
              page.map((p) =>
                p.id === postId
                  ? {
                      ...p,
                      is_liked: !p.is_liked,
                      like_count: p.is_liked
                        ? p.like_count - 1
                        : p.like_count + 1,
                    }
                  : p
              )
            ),
          };
        });

        return { previousData };
      },
      onError: (error, _, context) => {
        if (context?.previousData) {
          queryClient.setQueryData(
            ["posts", profile?.id, "image"],
            context.previousData
          );
        }
        console.error("Error toggling like:", error);
      },
    }
  );

  const toggleCaption = useCallback(() => {
    setShowFullCaption((prev) => !prev);
  }, []);

  const handleDeletePost = useCallback(() => {
    const mediaUrl = extractUrl(item.id);
    if (!mediaUrl) {
      console.error("Media URL is null, cannot delete post");
      return;
    }

    // 🔥 Optimistic UI
    if (onDeleteStart) onDeleteStart();

    deleteMutation.mutate(mediaUrl, {
      onSettled: () => {
        if (onDeleteFinish) onDeleteFinish();
      },
    });
  }, [item?.id, deleteMutation, onDeleteStart, onDeleteFinish]);

  const openDeleteOptions = useCallback(() => {
    openOptionsModal([
      {
        text: "Edit Caption",
        onPress: () => {
          debouncedPush({
            pathname: "/edit/[field]",
            params: { field: "caption", postId: item.id },
          });
        },
      },
      {
        text: "Delete Post",
        onPress: handleDeletePost,
        destructive: true,
        loading: deleteMutation.isLoading,
      },
    ]);
  }, [handleDeletePost, deleteMutation.isLoading]);

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
        setDeleteModalVisible={openDeleteOptions}
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
