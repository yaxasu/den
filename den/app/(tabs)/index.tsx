import React, { useRef, useEffect } from 'react';
import { Dimensions, StyleSheet, View, Animated } from 'react-native';
import { useTheme } from '@/lib/contexts/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SplashScreen } from 'expo-router';
import PageIndicator from '@/components/screens/homeScreen/PageIndicator';
import HomeFeed from '@/components/screens/homeScreen/HomeFeed';
import MessageScreen from '@/components/screens/homeScreen/MessageScreen';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/lib/contexts/AuthContext';
import { generateUserRecommendations } from '@/lib/supabaseClient';

const { width: screenWidth } = Dimensions.get('window');

const screens = ['home', 'messages'] as const;
type ScreenName = typeof screens[number];

const screenComponents: Record<ScreenName, React.ComponentType> = {
  home: HomeFeed,
  messages: MessageScreen,
};

const HomeScreen = () => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (!user?.id || typeof user.id !== 'string' || user.id === 'undefined') return;
  
    const runRecommendationGeneration = async () => {
      try {
        await generateUserRecommendations(user.id);
        console.log("✅ Recommendations generated for user:", user.id);
      } catch (err) {
        console.error("❌ Failed to generate recommendations:", err);
      }
    };
  
    runRecommendationGeneration();
  }, [user?.id]);

  const renderScreen = ({ item }: { item: ScreenName }) => {
    const ScreenComponent = screenComponents[item];
    return (
      <View style={[styles.screen, { width: screenWidth }]}>
        <ScreenComponent />
      </View>
    );
  };

  return (
    <>
      <StatusBar
        style={isDark ? 'light' : 'dark'}
        backgroundColor={theme.background}
      />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <PageIndicator scrollX={scrollX} insets={insets} screensCount={screens.length} />
        <Animated.FlatList
          data={screens}
          keyExtractor={(item) => item}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={0}
          getItemLayout={(_, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
          renderItem={renderScreen}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  screen: { flex: 1 },
});

export default HomeScreen;
