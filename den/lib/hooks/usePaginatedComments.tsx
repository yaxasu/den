// lib/hooks/usePaginatedComments.ts
import { useInfiniteQuery } from "react-query";
import { getPaginatedComments } from "../services/comment";
import { Comment } from "../schema";

const COMMENTS_PER_PAGE = 10;

// Utility to check if the postId is a valid UUID format
const isValidUUID = (id: string) => /^[0-9a-fA-F-]{36}$/.test(id);

export const usePaginatedComments = (postId: string) => {
  const isEnabled = isValidUUID(postId);

  return useInfiniteQuery<Comment[]>(
    ["comments", postId],
    async ({ pageParam = 1 }) => {
      if (!isEnabled) return []; // ⛔ prevent the query if postId is invalid
      return getPaginatedComments({
        postId,
        page: pageParam,
        limit: COMMENTS_PER_PAGE,
      });
    },
    {
      enabled: isEnabled, // ✅ Only enable the query if postId is valid
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length < COMMENTS_PER_PAGE ? undefined : allPages.length + 1,
      staleTime: 60 * 1000,
    }
  );
};
