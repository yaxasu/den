import { useMutation, useQueryClient, QueryKey } from "react-query";
import { Alert } from "react-native";
import { addComment } from "../services/comment";
import { logInteraction } from "../services/interaction";
import { useAuth } from "../contexts/AuthContext";
import { Comment } from "@/lib/schema";

interface NewComment {
  postId: string;
  userId: string;
  comment_text: string;
}

export const useAddComment = (postId: string) => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  return useMutation(addComment, {
    /* ─────────── OPTIMISTIC UPDATE ─────────── */
    onMutate: async (newComment: NewComment) => {
      const { postId, userId, comment_text } = newComment;

      const keysToTouch: QueryKey[] = [
        ["comments", postId],
        ["posts", userId, "image"],
        ["homeFeed", userId],
        ["exploreFeed"],          //  <-- NEW
      ];

      // 1️⃣ Pause ongoing refetches
      await Promise.all(keysToTouch.map((k) => queryClient.cancelQueries(k)));

      // 2️⃣ Snapshot caches for rollback
      const snapshots = Object.fromEntries(
        keysToTouch.map((k) => [k.toString(), queryClient.getQueryData(k)])
      );

      // 3️⃣ Add an optimistic comment to the first page
      const optimisticComment: Comment = {
        id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        post_id: postId,
        user_id: userId,
        comment_text,
        created_at: new Date().toISOString(),
        user: {
          id: userId,
          username: currentUser?.username ?? "You",
          avatar_url: currentUser?.avatar_url ?? "",
        },
      };
      queryClient.setQueryData(["comments", postId], (old: any) => {
        const firstPage = old?.pages?.[0] ?? [];
        return {
          ...old,
          pages: [[optimisticComment, ...firstPage], ...(old?.pages?.slice(1) ?? [])],
        };
      });

      // 4️⃣ Bump comment_count everywhere that post appears
      const bumpCount = (old: any) =>
        old?.pages
          ? {
              ...old,
              pages: old.pages.map((page: any[]) =>
                page.map((p) =>
                  p.id === postId
                    ? { ...p, comment_count: (p.comment_count ?? 0) + 1 }
                    : p
                )
              ),
            }
          : old;

      keysToTouch
        .filter((k) => k[0] !== "comments") // we already handled the comment list
        .forEach((k) => queryClient.setQueriesData({ queryKey: k }, bumpCount));

      // 5️⃣ Log interaction
      logInteraction({
        type: "comment",
        postId,
        targetUserId: undefined,
        direction: "positive",
        userId,
      });

      return { snapshots };
    },

    /* ─────────── ROLLBACK ON ERROR ─────────── */
    onError: (_err, newComment, ctx) => {
      if (!ctx?.snapshots) return;
      Object.entries(ctx.snapshots).forEach(([k, data]) =>
        queryClient.setQueryData(JSON.parse(k), data)
      );
      Alert.alert("Error", "Failed to post comment");
    },

    /* ─────────── FINALIZE ─────────── */
    onSettled: (_data, _err, newComment) => {
      queryClient.invalidateQueries(["comments", newComment.postId]);
      queryClient.invalidateQueries(["posts", newComment.userId, "image"]);
      queryClient.invalidateQueries(["homeFeed", newComment.userId]);
      queryClient.invalidateQueries(["exploreFeed"]);
    },
  });
};
