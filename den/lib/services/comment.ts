import { Comment } from "../schema";
import { supabase } from "../supabaseClient";

// Paginated comments with joined user info
export const getPaginatedComments = async ({
  postId,
  page,
  limit,
}: {
  postId: string;
  page: number;
  limit: number;
}): Promise<Comment[]> => {
  const offset = (page - 1) * limit;
  const from = offset;
  const to = offset + limit - 1;

  const { data, error } = await supabase
    .from("comments")
    .select("*, user:user_id(id, username, avatar_url)")
    .eq("post_id", postId)
    // .order("created_at", { ascending: true })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching paginated comments:", error);
    throw error;
  }

  return (data as Comment[]) || [];
};

// Add comment and fetch joined user info
export const addComment = async ({
  postId,
  userId,
  comment_text,
}: {
  postId: string;
  userId: string;
  comment_text: string;
}): Promise<Comment> => {
  const { data, error } = await supabase
    .from("comments")
    .insert([{ post_id: postId, user_id: userId, comment_text }])
    .select("*, user:user_id(id, username, avatar_url)")
    .single();

  if (error) {
    console.error("Error adding comment:", error);
    throw error;
  }

  return data as Comment;
};


export const deleteComment = async (commentId: string): Promise<Comment> => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .single();
  
      if (error) throw error;
      return data as Comment;
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  };