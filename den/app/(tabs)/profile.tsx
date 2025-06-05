import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/contexts/ThemeProvider";
import { useInfiniteQuery } from "react-query";
import { getPaginatedPosts } from "@/lib/services/post";
import { Post } from "@/lib/schema";
import ProfileHeader from "@/components/screens/profileScreen/ProfileHeader";
import ProfileGridItem from "@/components/screens/profileScreen/ProfileGridItem";
import ImageSkeleton from "@/components/screens/profileScreen/ImageSkeleton";
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback";
import { useAuth } from "@/lib/contexts/AuthContext";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
  Easing,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const POSTS_FETCH_LIMIT = 6;
const NUM_COLUMNS = 3;
const HEADER_HEIGHT = 90;
const HEADER_PADDING_TOP = 45;
const CONTENT_BOTTOM_PADDING = 30;

export default function ProfilePage() {
  const { user: profile, loading: profileLoading } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const scrollY = useSharedValue(0);
  const overlayProgress = useSharedValue(0);

  const flatListRef = useRef<FlatList>(null);
  const modalListRef = useRef<FlatList>(null);

  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const debouncedPush = useDebouncedCallback((destination: "/(settings)") => {
    router.push(destination);
  }, 500);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 100], [0, 1], Extrapolate.CLAMP),
  }));

  const leftIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(overlayProgress.value, [0, 1], [0, 1], Extrapolate.CLAMP),
  }));

  const rightIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(overlayProgress.value, [0, 0.5], [1, 0], Extrapolate.CLAMP),
  }));

  const usernameOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(overlayProgress.value, [0, 1], [1, 0], Extrapolate.CLAMP),
  }));

  const postTextOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(overlayProgress.value, [0, 1], [0, 1], Extrapolate.CLAMP),
    position: "absolute",
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(overlayProgress.value, [0, 1], [50, 0], Extrapolate.CLAMP),
      },
      {
        scale: interpolate(overlayProgress.value, [0.95, 1], [0.95, 1], Extrapolate.CLAMP),
      },
    ],
    opacity: interpolate(overlayProgress.value, [0, 1], [0, 1], Extrapolate.CLAMP),
  }));

  const bgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(overlayProgress.value, [0, 1], [0, 1], Extrapolate.CLAMP),
  }));

  const userId = profile?.id;
  const postQueryKey = useMemo(() => ["posts", userId, "image"], [userId]);

  const {
    data: paginatedData,
    isLoading: postsLoading,
    refetch: refetchPosts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    postQueryKey,
    async ({ pageParam = 1 }) => {
      if (!userId) return [];
      return getPaginatedPosts({
        userId,
        mediaType: "image",
        page: pageParam,
        limit: POSTS_FETCH_LIMIT,
      });
    },
    {
      enabled: !!userId,
      getNextPageParam: (lastPage, pages) =>
        lastPage.length < POSTS_FETCH_LIMIT ? undefined : pages.length + 1,
      keepPreviousData: true,
      staleTime: 60000,
    }
  );

  const posts = paginatedData?.pages?.flat() || [];

  const onRefresh = useCallback(() => {
    if (!postsLoading && !profileLoading) refetchPosts();
  }, [refetchPosts, postsLoading, profileLoading]);

  const handlePressItem = useCallback((index: number) => {
    setSelectedPostIndex(index);
    setModalVisible(true);
    overlayProgress.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.exp),
    });
  }, []);

  const handleClose = useCallback(() => {
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

  const { rowHeight } = useMemo(() => {
    const w = SCREEN_WIDTH / NUM_COLUMNS;
    return { rowHeight: w + 0.6 };
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: Post; index: number }) => (
      <ProfileGridItem item={item} theme={theme} onPress={() => handlePressItem(index)} />
    ),
    [handlePressItem, theme]
  );

  const renderListHeader = useCallback(
    () => <ProfileHeader insets={insets} theme={theme} profile={profile ?? null} />,
    [insets, theme, profile]
  );

  const debouncedFetchNextPage = useDebouncedCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, 300);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Animated Header */}
      <View style={styles.header}>
        <Animated.View
          style={[styles.headerBackground, headerStyle, { backgroundColor: theme.background }]}
        />
        <View style={styles.headerContent}>
          {/* Chevron-down (only visible when modal is open) */}
          <Animated.View style={leftIconStyle}>
            <TouchableOpacity onPress={handleClose} disabled={!modalVisible}>
              <Ionicons name="chevron-down" size={28} color={theme.text} />
            </TouchableOpacity>
          </Animated.View>

          {/* Center title transition */}
          <View style={styles.headerTitleWrapper}>
            <Animated.Text style={[styles.headerText, { color: theme.text }, usernameOpacity]}>
              @{profile?.username}
            </Animated.Text>
            <Animated.Text style={[styles.headerText, { color: theme.text }, postTextOpacity]}>
              Post
            </Animated.Text>
          </View>

          {/* Settings icon (fades out during modal) */}
          <Animated.View style={rightIconStyle}>
            <TouchableOpacity
              onPress={() => debouncedPush("/(settings)")}
              disabled={modalVisible}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color={theme.text} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* Grid Feed */}
      <Animated.FlatList
        ref={flatListRef}
        data={posts}
        keyExtractor={(item) => String(item.id)}
        numColumns={NUM_COLUMNS}
        ListHeaderComponent={renderListHeader}
        columnWrapperStyle={{ justifyContent: "flex-start" }}
        contentContainerStyle={{
          paddingTop: HEADER_HEIGHT,
          paddingBottom: CONTENT_BOTTOM_PADDING,
        }}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={profileLoading || postsLoading}
            onRefresh={onRefresh}
            tintColor={theme.subText}
            colors={[theme.subText]}
            progressViewOffset={80}
          />
        }
        onScroll={onScroll}
        scrollEventThrottle={16}
        initialNumToRender={6}
        windowSize={5}
        maxToRenderPerBatch={6}
        removeClippedSubviews
        getItemLayout={(_, index) => {
          const rowIndex = Math.floor(index / NUM_COLUMNS);
          return { length: rowHeight, offset: rowHeight * rowIndex, index };
        }}
        onEndReached={debouncedFetchNextPage}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <Ionicons name="camera-outline" size={48} color={theme.subText} style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyStateText, { color: theme.text }]}>No posts yet</Text>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator size="small" color={theme.subText} style={{ marginVertical: 16 }} />
          ) : null
        }
      />

      {/* Modal Viewer */}
      {modalVisible && selectedPostIndex !== null && (
        <Animated.View
          style={[
            styles.fullscreenOverlay,
            bgStyle,
            { backgroundColor: theme.background },
          ]}
        >
          <Animated.View
            style={[
              styles.modalContent,
              modalStyle,
              { backgroundColor: theme.background, paddingTop: HEADER_HEIGHT },
            ]}
          >
            <FlatList
              ref={modalListRef}
              data={posts}
              keyExtractor={(item) => String(item.id)}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={selectedPostIndex}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
              renderItem={({ item }) => (
                <ScrollView
                  style={{ width: SCREEN_WIDTH }}
                  showsVerticalScrollIndicator={false}
                >
                  <ImageSkeleton
                    item={item}
                    profile={profile}
                    onRequestClose={handleClose}
                    onDeleteStart={handleClose}
                    onDeleteFinish={() => {}}
                  />
                </ScrollView>
              )}
              onScrollToIndexFailed={({ index }) => {
                setTimeout(() => {
                  modalListRef.current?.scrollToIndex({ index, animated: false });
                }, 500);
              }}
            />
          </Animated.View>
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
    zIndex: 1000,
    paddingTop: HEADER_PADDING_TOP,
    paddingHorizontal: 15,
    justifyContent: "center",
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 40,
  },
  headerTitleWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },
  headerText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
  },
  fullscreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  modalContent: {
    flex: 1,
  },
});
