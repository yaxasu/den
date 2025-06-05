import { RegistrationProvider } from "@/lib/contexts/RegistrationContext";
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <RegistrationProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
        }}
      ></Stack>
    </RegistrationProvider>
  );
}
