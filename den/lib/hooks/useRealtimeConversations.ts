import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useQueryClient } from "react-query";

export const useRealtimeConversations = (currentUserId: string, refetchConversations: () => void) => {
  useEffect(() => {
    const channel = supabase
      .channel("messages_feed_subscription")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const message = payload.new;
          if (!message) return;

          // Only refresh if the user is a participant
          if (message.sender_id !== currentUserId) {
            refetchConversations(); // ✅ lightweight and safe to call
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, refetchConversations]);
};
