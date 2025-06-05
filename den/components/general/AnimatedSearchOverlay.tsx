// components/general/AnimatedSearchOverlay.tsx
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Animated,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Profile } from "@/lib/schema";
import Avatar from "./Avatar";
import { useTheme } from "@/lib/contexts/ThemeProvider";

type Props = {
  query: string;
  setQuery: (val: string) => void;
  results: Profile[];
  loading: boolean;
  onClose: () => void;
  onItemPress: (id: string) => void;
};

export default function AnimatedSearchOverlay({
  query,
  setQuery,
  results,
  loading,
  onClose,
  onItemPress,
}: Props) {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background, zIndex: 1000 }]}>
      {/* Back Button */}
      <TouchableOpacity onPress={onClose} style={styles.backButton}>
        <Ionicons name="chevron-back" size={28} color={theme.text} />
      </TouchableOpacity>

      {/* Animated Search Input */}
      <Animated.View
        style={[
          styles.searchContainer,
          {
            backgroundColor: theme.cardBackground,
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            autoFocus
            placeholder="Search"
            placeholderTextColor={theme.subText}
            value={query}
            onChangeText={setQuery}
            style={[styles.input, { color: theme.text }]}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} style={{ padding: 4 }}>
              <Ionicons name="close" size={18} color={theme.subText} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              Keyboard.dismiss();
              onItemPress(item.id);
            }}
            style={styles.resultRow}
          >
            <Avatar
              uri={item.avatar_url ?? null}
              fallbackText={item.full_name ?? item.username ?? "User"}
              size={44}
              theme={theme}
            />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.name, { color: theme.text }]}>{item.full_name ?? "Unnamed"}</Text>
              <Text style={[styles.username, { color: theme.subText }]}>@{item.username ?? "unknown"}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 20, paddingTop: 80 }}
        ListEmptyComponent={
          !loading && results.length === 0 ? (
            <Text style={{ color: theme.subText, textAlign: "center", marginTop: 40 }}>
              No results found.
            </Text>
          ) : null
        }
        
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    zIndex: 10,
  },
  searchContainer: {
    marginTop: 50,
    marginHorizontal: 56,
    borderRadius: 10,
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 12,
    zIndex: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  username: {
    fontSize: 14,
  },
});
