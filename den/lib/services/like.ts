// src/services/like.ts

import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserId } from "./auth";
import { Like } from "@/lib/schema";

export const likePost = async (postId: string): Promise<boolean> => {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated.");

  const { error } = await supabase
    .from("likes")
    .insert({ post_id: postId, user_id: userId });

  if (error && !error.message.includes("duplicate key value")) {
    throw error;
  }
  return true;
};

export const unlikePost = async (postId: string): Promise<boolean> => {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated.");

  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);

  if (error) throw error;
  return true;
};

export const getLikesCount = async (postId: string): Promise<number> => {
  const { count, error } = await supabase
    .from("likes")
    .select("post_id", { count: "exact", head: true })
    .eq("post_id", postId);

  if (error) throw error;
  return count ?? 0;
};

export const getAllLikesForPost = async (postId: string): Promise<Like[]> => {
  const { data, error } = await supabase
    .from("likes")
    .select("*")
    .eq("post_id", postId);

  if (error) throw error;
  return data as Like[];
};

export const getLikeStatus = async (
  postId: string
): Promise<{ isLiked: boolean; likeCount: number }> => {
  const userId = await getCurrentUserId();
  const { data, count, error } = await supabase
    .from("likes")
    .select("*", { count: "exact" })
    .eq("post_id", postId);

  if (error) {
    console.error("Error fetching like status:", error);
    throw error;
  }

  const isLiked = userId ? data.some((like: any) => like.user_id === userId) : false;
  return { isLiked, likeCount: count || 0 };
};
