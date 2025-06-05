import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, ViewStyle } from "react-native";
import { ThemeType } from "@/constants/Colors";

// Add style prop and component props type
interface Props {
  theme: ThemeType;
  style?: Animated.WithAnimatedValue<ViewStyle>;
}

const SkeletonLoader = ({ theme, style }: Props) => {
  const opacityAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.5,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { backgroundColor: theme.surface },
        style, // Add passed style here
        { opacity: opacityAnim },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default SkeletonLoader;