import { useRegistration } from "@/lib/contexts/RegistrationContext";
import { useTheme } from "@/lib/contexts/ThemeProvider";
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
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

export default function EnterPass() {
  const router = useRouter();
  const { theme } = useTheme();
  const { setField } = useRegistration();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const debouncedPush = useDebouncedCallback(
    (destination: Parameters<typeof router.push>[0]) => {
      router.push(destination);
    },
    500
  );

  const handlePasswordChange = useCallback((text: string) => setPassword(text), []);
  const handleConfirmPasswordChange = useCallback((text: string) => setConfirmPassword(text), []);

  const handlePasswordInput = async () => {
    Keyboard.dismiss();

    if (password.length < 6) {
      Alert.alert("Invalid Password", "Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    setLoading(true);
    setField("password", password);

    debouncedPush({ pathname: "/(auth)/EnterName" });
    setLoading(false);
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
            Please enter your password
          </Text>

          <View style={[styles.inputContainer, { borderColor: theme.subText }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Password"
              placeholderTextColor={theme.subText}
              secureTextEntry
              autoCapitalize="none"
              onChangeText={handlePasswordChange}
              value={password}
            />
          </View>

          <View style={[styles.inputContainer, { borderColor: theme.subText }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Confirm Password"
              placeholderTextColor={theme.subText}
              secureTextEntry
              autoCapitalize="none"
              onChangeText={handleConfirmPasswordChange}
              value={confirmPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: theme.primary }]}
            onPress={handlePasswordInput}
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
