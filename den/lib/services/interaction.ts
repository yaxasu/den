import { supabase } from "@/lib//supabaseClient";

type InteractionType = "like" | "comment" | "view" | "follow" | "share" | "hide";
type InteractionDirection = "positive" | "negative";

export async function logInteraction({
  type,
  postId,
  targetUserId,
  metadata,
  direction = "positive",
  userId, // ✅ add this
}: {
  type: InteractionType;
  postId?: string;
  targetUserId?: string;
  metadata?: Record<string, any>;
  direction?: InteractionDirection;
  userId: string; // ✅ required
}) {
  const { error } = await supabase.from("interactions").insert({
    user_id: userId, // ✅ required field
    type,
    post_id: postId ?? null,
    target_user_id: targetUserId ?? null,
    metadata,
    direction,
  });

  if (error) {
    console.error("Failed to log interaction:", error);
  }
}
