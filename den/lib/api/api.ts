import axios from "axios";
import { supabase } from "@/lib/supabaseClient";

const axiosWithAuth = axios.create({
  baseURL: "http://192.168.86.20:8000/v1", // ← your machine’s LAN IP
  headers: {
    "Content-Type": "application/json",
  },
});

axiosWithAuth.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;

  console.log("[axiosWithAuth] Attaching token:", token?.slice(0, 12) || "undefined", "...");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

export default axiosWithAuth;
