// src/services/follow.ts

import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserId } from "./auth";
import { Profile } from "@/lib/schema";

export const searchUsers = async ({
  query,
  pageParam = 0,
  limit = 20,
}: {
  query: string;
  pageParam?: number;
  limit?: number;
}): Promise<Profile[]> => {
  const from = pageParam * limit;
  const to = from + limit - 1;

  const currentUserId = await getCurrentUserId();
  // Ensure that currentUserId is a valid UUID; if it's falsy or equals "null", handle it.
  if (!currentUserId || currentUserId === "null") {
    // Either throw an error or return an empty list—whichever makes sense.
    throw new Error("User not authenticated.");
    // Alternatively: return [];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .neq("id", currentUserId)
    .order("full_name", { ascending: true })
    .range(from, to);

  if (error) {
    console.error("Error searching users:", error);
    throw error;
  }
  return data as Profile[];
};

export const followUser = async (targetUserId: string): Promise<boolean> => {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId || currentUserId === "null") {
    throw new Error("User not authenticated.");
  }

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: currentUserId, following_id: targetUserId });

  if (error && !error.message.includes("duplicate key value")) {
    throw error;
  }
  return true;
};

export const unfollowUser = async (targetUserId: string): Promise<boolean> => {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId || currentUserId === "null") {
    throw new Error("User not authenticated.");
  }

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", currentUserId)
    .eq("following_id", targetUserId);

  if (error) throw error;
  return true;
};

export const getFollowStats = async (
  userId: string
): Promise<{ followerCount: number; followingCount: number }> => {
  const [followersRes, followingRes] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId),
  ]);

  if (followersRes.error || followingRes.error) {
    throw new Error("Error fetching follow stats");
  }
  return {
    followerCount: followersRes.count || 0,
    followingCount: followingRes.count || 0,
  };
};
