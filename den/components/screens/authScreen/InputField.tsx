// InputField.js
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from "@/lib/contexts/ThemeProvider";

const InputField = ({
  value,
  setValue,
  placeholder,
  isPassword = false,
  isInvalid = false,
  togglePasswordVisibility,
  showPassword,
}: any) => {
  const { theme } = useTheme();

  // Decide which error message to show based on type
  const errorMessage = isPassword
    ? value.length > 0 && value.length < 6
      ? "Password should be at least 6 characters"
      : ""
    : isInvalid
    ? "Please enter a valid email"
    : "";

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.inputWrapper}>
        <View
          style={[
            styles.inputContainer,
            { borderColor: isInvalid ? "#e53935" : "#ccc" },
          ]}
        >
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder={placeholder}
            placeholderTextColor={theme.subText}
            value={value}
            onChangeText={setValue}
            secureTextEntry={isPassword && !showPassword}
            keyboardType={isPassword ? "default" : "email-address"}
            autoCapitalize={isPassword ? "sentences" : "none"}
            autoCorrect={isPassword ? true : false}
          />
          {isPassword && togglePasswordVisibility && (
            <TouchableOpacity onPress={togglePasswordVisibility} style={{marginHorizontal: 10}}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={24}
                color={theme.subText}
              />
            </TouchableOpacity>
          )}
        </View>
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  inputWrapper: {
    width: "100%",
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
  },
  errorText: {
    marginTop: 5,
    color: "#e53935",
    fontSize: 13,
  },
});

export default InputField;
