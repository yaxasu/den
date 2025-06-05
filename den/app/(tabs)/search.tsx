// Search.tsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Platform,
  Animated as RNAnimated,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "react-query";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/lib/contexts/ThemeProvider";
import { useAuth } from "@/lib/contexts/AuthContext";
import { searchUsers } from "@/lib/services/follow";
import { useExploreFeed } from "@/lib/hooks/useExploreFeed";
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback";
import { Post, Profile, PostWithUser } from "@/lib/schema";
import Avatar from "@/components/general/Avatar";
import ProfileGridItem from "@/components/screens/profileScreen/ProfileGridItem";
import SearchImageSkeleton from "@/components/screens/searchScreen/SearchImageSkeleton";

const STATUS_BAR_HEIGHT = Platform.OS === "ios" ? 20 : 0;
const HEADER_HEIGHT = 100;
const GRID_COLUMNS = 3;
const ITEM_MARGIN = 0.5;
const SEARCH_BAR_HEIGHT = 40;
const SEARCH_BAR_RADIUS = 10;
const SCREEN_WIDTH = Dimensions.get("window").width;

const Z_INDEX = {
  searchOverlay: 2000,
  postViewer: 3000,
};

export default function Search() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const listRef = useRef<FlatList>(null);
  const modalListRef = useRef<FlatList>(null);
  const headerSearchRef = useRef<View>(null);

  const itemWidth = useMemo(
    () => (SCREEN_WIDTH - 2 * ITEM_MARGIN * GRID_COLUMNS) / GRID_COLUMNS,
    []
  );
  const itemHeight = useMemo(() => itemWidth / (4 / 5), [itemWidth]);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchBarLayout, setSearchBarLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const animatedLeft = useRef(new RNAnimated.Value(0)).current;
  const animatedWidth = useRef(new RNAnimated.Value(0)).current;
  const backArrowOpacity = useRef(new RNAnimated.Value(0)).current;
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const slideAnim = useRef(new RNAnimated.Value(20)).current;

  const overlayProgress = useSharedValue(0);

  const debouncedPush = useDebouncedCallback(
    (destination) => router.push(destination),
    500
  );

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: searchResults, isLoading: isSearching } = useQuery(
    ["searchUsers", debouncedSearchQuery],
    () => searchUsers({ query: debouncedSearchQuery }),
    {
      enabled: debouncedSearchQuery.trim().length > 0,
      staleTime: 60000,
    }
  );

  const {
    data: exploreData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isLoading,
  } = useExploreFeed(user?.id ?? undefined, 12);

  const posts: (PostWithUser & {
    score: number;
    like_count: number;
    comment_count: number;
    is_liked: boolean;
  })[] = useMemo(() => {
    const flat = (exploreData?.pages.flat() ?? []) as (PostWithUser & {
      score: number;
      like_count: number;
      comment_count: number;
      is_liked: boolean;
    })[];
  
    const seen = new Set<string>();
    return flat.filter((post) => {
      if (!post.id || seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
  }, [exploreData]);

  const handleSearchPress = useCallback(() => {
    headerSearchRef.current?.measureInWindow((x, y, width, height) => {
      setSearchBarLayout({ x, y, width, height });

      const newLeft = x + 40;
      const newWidth = width - 40;

      animatedLeft.setValue(x);
      animatedWidth.setValue(width);
      backArrowOpacity.setValue(0);

      setIsSearchFocused(true);

      RNAnimated.parallel([
        RNAnimated.timing(animatedLeft, {
          toValue: newLeft,
          duration: 300,
          useNativeDriver: false,
        }),
        RNAnimated.timing(animatedWidth, {
          toValue: newWidth,
          duration: 300,
          useNativeDriver: false,
        }),
        RNAnimated.timing(backArrowOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  const closeModal = useCallback(() => {
    const { x, width } = searchBarLayout;

    RNAnimated.parallel([
      RNAnimated.timing(animatedLeft, {
        toValue: x,
        duration: 300,
        useNativeDriver: false,
      }),
      RNAnimated.timing(animatedWidth, {
        toValue: width,
        duration: 300,
        useNativeDriver: false,
      }),
      RNAnimated.timing(backArrowOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      RNAnimated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      RNAnimated.timing(slideAnim, {
        toValue: 20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Keyboard.dismiss();
      setIsSearchFocused(false);
      setSearchQuery("");
    });
  }, [searchBarLayout]);

  useEffect(() => {
    if (isSearchFocused) {
      fadeAnim.setValue(0);
      slideAnim.setValue(20);
      RNAnimated.parallel([
        RNAnimated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        RNAnimated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSearchFocused]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    refetch().finally(() => setIsRefreshing(false));
  }, [refetch]);

  const handlePostPress = useCallback((postId: string) => {
    const index = posts.findIndex((p) => p.id === postId);
    if (index !== -1) {
      setSelectedPostIndex(index);
      setModalVisible(true);
      overlayProgress.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.exp),
      });
    }
  }, [posts]);

  const handleModalClose = useCallback(() => {
    overlayProgress.value = withTiming(
      0,
      {
        duration: 250,
        easing: Easing.in(Easing.ease),
      },
      () => {
        runOnJS(setModalVisible)(false);
        runOnJS(setSelectedPostIndex)(null);
      }
    );
  }, []);

  const modalStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          overlayProgress.value,
          [0, 1],
          [50, 0],
          Extrapolate.CLAMP
        ),
      },
      {
        scale: interpolate(
          overlayProgress.value,
          [0.95, 1],
          [0.95, 1],
          Extrapolate.CLAMP
        ),
      },
    ],
    opacity: interpolate(overlayProgress.value, [0, 1], [0, 1], Extrapolate.CLAMP),
  }));

  const renderResultItem = useCallback(
    ({ item }: { item: Profile }) => (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => {
          Keyboard.dismiss();
          debouncedPush({
            pathname: "/(userProfile)",
            params: { userProfileId: item.id },
          });
        }}
        activeOpacity={0.8}
      >
        <Avatar
          uri={item.avatar_url ?? null}
          fallbackText={item.full_name ?? item.username ?? "User"}
          size={44}
          theme={theme}
        />
        <View style={styles.resultTextContainer}>
          <Text style={[styles.resultName, { color: theme.text }]}>
            {item.full_name ?? "Unnamed"}
          </Text>
          <Text style={[styles.resultUsername, { color: theme.subText }]}>
            @{item.username ?? "unknown"}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [debouncedPush, theme]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* HEADER */}
      <RNAnimated.View style={styles.header}>
        <TouchableOpacity onPress={handleSearchPress} activeOpacity={1} style={styles.searchBarContainer}>
          <View ref={headerSearchRef} style={[styles.searchBar, { backgroundColor: theme.cardBackground }]}>
            <Text style={{ color: theme.text, fontSize: 16 }}>Search</Text>
          </View>
        </TouchableOpacity>
      </RNAnimated.View>

      {/* POST GRID */}
      <FlatList
        ref={listRef}
        data={posts}
        keyExtractor={(item) => item.id}
        numColumns={GRID_COLUMNS}
        renderItem={({ item }) => (
          <View style={{ width: itemWidth, height: itemHeight, margin: ITEM_MARGIN }}>
            <ProfileGridItem item={item} theme={theme} onPress={() => handlePostPress(item.id)} />
          </View>
        )}
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT  + 10 }}
        onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.subText}
            progressViewOffset={90}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={theme.text} />
          ) : (
            <Text style={{ textAlign: "center", marginTop: 50, color: theme.subText }}>
              No explore posts yet.
            </Text>
          )
        }
      />

      {/* SEARCH OVERLAY */}
      {isSearchFocused && (
        <View style={[styles.modalOverlay, { backgroundColor: theme.background }]}>
          <RNAnimated.View
            style={[
              styles.backButton,
              {
                opacity: backArrowOpacity,
                top: searchBarLayout.y,
                left: searchBarLayout.x,
              },
            ]}
          >
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="chevron-back" size={28} color={theme.text} />
            </TouchableOpacity>
          </RNAnimated.View>

          <RNAnimated.View
            style={[
              styles.animatedSearchContainer,
              {
                left: animatedLeft,
                top: searchBarLayout.y,
                width: animatedWidth,
                backgroundColor: theme.cardBackground,
              },
            ]}
          >
            <View style={styles.searchInputWrapper}>
              <TextInput
                autoFocus
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search"
                placeholderTextColor={theme.subText}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {!!searchQuery.length && (
                <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
                  <Ionicons name="close" size={18} color={theme.text} />
                </TouchableOpacity>
              )}
            </View>
          </RNAnimated.View>

          {debouncedSearchQuery.trim().length > 0 &&
            (isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.text} />
              </View>
            ) : (
              <FlatList
                data={searchResults || []}
                keyExtractor={(item) => item.id}
                renderItem={renderResultItem}
                style={{ flex: 1 }}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingBottom: 100,
                }}
                keyboardShouldPersistTaps="handled"
              />
            ))}
        </View>
      )}

      {/* FULLSCREEN MODAL VIEWER */}
      {modalVisible && selectedPostIndex !== null && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            modalStyle,
            { backgroundColor: theme.background, zIndex: Z_INDEX.postViewer },
          ]}
        >
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: HEADER_HEIGHT,
              paddingTop: insets.top + 10,
              paddingHorizontal: 15,
              zIndex: 1001,
              justifyContent: "center",
              backgroundColor: theme.background,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 40 }}>
              <TouchableOpacity onPress={handleModalClose} activeOpacity={0.8}>
                <Ionicons name="chevron-down" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            ref={modalListRef}
            data={posts}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            initialScrollIndex={selectedPostIndex}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }: { item: PostWithUser }) => (
              <ScrollView style={{ width: SCREEN_WIDTH, paddingTop: 100 }} showsVerticalScrollIndicator={false}>
                <SearchImageSkeleton item={item} profile={item.user} onRequestClose={handleModalClose} />
              </ScrollView>
            )}
            onScrollToIndexFailed={({ index }) => {
              setTimeout(() => {
                modalListRef.current?.scrollToIndex({ index, animated: false });
              }, 500);
            }}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    paddingTop: STATUS_BAR_HEIGHT + 30,
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  searchBarContainer: { height: SEARCH_BAR_HEIGHT },
  searchBar: {
    flex: 1,
    borderRadius: SEARCH_BAR_RADIUS,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: Z_INDEX.searchOverlay,
    paddingTop: STATUS_BAR_HEIGHT + 30 + SEARCH_BAR_HEIGHT + 10,
  },
  backButton: {
    position: "absolute",
    width: 40,
    height: SEARCH_BAR_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  animatedSearchContainer: {
    position: "absolute",
    height: SEARCH_BAR_HEIGHT,
    borderRadius: SEARCH_BAR_RADIUS,
    overflow: "hidden",
    zIndex: 5,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    flex: 1,
    height: SEARCH_BAR_HEIGHT,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 8,
  },
  clearButton: {
    padding: 4,
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: "600",
  },
  resultUsername: {
    fontSize: 14,
  },
});
