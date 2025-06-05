import { useMutation, useQueryClient, QueryKey } from "react-query";
import { deleteComment } from "../services/comment";
import { logInteraction } from "../services/interaction";
import { useAuth } from "../contexts/AuthContext";

export const useDeleteComment = (postId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation(deleteComment, {
    /* ─────────── OPTIMISTIC UPDATE ─────────── */
    onMutate: async (commentId: string) => {
      const keysToTouch: QueryKey[] = [
        ["comments", postId],
        ["posts", user?.id, "image"],
        ["homeFeed", user?.id],
        ["exploreFeed"],          //  <-- NEW
      ];

      await Promise.all(keysToTouch.map((k) => queryClient.cancelQueries(k)));

      const snapshots = Object.fromEntries(
        keysToTouch.map((k) => [k.toString(), queryClient.getQueryData(k)])
      );

      // Remove the comment from the list
      queryClient.setQueryData(["comments", postId], (old: any) =>
        old?.pages
          ? {
              ...old,
              pages: old.pages.map((page: any[]) =>
                page.filter((c) => c.id !== commentId)
              ),
            }
          : old
      );

      // Decrement comment_count everywhere that post appears
      const decrement = (old: any) =>
        old?.pages
          ? {
              ...old,
              pages: old.pages.map((page: any[]) =>
                page.map((p) =>
                  p.id === postId
                    ? {
                        ...p,
                        comment_count: Math.max(0, (p.comment_count ?? 1) - 1),
                      }
                    : p
                )
              ),
            }
          : old;

      keysToTouch
        .filter((k) => k[0] !== "comments")
        .forEach((k) => queryClient.setQueriesData({ queryKey: k }, decrement));

      // Log interaction (negative)
      logInteraction({
        type: "comment",
        postId,
        targetUserId: undefined,
        direction: "negative",
        userId: user?.id ?? "",
      });

      return { snapshots };
    },

    /* ─────────── ROLLBACK ON ERROR ─────────── */
    onError: (_err, _commentId, ctx) => {
      if (!ctx?.snapshots) return;
      Object.entries(ctx.snapshots).forEach(([k, data]) =>
        queryClient.setQueryData(JSON.parse(k), data)
      );
    },

    /* ─────────── FINALIZE ─────────── */
    onSettled: () => {
      queryClient.invalidateQueries(["comments", postId]);
      queryClient.invalidateQueries(["posts", user?.id, "image"]);
      queryClient.invalidateQueries(["homeFeed", user?.id]);
      queryClient.invalidateQueries(["exploreFeed"]);
    },
  });
};
