import { useTheme } from "@/lib/contexts/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Alert,
} from "react-native";
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback";
import { useRegistration } from "@/lib/contexts/RegistrationContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useQueryClient } from "react-query";
import { signInUser } from "@/lib/services/auth";

export default function TermsScreen() {
  const { data, reset } = useRegistration();
  const { email, password, full_name, birthday } = data;
  const { register } = useAuth();

  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(false);

  const queryClient = useQueryClient();

  const debouncedPush = useDebouncedCallback(
    (destination: Parameters<typeof router.push>[0]) => {
      router.push(destination);
    },
    500
  );

  const handleRegisterUser = async () => {
    if (hasRegistered) return;
  
    if (!email || !password || !full_name || !birthday) {
      Alert.alert("Missing Info", "Please complete all registration steps.");
      return;
    }
  
    setHasRegistered(true);
    setLoading(true);
  
    try {
      const result = await register(email, password, full_name, birthday);
      if (result.success) {
        reset();
        const result = await signInUser(email, password);
        if (!result.success) {
          Alert.alert("Login Failed", "Please try again.");
        } else {
          debouncedPush("/(tabs)");
        }
      } else {
        Alert.alert("Registration Error", result.error || "Registration failed.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert("Registration Error", "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Terms and Conditions
          </Text>
          <View style={[styles.termsContainer, { borderLeftColor: theme.primary }]}>
            {[
              "By registering, you agree to our Terms of Service, Privacy Policy, and Community Guidelines.",
              "You agree not to misuse the platform or engage in unlawful activities.",
              "Your personal information will be handled according to our Privacy Policy.",
              "If you do not agree with these terms, you should not proceed with registration."
            ].map((paragraph, index) => (
              <Text key={index} style={[styles.termsText, { color: theme.text }]}>
                {paragraph}
              </Text>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: theme.primary }]}
            onPress={handleRegisterUser}
            activeOpacity={0.7}
          >
            <Text style={styles.loginText}>
              {loading ? <ActivityIndicator size="small" color="#fff" /> : "Finish"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
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
    height: 60,
    paddingHorizontal: 5,
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginHorizontal: 20,
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  termsContainer: {
    borderLeftWidth: 4,
    paddingLeft: 15,
    marginVertical: 20,
  },
  termsText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
  },
  loginButton: {
    width: "100%",
    padding: 13,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
  },
  loginText: {
    fontSize: 16,
    color: "#fff",
  },
});
