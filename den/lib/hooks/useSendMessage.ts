import { useMutation, useQueryClient } from "react-query";
import { supabase } from "@/lib/supabaseClient";
import { Message } from "@/lib/schema";

export const useSendMessage = (conversationId: string, senderId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (text: string) => {
      const { data, error } = await supabase
        .from("messages")
        .insert([{ conversation_id: conversationId, sender_id: senderId, message_text: text }])
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },

    onMutate: async (messageText) => {
      await queryClient.cancelQueries(["messages", conversationId]);
      await queryClient.cancelQueries(["conversations", senderId]);

      const previousMessages = queryClient.getQueryData(["messages", conversationId]);
      const previousConversations = queryClient.getQueryData(["conversations", senderId]);

      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: senderId,
        message_text: messageText,
        created_at: new Date().toISOString(),
        sender: undefined,
      };

      // ✅ Optimistically update messages
      queryClient.setQueryData(["messages", conversationId], (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: [[optimisticMessage, ...old.pages[0]], ...old.pages.slice(1)],
        };
      });

      // ✅ Optimistically update conversations list
      queryClient.setQueryData(["conversations", senderId], (old: any) => {
        if (!old?.pages) return old;

        const updatedPages = old.pages.map((page: any[]) =>
          page.map((row) => {
            if (row.id === conversationId) {
              return {
                ...row,
                last_message_text: messageText,
                last_message_created_at: new Date().toISOString(),
              };
            }
            return row;
          })
        );

        return { ...old, pages: updatedPages };
      });

      return { previousMessages, previousConversations };
    },

    onError: (_, __, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(["messages", conversationId], context.previousMessages);
      }
      if (context?.previousConversations) {
        queryClient.setQueryData(["conversations", senderId], context.previousConversations);
      }
    },

    onSettled: () => {
      // ✅ Revalidate to ensure consistency with server
      queryClient.invalidateQueries(["messages", conversationId]);
      queryClient.invalidateQueries(["conversations", senderId]);
    },
  });
};
