import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/lib/contexts/ThemeProvider";
import { useQuery, useInfiniteQuery } from "react-query";
import { getProfileById } from "@/lib/services/profile";
import { getPaginatedPosts } from "@/lib/services/post";
import { Post } from "@/lib/schema";
import ProfileGridItem from "@/components/screens/profileScreen/ProfileGridItem";
import UserProfileHeader from "@/components/screens/userProfileScreen/UserProfileHeader";
import UserImageSkeleton from "@/components/screens/userProfileScreen/UserImageSkeleton";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { useFloatingOptionsModal } from "@/lib/hooks/useFloatingOptionsModal";

const POSTS_FETCH_LIMIT = 6;
const NUM_COLUMNS = 3;
const SCREEN_WIDTH = Dimensions.get("window").width;
const HEADER_HEIGHT = 90;
const HEADER_PADDING_TOP = 45;
const CONTENT_BOTTOM_PADDING = 30;

export default function UserProfile() {
  const { userProfileId } = useLocalSearchParams<{ userProfileId: string }>();
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const flatListRef = useRef<FlatList>(null);
  const modalListRef = useRef<FlatList>(null);
  const { openOptionsModal } = useFloatingOptionsModal();

  const scrollY = useSharedValue(0);
  const overlayProgress = useSharedValue(0);
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const profileQueryKey = useMemo(() => ["profile", userProfileId], [userProfileId]);
  const postQueryKey = useMemo(() => ["posts", userProfileId, "image"], [userProfileId]);

  const { data: profile, isLoading: profileLoading } = useQuery(
    profileQueryKey,
    () => getProfileById(userProfileId),
    { enabled: !!userProfileId, refetchOnWindowFocus: false }
  );

  const {
    data: paginatedData,
    isLoading: postsLoading,
    refetch: refetchPosts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    postQueryKey,
    ({ pageParam = 1 }) =>
      getPaginatedPosts({
        userId: userProfileId,
        mediaType: "image",
        page: pageParam,
        limit: POSTS_FETCH_LIMIT,
      }),
    {
      enabled: !!userProfileId,
      getNextPageParam: (lastPage, pages) =>
        lastPage.length < POSTS_FETCH_LIMIT ? undefined : pages.length + 1,
      staleTime: 60000,
      keepPreviousData: true,
    }
  );

  const posts = paginatedData?.pages?.flat() || [];

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 100], [0, 1], Extrapolate.CLAMP),
  }));

  const backButtonRotationStyle = useAnimatedStyle(() => {
    const rotation = interpolate(overlayProgress.value, [0, 1], [0, -90], Extrapolate.CLAMP);
    return {
      transform: [{ rotateZ: `${rotation}deg` }],
    };
  });
  

  const rightIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(overlayProgress.value, [0, 0.5], [1, 0], Extrapolate.CLAMP),
  }));

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

  const bgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(overlayProgress.value, [0, 1], [0, 1], Extrapolate.CLAMP),
  }));

  const usernameOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(overlayProgress.value, [0, 1], [1, 0], Extrapolate.CLAMP),
  }));

  const postTextOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(overlayProgress.value, [0, 1], [0, 1], Extrapolate.CLAMP),
    position: "absolute",
  }));

  const onRefresh = useCallback(() => refetchPosts(), [refetchPosts]);

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

  const renderItem = useCallback(
    ({ item, index }: { item: Post; index: number }) => (
      <ProfileGridItem item={item} theme={theme} onPress={() => handlePressItem(index)} />
    ),
    [handlePressItem, theme]
  );

  const renderListHeader = useCallback(
    () => profile ? <UserProfileHeader insets={insets} theme={theme} profile={profile} /> : null,
    [insets, theme, profile]
  );

  const openPlaceholderModal = useCallback(() => {
    openOptionsModal([]);
  }, [openOptionsModal]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Animated.View style={[styles.headerBackground, headerStyle, { backgroundColor: theme.background }]} />
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={selectedPostIndex !== null ? handleClose : router.back} activeOpacity={0.8}>
            <Animated.View style={backButtonRotationStyle}>
              <Ionicons
                name="chevron-back"
                size={28}
                color={theme.text}
              />
            </Animated.View>
          </TouchableOpacity>
          <View style={styles.headerTitleWrapper}>
            <Animated.Text style={[styles.headerText, { color: theme.text }, usernameOpacity]}>
              @{profile?.username || ""}
            </Animated.Text>
            <Animated.Text style={[styles.headerText, { color: theme.text }, postTextOpacity]}>
              Post
            </Animated.Text>
          </View>
          <Animated.View style={rightIconStyle}>
            <TouchableOpacity onPress={openPlaceholderModal}>
              <Ionicons name="ellipsis-horizontal" size={24} color={theme.text} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {profileLoading || postsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.subText} />
        </View>
      ) : (
        <Animated.FlatList
          ref={flatListRef}
          data={posts}
          keyExtractor={(item) => String(item.id)}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={{ justifyContent: "flex-start" }}
          contentContainerStyle={{ paddingTop: HEADER_HEIGHT, paddingBottom: CONTENT_BOTTOM_PADDING }}
          renderItem={renderItem}
          ListHeaderComponent={renderListHeader}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={postsLoading}
              onRefresh={onRefresh}
              tintColor={theme.subText}
              colors={[theme.subText]}
              progressViewOffset={80}
            />
          }
          onScroll={onScroll}
          scrollEventThrottle={16}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={5}
          removeClippedSubviews
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
      )}

      {modalVisible && selectedPostIndex !== null && (
        <Animated.View style={[styles.fullscreenOverlay, bgStyle, { backgroundColor: theme.background }]}>
          <Animated.View style={[styles.modalContent, modalStyle, { backgroundColor: theme.background, paddingTop: HEADER_HEIGHT }]}>
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
                <ScrollView style={{ width: SCREEN_WIDTH }} showsVerticalScrollIndicator={false}>
                  <UserImageSkeleton item={item} profile={profile} onRequestClose={handleClose} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  modalContent: {
    flex: 1,
  },
});
