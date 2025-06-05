import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="editProfile" />
      <Stack.Screen name="follow" />
      <Stack.Screen 
        name="compose" 
        options={{
          gestureEnabled: true,
          fullScreenGestureEnabled: true
        }}
      />
      <Stack.Screen name="chat" />
    </Stack>
  );
}
