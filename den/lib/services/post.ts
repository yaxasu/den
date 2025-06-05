// src/services/post.ts

import axios from "axios";
import { supabase, getImageUploadUrl, getVideoUploadUrl, deleteImageEdge } from "@/lib/supabaseClient";
import { PostPayload, Post, PostWithUser } from "@/lib/schema";
import { getCurrentUserId } from "./auth";
import axiosWithAuth from "../api/api";

export async function createImagePost({
  userId,
  caption,
  media,
}: PostPayload): Promise<string> {
  const { uri, type, id: imageId } = media;

  const { error } = await supabase.from("posts").insert([
    {
      user_id: userId,
      caption,
      media_url: uri,
      media_type: type,
      image_id: imageId ?? null, // ✅ store it if present
    },
  ]);

  if (error) throw error;

  return uri;
}

export async function createVideoPost({ userId, caption, media }: PostPayload): Promise<string> {
  const uploadUrl = await getVideoUploadUrl();
  if (!uploadUrl) {
    throw new Error("Failed to retrieve upload URL.");
  }

  const formData = new FormData();
  formData.append("file", {
    uri: media.uri,
    name: "video.mp4",
    type: "video/mp4",
  } as any);

  const response = await axios.post(uploadUrl, formData);
  if (response.status !== 200) {
    throw new Error("Video upload failed.");
  }

  const videoUrl = uploadUrl; // Using upload URL as placeholder
  const { error } = await supabase.from("posts").insert([
    { user_id: userId, caption, media_url: videoUrl, media_type: media.type },
  ]);
  if (error) throw error;

  return videoUrl;
}

export async function createPost(payload: PostPayload): Promise<string> {
  if (payload.media.type === "image") {
    return createImagePost(payload);
  } else if (payload.media.type === "video") {
    return createVideoPost(payload);
  } else {
    throw new Error("Unsupported media type.");
  }
}

export const getPostById = async (postId: string): Promise<Post> => {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (error) {
    console.error("Error fetching post:", error);
    throw error;
  }
  return data as Post;
};

export const getUserPosts = async (userId: string): Promise<Post[]> => {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user posts:", error);
    return [];
  }
  return (data as Post[]) || [];
};

export const getAllPosts = async (): Promise<Post[]> => {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
  return (data as Post[]) || [];
};

export const getPaginatedPosts = async ({
  userId,
  mediaType,
  page,
  limit,
}: {
  userId?: string;
  mediaType?: "video" | "image";
  page: number;
  limit: number;
}): Promise<(Post & {
  like_count: number;
  comment_count: number;
  is_liked: boolean;
})[]> => {
  const offset = (page - 1) * limit;
  const from = offset;
  const to = offset + limit - 1;
  const currentUserId = await import("./auth").then((mod) => mod.getCurrentUserId());

  let query = supabase
    .from("posts")
    .select(
      `
        *,
        likes (user_id),
        comments(count)
      `
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (userId) query = query.eq("user_id", userId);
  if (mediaType) query = query.eq("media_type", mediaType);

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching paginated posts with likes and comments:", error);
    throw error;
  }

  return (data as any[]).map((post) => {
    const likesArray = post.likes || [];
    const commentCount = post.comments?.[0]?.count ?? 0;

    return {
      ...post,
      like_count: likesArray.length,
      comment_count: commentCount,
      is_liked: currentUserId
        ? likesArray.some((like: any) => like.user_id === currentUserId)
        : false,
    };
  });
};

export const updatePost = async (
  postId: string,
  updates: Partial<Post>
): Promise<Post> => {
  const { data, error } = await supabase
    .from("posts")
    .update({
      caption: updates.caption,
      media_url: updates.media_url,
      media_type: updates.media_type,
      thumbnail_url: updates.thumbnail_url,
      status: updates.status,
      media_metadata: updates.media_metadata,
      is_paid: updates.is_paid,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .single();

  if (error) {
    console.error("Error updating post:", error);
    throw error;
  }
  return data as Post;
};

export const deletePost = async (postId: string): Promise<Post> => {
  const { data, error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .single();

  if (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
  return data as Post;
};

export function extractImageIdFromUrl(mediaUrl: string): string | null {
  try {
    const url = new URL(mediaUrl);
    const segments = url.pathname.split("/").filter(Boolean); // removes empty strings
    return segments.length >= 2 ? segments[1] : null;
  } catch (err) {
    console.error("Invalid media URL:", mediaUrl);
    return null;
  }
}

export async function deleteImageFromCloudflare(mediaUrl: string): Promise<void> {
  const imageId = extractImageIdFromUrl(mediaUrl);
  if (!imageId) throw new Error("Could not extract image ID from media URL.");

  const result = await deleteImageEdge(imageId);
  console.log("Delete response:", result);
}

export async function deletePostAndMedia(postId: string): Promise<Post> {
  const post = await getPostById(postId);
  if (post.image_id) {
    await deleteImageEdge(post.image_id);
  } else if (post.media_url) {
    await deleteImageFromCloudflare(post.media_url); // fallback for legacy posts
  }
  return deletePost(postId);
}

export const getPostCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching post count:", error);
    return 0;
  }
  return count ?? 0;
};


// Get paginated posts from users the current user follows
export const getHomeFeedPosts = async ({
  page,
  limit,
}: {
  page: number;
  limit: number;
}): Promise<(Post & {
  like_count: number;
  comment_count: number;
  is_liked: boolean;
  user: {
    id: string;
    username: string;
    avatar_url: string;
    full_name: string;
  };
})[]> => {
  const currentUserId = await getCurrentUserId();

  if (!currentUserId) {
    console.warn("[getHomeFeedPosts] No current user ID found. Skipping fetch.");
    return [];
  }

  const offset = (page - 1) * limit;
  const from = offset;
  const to = offset + limit - 1;

  const { data: followData, error: followError } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", currentUserId);

  if (followError || !followData) {
    console.error("Error fetching followed users:", followError);
    return [];
  }

  const followedUserIds = followData.map((f) => f.following_id);
  if (followedUserIds.length === 0) return [];

  const { data: postData, error: postError } = await supabase
    .from("posts")
    .select(
      `
        *,
        user:profiles!posts_user_id_fkey (
          id,
          username,
          avatar_url,
          full_name
        ),
        likes (user_id),
        comments (count)
      `
    )
    .in("user_id", followedUserIds)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (postError) {
    console.error("Error fetching home feed posts:", postError);
    return [];
  }

  return (postData as any[]).map((post) => {
    const likesArray = post.likes || [];
    const commentCount = post.comments?.[0]?.count ?? 0;

    return {
      ...post,
      like_count: likesArray.length,
      comment_count: commentCount,
      is_liked: likesArray.some((like: any) => like.user_id === currentUserId),
      user: post.user,
    };
  });
};

export const getExploreFeedPosts = async ({
  userId,
  pageParam,
  limit,
}: {
  userId?: string;
  pageParam: number;
  limit: number;
}): Promise<(PostWithUser & {
  score: number;
  like_count: number;
  comment_count: number;
  is_liked: boolean;
})[]> => {
  // Skip if no userId
  if (!userId || userId === "undefined") {
    console.warn("[getExploreFeedPosts] Skipping: invalid userId:", userId);
    return [];
  }

  const currentUserId = await getCurrentUserId();
  const offset = (pageParam - 1) * limit;

  // 1. Fetch recommended post IDs
  const { data: recommendedData, error: recError } = await supabase
    .from("recommended_posts")
    .select("post_id, score")
    .eq("user_id", userId)
    .order("score", { ascending: false })
    .range(offset, offset + limit - 1);

  if (recError) {
    console.error("[getExploreFeedPosts] Error fetching recommended_posts:", recError);
    return [];
  }

  const recommendedPostIds = recommendedData?.map((r) => r.post_id) ?? [];
  if (recommendedPostIds.length === 0) return [];

  // 2. Fetch post data with author info
  const { data: postsData, error: postsError } = await supabase
    .from("posts")
    .select(`
      *,
      user:profiles!posts_user_id_fkey (
        id,
        username,
        avatar_url,
        full_name
      ),
      likes (user_id),
      comments (count)
    `)
    .in("id", recommendedPostIds);

  if (postsError) {
    console.error("[getExploreFeedPosts] Error fetching posts:", postsError);
    return [];
  }

  // 3. Enrich and remap with order preservation
  const enrichedPosts = (postsData ?? []).map((post: any) => {
    const score = recommendedData?.find((r) => r.post_id === post.id)?.score ?? 0;
    const likesArray = post.likes ?? [];
    const commentCount = post.comments?.[0]?.count ?? 0;

    return {
      ...post,
      score,
      like_count: likesArray.length,
      comment_count: commentCount,
      is_liked: currentUserId
        ? likesArray.some((like: any) => like.user_id === currentUserId)
        : false,
    };
  });

  // 4. Ensure returned posts match recommendation order
  const postMap = new Map(enrichedPosts.map((p) => [p.id, p]));
  const sortedPosts = recommendedPostIds
    .map((id) => postMap.get(id))
    .filter(Boolean) as typeof enrichedPosts;

  return sortedPosts;
};

// export const getExploreFeedPosts = async ({
//   pageParam,
//   limit,
// }: {
//   pageParam: number;
//   limit: number;
// }) => {
//   try {
//     const res = await axiosWithAuth.get("/recommendations/explore", {
//       params: { page: pageParam, limit },
//     });
//     return res.data;
//   } catch (err) {
//     console.error("[getExploreFeedPosts] error:", err);
//     return [];
//   }
// };


// export async function enqueueAllRecommendations(): Promise<void> {
//   try {
//     await axiosWithAuth.post("/explore/enqueue-all");
//     console.log("[enqueueAllRecommendations] All recs queued successfully.");
//   } catch (err) {
//     console.error("[enqueueAllRecommendations] Error:", err);
//   }
// }