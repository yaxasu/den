import { useRegistration } from "@/lib/contexts/RegistrationContext";
import { useTheme } from "@/lib/contexts/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Alert,
} from "react-native";
import { checkEmailExists, validateEmail } from "@/lib/services/auth";
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback";

export default function SignupScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { setField } = useRegistration();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailChange = useCallback((text: string) => setEmail(text), []);
  const handleClearEmail = useCallback(() => setEmail(""), []);

  const debouncedPush = useDebouncedCallback(
    (destination: Parameters<typeof router.push>[0]) => {
      router.push(destination);
    },
    500
  );

  const handleCheckEmail = async () => {
    Keyboard.dismiss();

    if (!validateEmail(email)) {
      Alert.alert("Invalid Email", "Please use a correct email format.");
      return;
    }

    setLoading(true);

    try {
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        Alert.alert(
          "Email Already Registered",
          "This email is already registered. Please sign in or use another email."
        );
        return;
      }

      setField("email", email);
      debouncedPush({ pathname: "/(auth)/EnterPass" });
    } catch (error) {
      console.error("Error checking email:", error);
      Alert.alert(
        "Error",
        "An error occurred while checking your email. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Please enter your email
          </Text>
          <Text style={[styles.text, { color: theme.text, marginTop: 10 }]}>
            This will be your primary sign in method. No one will be able to see
            this on your profile.
          </Text>

          <View style={[styles.inputContainer, { borderColor: theme.subText }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Email"
              placeholderTextColor={theme.subText}
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {email.length > 0 && (
              <TouchableOpacity onPress={handleClearEmail} style={styles.icon}>
                <Text style={{ color: theme.text, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: theme.primary }]}
            onPress={handleCheckEmail}
            activeOpacity={0.7}
          >
            <Text style={styles.loginText}>
              {loading ? <ActivityIndicator size="small" color="#fff" /> : "Next"}
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
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  text: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 10,
    marginTop: 20,
  },
  input: {
    flex: 1,
    padding: 17,
    fontSize: 18,
  },
  icon: {
    padding: 10,
  },
  loginButton: {
    width: "100%",
    padding: 13,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
  },
});
