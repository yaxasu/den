import React, { useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery } from "react-query";
import { getHomeFeedPosts } from "@/lib/services/post";
import { useTheme } from "@/lib/contexts/ThemeProvider";
import { useAuth } from "@/lib/contexts/AuthContext";
import ImageSkeleton from "@/components/screens/homeScreen/HomeImageSkeleton";
import { Post } from "@/lib/schema";
import { Ionicons } from "@expo/vector-icons";

const POSTS_FETCH_LIMIT = 6;
const forceSkeleton = false;

const HomeFeed = () => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery(
    ["homeFeed", user?.id],
    ({ pageParam = 1 }) =>
      getHomeFeedPosts({
        page: pageParam,
        limit: POSTS_FETCH_LIMIT,
      }),
    {
      enabled: !!user?.id && !forceSkeleton,
      getNextPageParam: (lastPage, pages) =>
        lastPage.length < POSTS_FETCH_LIMIT ? undefined : pages.length + 1,
      staleTime: 60_000,
    }
  );

  const posts = useMemo(
    () => (forceSkeleton ? [] : data?.pages.flat() ?? []),
    [data, forceSkeleton]
  );
  const showSkeletons = forceSkeleton || isLoading;

  const handleRequestClose = useCallback(() => {}, []);
  const handleDeleteStart = useCallback(() => {}, []);
  const handleDeleteFinish = useCallback(() => {}, []);

  const renderItem = useCallback(
    ({ item }: { item: Post & { user: any } }) => (
      <View style={styles.postWrapper}>
        <ImageSkeleton
          item={item}
          profile={item.user}
          onRequestClose={handleRequestClose}
          onDeleteStart={handleDeleteStart}
          onDeleteFinish={handleDeleteFinish}
        />
      </View>
    ),
    [handleRequestClose, handleDeleteStart, handleDeleteFinish]
  );

  const renderFooter = () =>
    isFetchingNextPage ? (
      <ActivityIndicator style={{ marginVertical: 16 }} color={theme.subText} />
    ) : null;

  const renderSkeletons = () =>
    [...Array(3)].map((_, i) => (
      <View key={i} style={styles.postWrapper}>
        <ImageSkeleton
          item={{}}
          profile={{}}
          onRequestClose={() => {}}
          onDeleteStart={() => {}}
          onDeleteFinish={() => {}}
        />
      </View>
    ));

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlashList
        data={isLoading ? [] : posts}
        estimatedItemSize={400}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.subText}
            colors={[theme.subText]}
            progressViewOffset={80}
          />
        }
        ListHeaderComponent={<View style={{ marginTop: 70 }} />}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          showSkeletons ? (
            <View>{renderSkeletons()}</View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={theme.subText} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyText, { color: theme.subText }]}>
                Your feed is currently empty. Follow other users to start seeing posts here.
              </Text>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  postWrapper: {
    marginBottom: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 130,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },
});

export default HomeFeed;
