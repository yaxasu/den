import React from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { useTheme } from '@/lib/contexts/ThemeProvider';

interface PageIndicatorProps {
  scrollX: Animated.Value;
  insets: {
    top: number;
  };
  screensCount?: number;
}

const PageIndicator: React.FC<PageIndicatorProps> = ({ scrollX, insets, screensCount = 2 }) => {
  const { theme } = useTheme();
  const windowWidth = Dimensions.get('window').width;

  // Create input and output ranges based on the number of screens
  const inputRange = Array.from({ length: screensCount }, (_, i) => i * windowWidth);
  const dotSpacing = 24; // Adjust as needed for your design
  const outputRange = Array.from({ length: screensCount }, (_, i) => i * dotSpacing);

  return (
    <View style={[styles.indicatorContainer, { top: insets.top + 16 }]}>
      <View style={[styles.dotsContainer, { width: screensCount * dotSpacing }]}>
        {Array.from({ length: screensCount }, (_, i) => (
          <View
            key={i}
            style={[styles.dot, { backgroundColor: theme.secondaryText + '40' }]}
          />
        ))}
        <Animated.View
          style={[
            styles.activeDot,
            {
              backgroundColor: theme.primary,
              transform: [
                {
                  translateX: scrollX.interpolate({
                    inputRange,
                    outputRange,
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        />
      </View>
    </View>
  );
};

export default React.memo(PageIndicator);

const styles = StyleSheet.create({
  indicatorContainer: {
    position: 'absolute',
    zIndex: 2,
    alignSelf: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  activeDot: {
    position: 'absolute',
    left: 8, // This ensures the active dot starts aligned with the first dot's center
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
