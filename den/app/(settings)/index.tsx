import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useTheme } from "@/lib/contexts/ThemeProvider";
import { useAuth } from "@/lib/contexts/AuthContext";
import { deleteUserAccount } from "@/lib/services/auth";
import ThemeSlider from "@/components/general/ThemeSlider";
import { useMutation } from "react-query";

export default function SettingsLayout() {
  const { theme, themeName, setTheme } = useTheme();
  const { signOut } = useAuth();
  const router = useRouter();

  const [selectedIndex, setSelectedIndex] = useState(
    themeName === "light" ? 0 : themeName === "dark" ? 1 : 2
  );

  const handleThemeChange = (index: number, themeType: any) => {
    setSelectedIndex(index);
    setTheme(themeType);
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure that you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              router.replace("/(auth)");
            } catch (error) {
              console.error("Error during sign out:", error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const { mutate: deleteAccount } = useMutation({
    mutationFn: deleteUserAccount,
    onMutate: async () => {
      // Navigate early for immediate feedback
      router.replace("/(auth)");
    },
    onSuccess: async () => {
      // Don't call signOut — session is invalidated already
      // and we’ve cleared AsyncStorage
      console.log("Account deleted and cleaned up.");
    },
    onError: (error: any) => {
      console.error("Error during account deletion:", error?.message || error);
    },
  });

  const handleDeleteAccount = () => {
  Alert.alert(
    "Delete Account",
    "This will permanently delete your account. Are you sure?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteAccount(); // Triggers the mutation
        },
      },
    ]
  );
};


  const SettingsSection = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.secondaryText }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>
        {children}
      </View>
    </View>
  );

  const SettingsItem = ({
    icon,
    label,
    onPress,
  }: {
    icon: React.ReactNode;
    label: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.itemLeft}>
        {icon}
        <Text style={[styles.itemLabel, { color: theme.text }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={styles.rightPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <SettingsSection title="Account">
          <SettingsItem
            icon={<Ionicons name="lock-closed-outline" size={24} color={theme.text} />}
            label="Login & Security"
            onPress={() => {}}
          />
          <SettingsItem
            icon={<Ionicons name="eye-outline" size={24} color={theme.text} />}
            label="Privacy Settings"
            onPress={() => {}}
          />
          <SettingsItem
            icon={<Ionicons name="ban-outline" size={24} color={theme.text} />}
            label="Blocked Accounts"
            onPress={() => {}}
          />
        </SettingsSection>

        <SettingsSection title="Appearance">
          <View style={styles.themeContainer}>
            <Text style={[styles.text, { color: theme.text }]}>Theme</Text>
            <ThemeSlider selectedIndex={selectedIndex} onThemeChange={handleThemeChange} />
          </View>
        </SettingsSection>

        <SettingsSection title="Support">
          <SettingsItem
            icon={<Ionicons name="help-circle-outline" size={24} color={theme.text} />}
            label="Help Center"
            onPress={() => {}}
          />
          <SettingsItem
            icon={<MaterialIcons name="report-problem" size={24} color={theme.text} />}
            label="Report a Problem"
            onPress={() => {}}
          />
        </SettingsSection>

        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: theme.primary }]}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDeleteAccount} activeOpacity={0.6}>
          <Text style={[styles.deleteText, { color: theme.primary }]}>
            Delete Account
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 60,
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  rightPlaceholder: {
    width: 48,
  },
  content: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: "400",
  },
  themeContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  text: {
    fontSize: 16,
  },
  signOutButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 30,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  deleteText: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 30,
  },
});
