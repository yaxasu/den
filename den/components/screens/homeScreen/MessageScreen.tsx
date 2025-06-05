import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useTheme } from "@/lib/contexts/ThemeProvider";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useInfiniteQuery } from "react-query";
import { useRouter } from "expo-router";
import Avatar from "@/components/general/Avatar";
import { supabase } from "@/lib/supabaseClient";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRealtimeConversations } from "@/lib/hooks/useRealtimeConversations";

dayjs.extend(relativeTime);

const HEADER_HEIGHT = 90;
const HEADER_PADDING_TOP = 45;
const ITEM_SIZE = 80;

interface ConversationRow {
  id: string;
  participant_ids: string[];
  created_at: string;
  other_user: {
    id: string;
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
  last_message_text?: string;
  last_message_created_at?: string;
}

const getPaginatedConversations = async ({
  userId,
  pageParam,
}: {
  userId: string;
  pageParam: number;
}): Promise<ConversationRow[]> => {
  const limit = 20;
  const from = (pageParam - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .rpc("get_conversations_with_profiles", { current_user_id: userId })
    .range(from, to);

  if (error) throw error;
  return data;
};

const MessageFeed = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const listRef = useRef<FlashList<ConversationRow>>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["conversations", user?.id],
    queryFn: ({ pageParam = 1 }) =>
      getPaginatedConversations({ userId: user!.id, pageParam }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 20 ? allPages.length + 1 : undefined,
    enabled: !!user?.id,
  });

  useRealtimeConversations(user?.id!, refetch);
  const conversations: ConversationRow[] = data?.pages.flat() ?? [];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleComposePress = () => {
    router.push("/(settings)/compose");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity onPress={handleComposePress} style={styles.composeIcon}>
          <Ionicons name="create-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <FlashList<ConversationRow>
        ref={listRef}
        data={conversations}
        estimatedItemSize={ITEM_SIZE}
        keyExtractor={(item) => item.id}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.subText}
            colors={[theme.subText]}
            progressViewOffset={80}
          />
        }
        contentContainerStyle={{
          paddingTop: HEADER_HEIGHT + 10,
          paddingBottom: 30,
          paddingHorizontal: 20,
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={theme.subText} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyText, { color: theme.subText }]}>
              You have no active conversations yet. Start a chat with someone you follow.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.messageRow}
            activeOpacity={0.85}
            onPress={() => {
              router.push({
                pathname: "/(settings)/chat",
                params: {
                  conversationId: item.id,
                  userId: item.other_user.id,
                  avatarUrl: item.other_user.avatar_url,
                  username: item.other_user.username,
                },
              });
            }}
          >
            <Avatar
              uri={item.other_user.avatar_url ?? null}
              fallbackText={item.other_user.full_name ?? item.other_user.username ?? "User"}
              size={50}
              theme={theme}
            />
            <View style={styles.messageContent}>
              <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                {item.other_user.full_name ?? "Unnamed"}
              </Text>
              <Text
                style={[styles.preview, { color: theme.subText }]}
                numberOfLines={1}
              >
                {item.last_message_text ?? "Say hello!"}
              </Text>
            </View>
            <Text style={[styles.timestamp, { color: theme.subText }]}>
              {item.last_message_created_at
                ? dayjs(item.last_message_created_at).fromNow()
                : ""}
            </Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              style={{ marginTop: 16 }}
              size="small"
              color={theme.subText}
            />
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    zIndex: 1000,
    paddingTop: HEADER_PADDING_TOP,
    paddingHorizontal: 15,
    justifyContent: "center",
  },
  composeIcon: {
    position: "absolute",
    right: 10,
    top: HEADER_PADDING_TOP + 5,
    padding: 4,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  messageContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  preview: {
    fontSize: 14,
    opacity: 0.8,
  },
  timestamp: {
    fontSize: 12,
    marginLeft: 8,
  },
  emptyState: {
    marginTop: 100,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});

export default React.memo(MessageFeed);
