import React, { memo, useMemo, useState } from "react";
import { View, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import FastImage from "react-native-fast-image";
import SkeletonLoader from "../../general/SkeletonLoader";
import { ThemeType } from "@/constants/Colors";
import { Post } from "@/lib/schema";

interface GridItemProps {
  item?: Post; // May be undefined while loading
  theme: ThemeType;
  onPress?: () => void;
}

const screenWidth = Dimensions.get("window").width;
const numColumns = 3;
const itemWidth = screenWidth / numColumns;
const aspectRatio = 5 / 4;
const itemHeight = itemWidth * aspectRatio;

// Helper function to extract the URL from a string or array
export const extractUrl = (value?: string | string[]): string | null => {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] || null;

  try {
    const parsed = JSON.parse(value.trim());
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
  } catch {
    // not JSON, return as-is
  }
  return value.trim();
};

const ProfileGridItem = ({ item, theme, onPress }: GridItemProps) => {
  const [isLoading, setIsLoading] = useState(true);

  const imageSource = useMemo(() => {
    if (!item) return null;
    return extractUrl(item.thumbnail_url) || extractUrl(item.media_url);
  }, [item]);

  if (!item) {
    return (
      <View style={styles.itemContainer}>
        <SkeletonLoader theme={theme} style={styles.skeletonOverlay} />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.itemContainer}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {imageSource ? (
        <>
          <FastImage
            source={{
              uri: imageSource,
              priority: FastImage.priority.normal,
            }}
            style={[styles.image, { opacity: isLoading ? 0 : 1 }]}
            resizeMode={FastImage.resizeMode.cover}
            onLoadStart={() => setIsLoading(true)}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              console.warn("ProfileGridItem: Failed to load image.");
              setIsLoading(false);
            }}
          />
          {isLoading && (
            <SkeletonLoader theme={theme} style={styles.skeletonOverlay} />
          )}
        </>
      ) : (
        <SkeletonLoader theme={theme} style={styles.skeletonOverlay} />
      )}
    </TouchableOpacity>
  );
};

export default memo(ProfileGridItem);

const styles = StyleSheet.create({
  itemContainer: {
    width: itemWidth,
    height: itemHeight,
    margin: 0.3,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  skeletonOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
