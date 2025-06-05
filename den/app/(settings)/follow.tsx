import { useTheme } from "@/lib/contexts/ThemeProvider";
import { getFollowers, getFollowing, getProfileById } from "@/lib/services/profile";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Pressable,
  Animated,
  TextInput,
} from "react-native";
import { useInfiniteQuery, useQuery } from "react-query";
import { FlashList } from "@shopify/flash-list";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import Avatar from "@/components/general/Avatar";
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback";

const TABS = ["followers", "following"] as const;
type TabType = (typeof TABS)[number];

export default function Follow() {
  const router = useRouter();
  const { type, userId: paramUserId } = useLocalSearchParams<{
    type?: string;
    userId?: string;
  }>();
  const { theme } = useTheme();
  const { user } = useAuth();

  const userId = typeof paramUserId === "string" ? paramUserId : user?.id;

  if (!userId) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="small" color={theme.text} />
      </View>
    );
  }

  const [selectedTab, setSelectedTab] = useState<TabType>("followers");
  const [searchQuery, setSearchQuery] = useState("");
  const [tabLayouts, setTabLayouts] = useState<Record<TabType, { x: number; width: number }>>({
    followers: { x: 0, width: 0 },
    following: { x: 0, width: 0 },
  });

  const underlineLeft = useRef(new Animated.Value(0)).current;
  const underlineWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (type === "following" || type === "followers") {
      setSelectedTab(type);
    }
  }, [type]);

  useEffect(() => {
    const layout = tabLayouts[selectedTab];
    if (layout.width === 0) return;

    Animated.parallel([
      Animated.spring(underlineLeft, {
        toValue: layout.x,
        useNativeDriver: false,
        bounciness: 0,
      }),
      Animated.spring(underlineWidth, {
        toValue: layout.width,
        useNativeDriver: false,
        bounciness: 0,
      }),
    ]).start();
  }, [selectedTab, tabLayouts]);

  const {
    data: profileData,
    isLoading: isLoadingProfile,
  } = useQuery(["profile", userId], () => getProfileById(userId), {
    enabled: !!userId,
  });

  const {
    data: followersData,
    fetchNextPage: fetchMoreFollowers,
    hasNextPage: hasMoreFollowers,
    isFetchingNextPage: isLoadingMoreFollowers,
    isError: isFollowersError,
    refetch: refetchFollowers,
  } = useInfiniteQuery(
    ["followers", userId],
    ({ pageParam = 1 }) => getFollowers({ userId, pageParam }),
    {
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length === 20 ? allPages.length + 1 : undefined,
      enabled: selectedTab === "followers",
    }
  );

  const {
    data: followingData,
    fetchNextPage: fetchMoreFollowing,
    hasNextPage: hasMoreFollowing,
    isFetchingNextPage: isLoadingMoreFollowing,
    isError: isFollowingError,
    refetch: refetchFollowing,
  } = useInfiniteQuery(
    ["following", userId],
    ({ pageParam = 1 }) => getFollowing({ userId, pageParam }),
    {
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length === 20 ? allPages.length + 1 : undefined,
      enabled: selectedTab === "following",
    }
  );

  const currentData = selectedTab === "followers" ? followersData : followingData;
  const allProfiles = currentData?.pages.flat() ?? [];

  const filteredProfiles = allProfiles.filter((profile) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      profile.full_name?.toLowerCase().includes(query) ||
      profile.username?.toLowerCase().includes(query);

    const isNotSelf = profile.id !== user?.id;

    return matchesQuery && isNotSelf;
  });

  const handleLoadMore = useCallback(() => {
    if (selectedTab === "followers" && hasMoreFollowers && !isLoadingMoreFollowers) {
      fetchMoreFollowers();
    } else if (selectedTab === "following" && hasMoreFollowing && !isLoadingMoreFollowing) {
      fetchMoreFollowing();
    }
  }, [
    selectedTab,
    hasMoreFollowers,
    isLoadingMoreFollowers,
    fetchMoreFollowers,
    hasMoreFollowing,
    isLoadingMoreFollowing,
    fetchMoreFollowing,
  ]);

  const isError = selectedTab === "followers" ? isFollowersError : isFollowingError;
  const refetch = selectedTab === "followers" ? refetchFollowers : refetchFollowing;

  const debouncedPush = useDebouncedCallback(
    (destination: Parameters<typeof router.push>[0]) => {
      router.push(destination);
    },
    500
  );

  if (isLoadingProfile) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="small" color={theme.text} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, marginBottom: 12 }}>
          Failed to load {selectedTab}.
        </Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text style={{ color: theme.primary }}>Tap to retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={router.back}
          style={styles.backButton}
          accessibilityLabel="Go back"
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>@{profileData?.username ?? "user"}</Text>
        <View style={styles.rightSpacer} />
      </View>

      <View style={[styles.tabContainer, { marginBottom: 10 }]}>
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setSelectedTab(tab)}
            onLayout={(event) => {
              const { x, width } = event.nativeEvent.layout;
              setTabLayouts((prev) => ({ ...prev, [tab]: { x, width } }));
            }}
            style={styles.tabButton}
          >
            <Text
              style={{
                color: tab === selectedTab ? theme.primary : theme.subText,
                fontWeight: tab === selectedTab ? "600" : "400",
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
        <Animated.View
          style={[
            styles.underline,
            {
              backgroundColor: theme.primary,
              left: underlineLeft,
              width: underlineWidth,
            },
          ]}
        />
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
        <View
          style={{
            backgroundColor: theme.cardBackground,
            borderRadius: 10,
            height: 40,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
          }}
        >
          <Ionicons name="search" size={18} color={theme.subText} />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 8,
              color: theme.text,
              fontSize: 16,
              paddingVertical: 0,
              paddingHorizontal: 0,
            }}
            placeholder="Search"
            placeholderTextColor={theme.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={{ padding: 4 }}>
              <Ionicons name="close" size={18} color={theme.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>


      <FlashList
        data={filteredProfiles}
        estimatedItemSize={70}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        keyExtractor={(item, index) => item?.id ?? `unknown-${index}`}
        renderItem={({ item }) =>
          item ? (
            <TouchableOpacity
              style={styles.profileRow}
              onPress={() =>
                debouncedPush({ pathname: "/(userProfile)", params: { userProfileId: item.id } })
              }
              activeOpacity={0.8}
            >
              <Avatar
                uri={item.avatar_url ?? null}
                fallbackText={item.full_name ?? item.username ?? "User"}
                size={44}
                theme={theme}
              />
              <View style={styles.profileText}>
                <Text style={[styles.name, { color: theme.text }]}>
                  {item.full_name ?? "Unnamed"}
                </Text>
                <Text style={[styles.username, { color: theme.subText }]}>@{item.username ?? "unknown"}</Text>
              </View>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          filteredProfiles.length === 0 ? (
            <Text style={{ color: theme.text, textAlign: "center", marginTop: 20 }}>
              No {selectedTab} found.
            </Text>
          ) : null
        }
        ListFooterComponent={
          isLoadingMoreFollowers || isLoadingMoreFollowing ? (
            <ActivityIndicator style={{ marginTop: 10 }} color={theme.text} />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    position: "relative",
  },
  backButton: {
    padding: 5,
    zIndex: 2,
  },
  rightSpacer: {
    width: 28,
  },
  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 60,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
    marginTop: 4,
    position: "relative",
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  underline: {
    position: "absolute",
    bottom: -StyleSheet.hairlineWidth,
    height: 2,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  profileText: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  username: {
    fontSize: 14,
  },
});
