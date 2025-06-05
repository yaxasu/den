import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  FlatList,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, {
  Easing,
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/lib/contexts/ThemeProvider";
import { useExploreFeed } from "@/lib/hooks/useExploreFeed";
import { useAuth } from "@/lib/contexts/AuthContext";
import { PostWithUser } from "@/lib/schema";
import UserImageSkeleton from "@/components/screens/userProfileScreen/UserImageSkeleton";

const SCREEN_WIDTH = Dimensions.get("window").width;
const HEADER_HEIGHT = 90;

export default function ExplorePosts() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const modalListRef = useRef<FlatList<PostWithUser>>(null);
  const overlayProgress = useSharedValue(0);

  const { scrollToPostId } = useLocalSearchParams<{ scrollToPostId?: string }>();
  const [initialTargetIndex, setInitialTargetIndex] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const userId = user?.id?.trim() || undefined;

  const {
    data: exploreData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isLoading,
  } = useExploreFeed(userId, 12);

  const posts: PostWithUser[] = useMemo(() => {
    const flat = (exploreData?.pages.flat() as PostWithUser[]) ?? [];
    const seen = new Set<string>();
    return flat.filter((post) => {
      if (!post.id || seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
  }, [exploreData]);

  useEffect(() => {
    if (!scrollToPostId || !posts.length) return;
    const index = posts.findIndex((p) => p.id === scrollToPostId);
    if (index !== -1) {
      setInitialTargetIndex(index);
      setModalVisible(true);
      overlayProgress.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.exp),
      });
    }
  }, [scrollToPostId, posts]);

  const handleClose = useCallback(() => {
    overlayProgress.value = withTiming(
      0,
      {
        duration: 250,
        easing: Easing.in(Easing.ease),
      },
      () => {
        runOnJS(setModalVisible)(false);
        runOnJS(setInitialTargetIndex)(null);
        runOnJS(router.back)();
      }
    );
  }, []);

  const modalStyle = useAnimatedStyle(() => ({
    opacity: interpolate(overlayProgress.value, [0, 1], [0, 1], Extrapolate.CLAMP),
    transform: [
      {
        translateY: interpolate(overlayProgress.value, [0, 1], [50, 0], Extrapolate.CLAMP),
      },
    ],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(overlayProgress.value, [0, 1], [0, 1], Extrapolate.CLAMP),
  }));

  const getItemLayout = useCallback(
    (_: ArrayLike<PostWithUser> | null | undefined, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    []
  );
  return (
    <>
      {modalVisible && initialTargetIndex !== null && (
        <Animated.View
          style={[
            styles.fullscreenOverlay,
            bgStyle,
            { backgroundColor: theme.background },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color={theme.text} />
            </TouchableOpacity>
            <View style={{ width: 28 }} />
          </View>

          <Animated.View style={[styles.modalContent, modalStyle, { paddingTop: HEADER_HEIGHT }]}>
            <FlatList
              ref={modalListRef}
              data={posts}
              horizontal
              pagingEnabled
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={initialTargetIndex}
              getItemLayout={getItemLayout}
              renderItem={({ item }) => (
                <ScrollView style={{ width: SCREEN_WIDTH }} showsVerticalScrollIndicator={false}>
                  <UserImageSkeleton
                    item={item}
                    profile={item.user}
                    onRequestClose={handleClose}
                  />
                </ScrollView>
              )}
              onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
              onEndReachedThreshold={0.5}
              refreshControl={
                <RefreshControl
                  refreshing={isLoading}
                  onRefresh={refetch}
                  tintColor={theme.subText}
                  progressViewOffset={10}
                />
              }
              onScrollToIndexFailed={({ index }) => {
                setTimeout(() => {
                  modalListRef.current?.scrollToIndex({ index, animated: false });
                }, 500);
              }}
            />
            {isFetchingNextPage && (
              <ActivityIndicator
                style={{ marginVertical: 16 }}
                size="small"
                color={theme.subText}
              />
            )}
          </Animated.View>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fullscreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  modalContent: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    zIndex: 9999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 45,
    backgroundColor: "transparent",
  },
  backButton: {
    padding: 5,
  },
});
