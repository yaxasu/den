import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  InteractionManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useTheme } from "@/lib/contexts/ThemeProvider";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "expo-router";
import { useQuery } from "react-query";
import Avatar from "@/components/general/Avatar";
import { supabase } from "@/lib/supabaseClient";
import { getOrCreateConversation } from "@/lib/services/chat";

interface Mutual {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
}

const fetchMutuals = async (userId: string): Promise<Mutual[]> => {
  const { data, error } = await supabase.rpc("get_mutuals", {
    current_user_id: userId,
  });
  if (error) throw error;
  return data;
};

export default function Compose() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: mutuals,
    isLoading,
    refetch,
  } = useQuery(["mutuals", user?.id], () => fetchMutuals(user!.id), {
    enabled: !!user?.id,
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const handleStartChat = async (targetUser: Mutual) => {
    try {
      const conversationId = await getOrCreateConversation(user!.id, targetUser.id);

      InteractionManager.runAfterInteractions(() => {
        router.push({
          pathname: "/(settings)/chat",
          params: {
            conversationId,
            userId: targetUser.id,
            avatarUrl: targetUser.avatar_url ?? "",
            username: targetUser.username,
          },
        });
      });
    } catch (error) {
      console.error("Failed to start chat:", error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Compose</Text>
        <View style={styles.rightSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={theme.text} />
        </View>
      ) : (mutuals?.length ?? 0) === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={48} color={theme.subText} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyText, { color: theme.subText }]}>
            You can only message users who follow you back. Start following others to unlock messaging.
          </Text>
        </View>
      ) : (
        <FlashList
          data={mutuals}
          estimatedItemSize={60}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.subText}
              colors={[theme.subText]}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleStartChat(item)}
              style={styles.userRow}
            >
              <Avatar
                uri={item.avatar_url ?? null}
                fallbackText={item.full_name ?? item.username}
                size={48}
                theme={theme}
              />
              <View style={styles.userInfo}>
                <Text style={[styles.name, { color: theme.text }]}>
                  {item.full_name ?? item.username}
                </Text>
                <Text style={[styles.username, { color: theme.subText }]}>
                  @{item.username}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  rightSpacer: {
    width: 28,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  userInfo: {
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  username: {
    fontSize: 14,
    opacity: 0.8,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: 32,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },
});
