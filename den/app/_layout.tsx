// src/app/RootLayout.tsx
import React from "react";
import { SplashScreen, Stack, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "react-query";
import { ThemeProvider } from "@/lib/contexts/ThemeProvider";
import { CommentModalProvider } from "@/lib/contexts/CommentModalContext";
import { FloatingModalProvider } from "@/lib/contexts/FloatingModalContext";
import { AuthProvider, useAuth, useAuthLoadingDone } from "@/lib/contexts/AuthContext";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { View } from "react-native";
import { KeyedReload } from "@/lib/contexts/KeyedReload";
import { queryClient } from "@/lib/queryClient";


export default function RootLayout() {
  console.log("[RootLayout] Rendering RootLayout...");
  return (
    <KeyedReload>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AuthGate />
          </AuthProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </KeyedReload>
  );
}

function AuthGate() {
  const authLoadingDone = useAuthLoadingDone();
  const { user } = useAuth();
  const router = useRouter();
  const hasRoutedRef = React.useRef(false);

  // Hide splash screen once auth is loaded
  React.useEffect(() => {
    if (authLoadingDone) {
      SplashScreen.hideAsync().catch(() => {
        console.warn("[AuthGate] SplashScreen.hideAsync() failed or not supported");
      });
    }
  }, [authLoadingDone]);

  // Route to the correct stack once auth is known
  React.useEffect(() => {
    if (authLoadingDone && !hasRoutedRef.current) {
      hasRoutedRef.current = true;
      const target = user ? "/(tabs)" : "/(auth)";
      console.log("[AuthGate] Auth is loaded. Routing to:", target);
      router.replace(target);
    }
  }, [authLoadingDone, user]);

  // Fallback UI while waiting for auth state
  if (!authLoadingDone) {
    return (
      <View style={{ flex: 1, backgroundColor: "black", justifyContent: "center", alignItems: "center" }}>
        {/* Optionally add an ActivityIndicator */}
      </View>
    );
  }

  return (
    <ThemeProvider>
      <KeyboardProvider>
        <CommentModalProvider>
          <FloatingModalProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                gestureEnabled: false,
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen
                name="(auth)"
                options={{
                  animation: "fade",
                  animationDuration: 150,
                }}
              />
              <Stack.Screen
                name="(tabs)"
                options={{
                  animation: "fade",
                  animationDuration: 150,
                }}
              />
              <Stack.Screen
                name="(userProfile)"
                options={{
                  gestureEnabled: true,
                  fullScreenGestureEnabled: true
                }}
              />
              <Stack.Screen
                name="(settings)"
                options={{
                  gestureEnabled: true,
                  fullScreenGestureEnabled: true
                }}
              />
            </Stack>
          </FloatingModalProvider>
        </CommentModalProvider>
      </KeyboardProvider>
    </ThemeProvider>
  );
}
