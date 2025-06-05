import React, { useCallback, useState, useMemo } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/lib/contexts/ThemeProvider";
import { QueryKey, useMutation, useQueryClient } from "react-query";

import PostHeader from "./PostHeader";
import PostMedia from "./PostMedia";
import PostFooter from "./PostFooter";

import { likePost, unlikePost } from "@/lib/services/like";
import { logInteraction } from "@/lib/services/interaction";
import { extractUrl } from "@/lib/utilities/extractUrl";
import { styles as localStyles } from "./styles";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useFloatingOptionsModal } from "@/lib/hooks/useFloatingOptionsModal";

interface ImageSkeletonProps {
  item: any;
  profile: any;
  onRequestClose?: () => void;
  onDeleteStart?: () => void;
  onDeleteFinish?: () => void;
}

const SearchImageSkeleton: React.FC<ImageSkeletonProps> = ({
  item,
  profile,
  onRequestClose,
  onDeleteStart,
  onDeleteFinish,
}) => {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { openOptionsModal } = useFloatingOptionsModal();

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
      /* ---------- OPTIMISTIC UPDATE ---------- */
      onMutate: async (postId: string) => {
        // 1️⃣ Pause any outgoing refetches for the affected queries
        const keysToTouch: QueryKey[] = [
          ["posts", profile?.id, "image"],
          ["homeFeed", user?.id],
          ["exploreFeed"],                //  <-- NEW
        ];
        await Promise.all(
          keysToTouch.map((k) => queryClient.cancelQueries(k))
        );
  
        // 2️⃣ Snapshot current cache so we can roll back on error
        const snapshots = Object.fromEntries(
          keysToTouch.map((k) => [k.toString(), queryClient.getQueryData(k)])
        );
  
        // 3️⃣ Generic helper that flips like status inside any infinite‑query result
        const updateLikes = (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any[]) =>
              page.map((p) =>
                p.id !== postId
                  ? p
                  : {
                      ...p,
                      is_liked: !p.is_liked,
                      like_count: p.is_liked
                        ? (p.like_count ?? 1) - 1
                        : (p.like_count ?? 0) + 1,
                    }
              )
            ),
          };
        };
  
        // 4️⃣ Apply the optimistic change to every cache slice
        keysToTouch.forEach((k) =>
          queryClient.setQueriesData({ queryKey: k }, updateLikes)
        );
  
        // 5️⃣ Return snapshots so onError can restore them
        return { snapshots };
      },
  
      /* ---------- ROLLBACK ON ERROR ---------- */
      onError: (_err, _postId, ctx) => {
        if (!ctx?.snapshots) return;
        Object.entries(ctx.snapshots).forEach(([k, data]) =>
          queryClient.setQueryData(JSON.parse(k), data)
        );
        console.error("Error toggling like");
      },
  
      /* ---------- FINALIZE ---------- */
      onSettled: () => {
        // Re‑fetch the real data to make sure everything is in sync
        queryClient.invalidateQueries(["posts", profile?.id, "image"]);
        queryClient.invalidateQueries(["homeFeed", user?.id]);
        queryClient.invalidateQueries(["exploreFeed"]);
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
        avatarUrl={profile?.avatar_url}
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

export default SearchImageSkeleton;
