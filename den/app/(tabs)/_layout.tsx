import { useTheme } from "@/lib/contexts/ThemeProvider";
import { Tabs } from "expo-router";
import { Animated, View, StyleSheet } from "react-native";
import {
  Entypo,
  Feather,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";

export default function TabLayout() {
  const { theme } = useTheme();
  const animatedValues = Array.from({ length: 5 }, () => new Animated.Value(0));

  const animateIcon = (index: number) => {
    animatedValues[index].setValue(0);
    Animated.spring(animatedValues[index], {
      toValue: 1,
      friction: 5, // Smoother spring effect
      useNativeDriver: true,
    }).start();
  };

  // Common icon size constants
  const ICON_SIZE = 26;
  const ACTIVE_ICON_SCALE = 0.9;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopWidth: 0.2,
          borderTopColor: theme.border,
          height: 84,
          elevation: 0,
          shadowOpacity: 0,
          paddingTop: 10,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.secondaryText,
      }}
    >
      <Tabs.Screen
        name="index"
        listeners={{ tabPress: () => animateIcon(0) }}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIcon]}>
              <Animated.View
                style={{
                  transform: [
                    {
                      scale: animatedValues[0].interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, ACTIVE_ICON_SCALE],
                      }),
                    },
                  ],
                }}
              >
                <Entypo name="home" size={ICON_SIZE} color={color} />
              </Animated.View>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        listeners={{ tabPress: () => animateIcon(1) }}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIcon]}>
              <Animated.View
                style={{
                  transform: [
                    {
                      scale: animatedValues[1].interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, ACTIVE_ICON_SCALE],
                      }),
                    },
                  ],
                }}
              >
                <Feather name="search" size={ICON_SIZE} color={color} />
              </Animated.View>
            </View>
          ),
        }}
      />

      {/* Updated "add" screen without the special styling */}
      <Tabs.Screen
        name="add"
        listeners={{ tabPress: () => animateIcon(2) }}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIcon]}>
              <Animated.View
                style={{
                  transform: [
                    {
                      scale: animatedValues[2].interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, ACTIVE_ICON_SCALE],
                      }),
                    },
                  ],
                }}
              >
                <Feather name="plus" size={ICON_SIZE + 5} color={color} />
              </Animated.View>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        listeners={{ tabPress: () => animateIcon(4) }}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIcon]}>
              <Animated.View
                style={{
                  transform: [
                    {
                      scale: animatedValues[4].interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, ACTIVE_ICON_SCALE],
                      }),
                    },
                  ],
                }}
              >
                <MaterialCommunityIcons
                  name="account"
                  size={ICON_SIZE + 2}
                  color={color}
                />
              </Animated.View>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  activeIcon: {
    backgroundColor: "rgba(255, 0, 80, 0.1)",
  },
  notificationBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
