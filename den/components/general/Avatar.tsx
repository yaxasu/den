// components/general/Avatar.tsx
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import FastImage from "react-native-fast-image";
import { Ionicons } from "@expo/vector-icons";
import SkeletonLoader from "./SkeletonLoader";

interface AvatarProps {
  uri: string | null;
  fallbackText: string;
  size?: number;
  theme: any;
}

const Avatar: React.FC<AvatarProps> = ({
  uri,
  fallbackText,
  size = 40,
  theme,
}) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <View style={[styles.avatarWrapper, { width: size, height: size }]}>
      {uri ? (
        <>
          {!loaded && (
            <SkeletonLoader
              theme={theme}
              style={StyleSheet.flatten([
                styles.avatar,
                { width: size, height: size, borderRadius: size / 2 },
              ])}
            />
          )}
          <FastImage
            style={[
              styles.avatar,
              { width: size, height: size, borderRadius: size / 2 },
            ]}
            source={{ uri }}
            resizeMode={FastImage.resizeMode.cover}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
          />
        </>
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: theme.border,
            },
          ]}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="person" size={size * 0.5} color={theme.text} />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatarWrapper: {
    overflow: "hidden",
    borderRadius: 999, // ensures clipping for round avatar
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  fallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
});

export default Avatar;
