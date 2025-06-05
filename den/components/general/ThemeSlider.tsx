import React, { useRef } from "react";
import {
  View,
  TouchableOpacity,
  Animated,
  Text,
  StyleSheet,
  Easing,
} from "react-native";
import { useTheme } from "@/lib/contexts/ThemeProvider";

const THEME_OPTIONS = ["light", "dark", "system"];
const OPTION_WIDTH = 100; // Each option is 1/3 of container width (300 / 3)

export default function ThemeSlider({ selectedIndex, onThemeChange }: any) {
  const { theme } = useTheme();

  // Animated value to slide the indicator
  const translateX = useRef(new Animated.Value(selectedIndex * OPTION_WIDTH)).current;

  /**
   * Animate indicator position when an option is pressed.
   */
  const handleThemeChange = (index: number, themeType: string) => {
    onThemeChange(index, themeType);

    // Animate the slider with a smooth easing
    Animated.timing(translateX, {
      toValue: index * OPTION_WIDTH,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  /**
   * For the "pop" effect on selected text, interpolate translateX around the "step" value
   * so each option is scaled when its slot is near the indicator.
   */
  const getScaleForOption = (index: number) => {
    return translateX.interpolate({
      inputRange: [
        (index - 1) * OPTION_WIDTH,
        index * OPTION_WIDTH,
        (index + 1) * OPTION_WIDTH,
      ],
      outputRange: [1, 1.15, 1],
      extrapolate: "clamp",
    });
  };

  return (
    <View style={styles.toggleContainer}>
      {/* Sliding background indicator */}
      <Animated.View
        style={[
          styles.slider,
          {
            backgroundColor: theme.text,
            transform: [{ translateX }],
          },
        ]}
      />

      {/* Dynamically render theme options */}
      {THEME_OPTIONS.map((option, i) => {
        const isActive = selectedIndex === i;
        const scale = getScaleForOption(i);

        return (
          <TouchableOpacity
            key={option}
            style={styles.option}
            onPress={() => handleThemeChange(i, option)}
          >
            <Animated.Text
              style={[
                styles.optionText,
                {
                  transform: [{ scale }],
                  color: isActive ? theme.background : "#555",
                },
              ]}
            >
              {option[0].toUpperCase() + option.slice(1)}
            </Animated.Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  toggleContainer: {
    width: 300,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#e0e0e0",
    position: "relative",
    flexDirection: "row",
    overflow: "hidden",
  },
  slider: {
    position: "absolute",
    width: "33.3%",
    height: "100%",
    borderRadius: 25,
    // Subtle shadow for the slider
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  option: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
