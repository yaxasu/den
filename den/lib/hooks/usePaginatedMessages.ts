import { useInfiniteQuery } from "react-query";
import { supabase } from "@/lib/supabaseClient";
import { Message } from "@/lib/schema";

export const usePaginatedMessages = (conversationId: string) => {
  return useInfiniteQuery<Message[], Error, Message[], any>({
    queryKey: ["messages", conversationId],
    queryFn: async ({ pageParam = 1 }) => {
      const pageSize = 20;
      const from = (pageParam - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from("messages")
        .select("*, sender:profiles!messages_sender_id_fkey(*)")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false }) // ✅ newest first
        .range(from, to);

      if (error) throw error;
      return data ?? [];
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 20 ? allPages.length + 1 : undefined;
    },
  });
};
