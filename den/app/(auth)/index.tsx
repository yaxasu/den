import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Animated,
  Alert,
  ActivityIndicator,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { useTheme } from "@/lib/contexts/ThemeProvider";
import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback";
import { useAuth } from "@/lib/contexts/AuthContext";
import { validateEmail } from "@/lib/services/auth";
import InputField from "@/components/screens/authScreen/InputField";
import Logo from '@/assets/vectors/icon_vector.svg'

const LoginScreen = React.memo(() => {
  const { theme } = useTheme();
  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [invalidPassword, setInvalidPassword] = useState(false);

  const translateYAnim = useRef(new Animated.Value(0)).current;

  const debouncedPush = useDebouncedCallback((path) => {
    router.push(path);
  }, 500);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () =>
      Animated.timing(translateYAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start()
    );

    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start()
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSignIn = useCallback(async () => {
    Keyboard.dismiss();

    const emailValid = validateEmail(email.trim());
    const passwordValid = password.length >= 6;

    setInvalidEmail(!emailValid);
    setInvalidPassword(!passwordValid);

    if (!emailValid || !passwordValid) return;

    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);

    if (!result.success) {
      setInvalidPassword(true);
      Alert.alert("Login Failed", "Invalid email or password. Please try again.");
    } else {
      debouncedPush("/(tabs)");
    }
  }, [email, password, signIn, debouncedPush]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} onLayout={SplashScreen.hideAsync}>
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: 50 }]}>
        <Logo width={150} height={150} style={[styles.logo]} color={theme.subText}/>
        <Animated.View style={[styles.formContainer, { transform: [{ translateY: translateYAnim }] }]}>
          <InputField
            value={email}
            setValue={setEmail}
            placeholder="Email"
            isInvalid={invalidEmail}
          />
          <InputField
            value={password}
            setValue={setPassword}
            placeholder="Password"
            isPassword
            isInvalid={invalidPassword}
            togglePasswordVisibility={() => setShowPassword((prev) => !prev)}
            showPassword={showPassword}
          />

          <TouchableOpacity
            style={[
              styles.loginButton,
              {
                backgroundColor: loading ? theme.subText : theme.primary,
                opacity: loading ? 0.7 : 1,
              },
            ]}
            onPress={handleSignIn}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {}}>
            <Text style={[styles.forgotText, { color: theme.primary }]}>Forgot Password?</Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={[
            styles.registerButton,
            { borderColor: theme.primary, backgroundColor: theme.background },
          ]}
          onPress={() => debouncedPush("/(auth)/EnterEmail")}
          activeOpacity={0.8}
        >
          <Text style={[styles.registerText, { color: theme.text }]}>Register New User</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  formContainer: {
    width: "90%",
    alignItems: "center",
    marginTop: 175,
  },
  loginButton: {
    width: "100%",
    padding: 14,
    borderRadius: 25,
    alignItems: "center",
    marginVertical: 10,
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotText: {
    marginTop: 5,
    fontSize: 14,
  },
  registerButton: {
    position: "absolute",
    bottom: 40,
    width: "90%",
    borderWidth: 1,
    padding: 14,
    borderRadius: 25,
    alignItems: "center",
  },
  registerText: {
    fontSize: 16,
    fontWeight: "500",
  },
});

export default LoginScreen;
