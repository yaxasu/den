import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Platform,
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions,
  Easing, // ✅ Correct Easing import
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/contexts/ThemeProvider';

interface Option {
  text: string;
  onPress: () => void;
  destructive?: boolean;
  loading?: boolean;
}

interface FloatingModalProps {
  visible: boolean;
  onDismiss: () => void;
  options?: Option[];
  cancelText?: string;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

const FloatingModal: React.FC<FloatingModalProps> = ({
  visible,
  onDismiss,
  options = [],
  cancelText = 'Cancel',
}) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(visible);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  const styles = useMemo(() => createStyles(theme), [theme]);

  const triggerHaptic = () => {
    Haptics.selectionAsync();
  };

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          speed: 16,
          bounciness: 5,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          speed: 18,
          bounciness: 4,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 120,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.96,
          duration: 200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  const handlePress = (option: Option) => {
    if (option.loading) return;

    const run = () => {
      triggerHaptic();
      option.onPress();
      onDismiss();
    };

    if (option.destructive) {
      Alert.alert('Are you sure?', 'This action cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', onPress: run },
      ]);
    } else {
      run();
    }
  };

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <View style={[styles.panel, styles.optionsContainer]}>
          {options.map((option, index) => (
            <Pressable
              key={index}
              onPress={() => handlePress(option)}
              disabled={option.loading}
              android_ripple={{ color: theme.overlay }}
              style={({ pressed }) => [
                styles.optionButton,
                pressed && styles.optionButtonPressed,
                index === options.length - 1 && styles.lastOption,
              ]}
            >
              {option.loading ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Text
                  style={[
                    styles.optionText,
                    option.destructive && styles.destructiveText,
                  ]}
                >
                  {option.text}
                </Text>
              )}
            </Pressable>
          ))}
        </View>

        <View style={[styles.panel, styles.cancelContainer]}>
          <Pressable
            onPress={() => {
              triggerHaptic();
              onDismiss();
            }}
            android_ripple={{ color: theme.overlay }}
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && styles.optionButtonPressed,
            ]}
          >
            <Text style={styles.cancelText}>{cancelText}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.overlay,
    },
    container: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      paddingHorizontal: 12,
      paddingBottom: Platform.select({ ios: 34, android: 24 }),
    },
    panel: {
      backgroundColor: theme.modalBackground,
      borderRadius: 14,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        android: { elevation: 6 },
      }),
    },
    optionsContainer: {
      marginBottom: 8,
      overflow: 'hidden',
    },
    optionButton: {
      padding: 16,
      alignItems: 'center',
    },
    optionButtonPressed: {
      backgroundColor: 'rgba(0,0,0,0.08)',
    },
    lastOption: {
      borderBottomWidth: 0,
    },
    optionText: {
      fontSize: 17,
      color: theme.text,
      fontWeight: '400',
      fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
    },
    destructiveText: {
      color: theme.primary,
    },
    cancelContainer: {
      borderRadius: 14,
      overflow: 'hidden',
    },
    cancelButton: {
      padding: 16,
      alignItems: 'center',
    },
    cancelText: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.primary,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
    },
  });

export default FloatingModal;
