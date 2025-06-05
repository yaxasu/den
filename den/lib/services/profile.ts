// src/services/profile.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUserId } from "./auth";
import { Profile } from "@/lib/schema";
import axiosWithAuth from "@/lib/api/api";

export async function getProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) {
    console.error("Error fetching profile:", error);
    return null;
  }

  await AsyncStorage.setItem("profile", JSON.stringify(data));
  return data;
}

// export async function getProfile(): Promise<Profile | null> {
//   try {
//     const res = await axiosWithAuth.get("/profile/getProfile");
//     const profile = res.data;
//     await AsyncStorage.setItem("profile", JSON.stringify(profile));
//     return profile;
//   } catch (err) {
//     console.error("[getProfile] Error fetching profile:", err);
//     return null;
//   }
// }

export async function getProfileById(
  userId: string
): Promise<(Profile & { is_following: boolean }) | null> {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("Error fetching profile:", profileError);
    return null;
  }

  const { count, error: followError } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", currentUserId)
    .eq("following_id", userId);

  if (followError) {
    console.error("Error checking follow status:", followError);
    return null;
  }

  return {
    ...profile,
    is_following: (count ?? 0) > 0,
  };
}

export const isUsernameAvailable = async (username: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    console.error("Error checking username:", error);
    throw error;
  }
  return !data;
};

export const updateUsername = async (username: string): Promise<void> => {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ username })
    .eq("id", userId);

  if (error) {
    throw error;
  }
};

// ----------- Follow Queries with Types -----------


type FollowerJoinRow = {
  follower_id: string;
  profiles: Profile;
};

export const getFollowers = async ({
  userId,
  pageParam = 1,
  limit = 20,
}: {
  userId?: string;
  pageParam?: number;
  limit?: number;
}): Promise<Profile[]> => {
  if (!userId || userId === "undefined") {
    console.warn("[getFollowers] Skipping: invalid userId:", userId);
    return [];
  }

  const from = (pageParam - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from("follows")
    .select("follower_id, profiles:follower_id(*)")
    .eq("following_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching followers:", error);
    throw error;
  }

  return (data ?? [])
    .map((entry) => (Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles))
    .filter((p): p is Profile => !!p);
};

type FollowingRow = {
  following_id: string;
  profiles: Profile;
};


export const getFollowing = async ({
  userId,
  pageParam = 1,
  limit = 20,
}: {
  userId?: string;
  pageParam?: number;
  limit?: number;
}): Promise<Profile[]> => {
  if (!userId || userId === "undefined") {
    console.warn("[getFollowing] Skipping: invalid userId:", userId);
    return [];
  }

  const from = (pageParam - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from("follows")
    .select("following_id, profiles:following_id(*)")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching following:", error);
    throw error;
  }

  return (data ?? [])
    .map((entry) =>
      Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles
    )
    .filter((p): p is Profile => !!p);
};