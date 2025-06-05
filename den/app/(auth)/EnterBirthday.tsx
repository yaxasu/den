import { useRegistration } from "@/lib/contexts/RegistrationContext";
import { useTheme } from "@/lib/contexts/ThemeProvider";
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback";
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
import DateTimePickerModal from "react-native-modal-datetime-picker";

export default function BirthdayScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { setField } = useRegistration();

  const [birthday, setBirthday] = useState<Date | null>(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [loading, setLoading] = useState(false);

  const debouncedPush = useDebouncedCallback(
    (destination: Parameters<typeof router.push>[0]) => {
      router.push(destination);
    },
    500
  );

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handleConfirm = (date: Date) => {
    setBirthday(date);
    hideDatePicker();
  };

  const handleNext = () => {
    if (!birthday) {
      Alert.alert("No Birthday Selected", "Please select your birthday.");
      return;
    }

    const birthdayStr = birthday.toISOString().split("T")[0];
    setField("birthday", birthdayStr);
    setLoading(true);

    debouncedPush({ pathname: "/(auth)/Terms" });
    setLoading(false);
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
            Please enter your birthday
          </Text>
          <Text style={[styles.text, { color: theme.text, marginTop: 10 }]}>
            This helps us personalize your experience.
          </Text>

          {/* Birthday Picker */}
          <TouchableOpacity
            style={[
              styles.inputContainer,
              { borderColor: theme.subText, justifyContent: "center" },
            ]}
            onPress={showDatePicker}
          >
            <Text style={[styles.input, { color: theme.text }]}>
              {birthday ? birthday.toDateString() : "Select your birthday"}
            </Text>
          </TouchableOpacity>

          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleConfirm}
            onCancel={hideDatePicker}
            maximumDate={new Date()}
          />

          {/* Next Button */}
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: theme.primary }]}
            onPress={handleNext}
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
    height: 60,
  },
  input: {
    flex: 1,
    fontSize: 18,
    textAlign: "center",
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
