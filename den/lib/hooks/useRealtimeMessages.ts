import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useQueryClient } from "react-query";
import { Message } from "../schema";

export const useRealtimeMessages = (conversationId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new;
          queryClient.setQueryData(["messages", conversationId], (old: any) => {
            if (!old?.pages) return old;
            const exists = old.pages.some((page: Message[]) =>
              page.some((msg) => msg.id === newMessage.id)
            );
            if (exists) return old;

            return {
              ...old,
              pages: [[newMessage, ...old.pages[0]], ...old.pages.slice(1)],
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);
};
