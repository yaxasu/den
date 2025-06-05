// src/services/auth.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, supabaseUrl } from "@/lib/supabaseClient";
import { Profile } from "@/lib/schema";
import { deleteImageFromCloudflare, getUserPosts } from "./post";

export const getCurrentUserId = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getUser();
  return data.user?.id || null;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+$/;
  return emailRegex.test(email);
};

export const signInUser = async (
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;

    const user = signInData.user;
    if (!user) {
      return { success: false, error: "No user found after sign in." };
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Error retrieving profile:", profileError);
      return { success: false, error: profileError.message };
    }

    await AsyncStorage.setItem("profile", JSON.stringify(profileData));

    return { success: true };
  } catch (error: any) {
    console.error("Authentication error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
};

export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", email.trim())
      .maybeSingle();

    if (error) {
      console.error("Error checking email existence:", error);
      return false;
    }
    return data !== null;
  } catch (err) {
    console.error("Error in checkEmailExists:", err);
    return false;
  }
};

export const registerUser = async (
  email: string,
  password: string,
  full_name: string,
  birthday: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (authError) {
      console.error("Error during sign up:", authError);
      return { success: false, error: authError.message };
    }

    const userId = authData.user?.id;
    if (!userId) {
      return {
        success: false,
        error: "User registration failed. No user ID returned.",
      };
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name,
        birthday,
      })
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      return { success: false, error: profileError.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in registerUser:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
};

export const fetchProfile = async (): Promise<Profile | null> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.warn("No Supabase user found:", userError?.message);
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.warn("Error fetching profile:", error.message);
    return null;
  }

  return profile;
};


export const deleteUserAccount = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error("Failed to get current user.");
    }

    const userId = userData.user.id;

    // Step 1: Delete user's posts and media
    const posts = await getUserPosts(userId);
    for (const post of posts) {
      if (post.media_url) {
        try {
          await deleteImageFromCloudflare(post.media_url);
        } catch (err) {
          console.warn("Failed to delete post media from Cloudflare:", err);
        }
      }
      await supabase.from("posts").delete().eq("id", post.id);
    }

    // Step 2: Fetch avatar and delete it if present
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.warn("Failed to fetch profile for avatar deletion:", profileError.message);
    } else if (profile?.avatar_url) {
      try {
        await deleteImageFromCloudflare(profile.avatar_url);
      } catch (err) {
        console.warn("Failed to delete avatar from Cloudflare:", err);
      }
    }

    // Step 3: Get access token
    const sessionRes = await supabase.auth.getSession();
    const token = sessionRes.data.session?.access_token;

    if (!token) {
      throw new Error("Missing access token.");
    }

    // Step 4: Call Edge Function to delete user account
    const response = await fetch(`${supabaseUrl}/functions/v1/deleteUser`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to delete user account.");
    }

    // Step 5: Clear local cache
    await AsyncStorage.clear();

    return { success: true };
  } catch (err: any) {
    console.error("[deleteUserAccount] Error:", err);
    return { success: false, error: err.message || "Failed to delete user." };
  }
};
