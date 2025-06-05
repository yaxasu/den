import React, { useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";
import FastImage from "react-native-fast-image";
import { styles } from "./styles";

import SkeletonLoader from "@/components/general/SkeletonLoader";
import { extractUrl } from "@/lib/utilities/extractUrl";

interface PostMediaProps {
  item: any;
  isMediaLoaded: boolean;
  setIsMediaLoaded: (val: boolean) => void;
  theme: any;
}

const MAX_RETRIES = 2;

const PostMedia: React.FC<PostMediaProps> = ({
  item,
  isMediaLoaded,
  setIsMediaLoaded,
  theme,
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now()); // triggers reload
  const retryTimer = useRef<NodeJS.Timeout | null>(null);

  const opacity = useRef(new Animated.Value(0)).current;
  const mediaUrl = extractUrl(item.media_url);

  useEffect(() => {
    // Retry with exponential backoff
    if (retryCount > 0 && retryCount <= MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 500; // 500ms, 1s, 2s...
      retryTimer.current = setTimeout(() => {
        setImageKey(Date.now()); // force FastImage to reload
      }, delay);
    } else if (retryCount > MAX_RETRIES) {
      setLoadFailed(true);
      setIsMediaLoaded(true);
    }

    return () => {
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
      }
    };
  }, [retryCount]);

  const handleImageLoad = () => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsMediaLoaded(true);
    });
  };

  const handleImageError = () => {
    console.warn(`Image failed to load: ${mediaUrl}, attempt ${retryCount + 1}`);
    setRetryCount((prev) => prev + 1);
  };

  return (
    <View style={styles.mediaWrapper}>
      {!isMediaLoaded && (
        <SkeletonLoader theme={theme} style={styles.mediaPlaceholder} />
      )}

      {!loadFailed && mediaUrl && (
        <Animated.View style={{ opacity }}>
          <FastImage
            key={imageKey}
            style={styles.mediaPlaceholder}
            source={{
              uri: mediaUrl,
              priority: FastImage.priority.normal,
              cache: FastImage.cacheControl.immutable,
            }}
            resizeMode={FastImage.resizeMode.cover}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </Animated.View>
      )}
    </View>
  );
};

export default PostMedia;
