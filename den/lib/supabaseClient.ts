// src/lib/supabaseClient.ts
import "react-native-url-polyfill/auto";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

export const supabaseUrl = "https://kkxqysrlwkerjrrpyfwm.supabase.co";
export const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreHF5c3Jsd2tlcmpycnB5ZndtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2OTg1NDUsImV4cCI6MjA1NzI3NDU0NX0.tJRsOE2N3ZzeKfFlYkTn84mKdxYJHHU_Fg2CfXB1_Ts";

const asyncStorageAdapter = {
  getItem: async (key: any) => {
    const value = await AsyncStorage.getItem(key);
    return value;
  },
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: asyncStorageAdapter, // ✅ must be here
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// API utility functions (edge function URLs and helpers)
export const getImageUploadUrlEdge = `${supabaseUrl}/functions/v1/getImageUploadUrl`;
export const deleteImageEdgeUrl = `${supabaseUrl}/functions/v1/deleteImageFromCloudflare`;
export const getVideoUploadUrlEdge = `${supabaseUrl}/functions/v1/getVideoUploadUrl`;
export const deleteVideoEdgeUrl = ""; // Add if needed

export const generateRecommendations = `${supabaseUrl}/functions/v1/generateRecommendations`;

export const getImageUploadUrl = async (): Promise<string> => {
  try {
    const { data } = await axios.get(getImageUploadUrlEdge, {
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });
    return data["uploadURL"];
  } catch (error: any) {
    console.error("Error fetching image upload URL:", error);
    throw error;
  }
};

export const deleteImageEdge = async (imageId: string): Promise<any> => {
  try {
    const { data } = await axios.post(deleteImageEdgeUrl, { imageId }, {
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
    });
    return data;
  } catch (error: any) {
    console.error("Error deleting image from Cloudflare:", error);
    throw error;
  }
};

export const getVideoUploadUrl = async (): Promise<string> => {
  try {
    const { data } = await axios.get(getVideoUploadUrlEdge, {
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });
    return data["uploadURL"];
  } catch (error: any) {
    console.error("Error fetching video upload URL:", error);
    throw error;
  }
};

// Proactively refresh session on app state change
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
    supabase.auth
      .refreshSession()
      .then(({ data }) => {
        if (data?.session) {
          supabase.auth.setSession(data.session);
        }
      })
      .catch((err) => console.warn("Silent refresh failed:", err));
  } else {
    supabase.auth.stopAutoRefresh();
  }
});


export const generateUserRecommendations = async (userId: string): Promise<void> => {
  try {
    const { data } = await axios.post(
      generateRecommendations,
      { user_id: userId },
      {
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Recommendations generated:", data);
  } catch (error: any) {
    console.error("Failed to generate recommendations:", error.response?.data || error.message);
    throw error;
  }
};