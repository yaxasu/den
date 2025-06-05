// src/app/index.tsx
import React, { useEffect } from "react";
import { View } from "react-native";
import { useQueryClient } from "react-query";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getPaginatedPosts, getHomeFeedPosts } from "@/lib/services/post";

const POSTS_FETCH_LIMIT = 6;

export default function Index() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && user) {
      // Prefetch profile posts
      queryClient.prefetchInfiniteQuery(
        ["posts", user.id, "image"],
        async ({ pageParam = 1 }) => {
          return getPaginatedPosts({
            userId: user.id,
            mediaType: "image",
            page: pageParam,
            limit: POSTS_FETCH_LIMIT,
          });
        },
        {
          getNextPageParam: (lastPage, pages) =>
            lastPage.length < POSTS_FETCH_LIMIT ? undefined : pages.length + 1,
          staleTime: 60_000,
        }
      ).catch((err) => console.error("Prefetch profile posts failed", err));

      // Prefetch home feed — user-specific
      queryClient.prefetchInfiniteQuery(
        ["homeFeed", user.id],
        async ({ pageParam = 1 }) => {
          return getHomeFeedPosts({
            page: pageParam,
            limit: POSTS_FETCH_LIMIT,
          });
        },
        {
          getNextPageParam: (lastPage, pages) =>
            lastPage.length < POSTS_FETCH_LIMIT ? undefined : pages.length + 1,
          staleTime: 60_000,
        }
      ).catch((err) => console.error("Prefetch home feed failed", err));

    }
  }, [loading, user, queryClient]);

  return <View style={{ flex: 1, backgroundColor: "black" }} />;
}
