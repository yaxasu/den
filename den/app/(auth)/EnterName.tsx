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
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Alert,
} from "react-native";

export default function EnterName() {
  const router = useRouter();
  const { theme } = useTheme();
  const { setField } = useRegistration();

  const [fullName, setFullName] = useState("");

  const debouncedPush = useDebouncedCallback(
    (destination: Parameters<typeof router.push>[0]) => {
      router.push(destination);
    },
    500
  );

  const handleNameChange = useCallback((text: string) => setFullName(text), []);

  const handleNext = () => {
    if (!fullName.trim()) {
      Alert.alert("Invalid Name", "Please enter your full name.");
      return;
    }

    setField("full_name", fullName);
    debouncedPush({ pathname: "/(auth)/EnterBirthday" });
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
            Please enter your name
          </Text>

          <View style={[styles.inputContainer, { borderColor: theme.subText }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Full Name"
              placeholderTextColor={theme.subText}
              autoCapitalize="words"
              value={fullName}
              onChangeText={handleNameChange}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: theme.primary }]}
            onPress={handleNext}
            activeOpacity={0.7}
          >
            <Text style={styles.loginText}>Next</Text>
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
