import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/contexts/ThemeProvider";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSendMessage } from "@/lib/hooks/useSendMessage";
import { usePaginatedMessages } from "@/lib/hooks/usePaginatedMessages";
import { useRealtimeMessages } from "@/lib/hooks/useRealtimeMessages";
import { useAuth } from "@/lib/contexts/AuthContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import calendar from "dayjs/plugin/calendar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import { useDebouncedCallback } from "@/lib/hooks/useDebouncedCallback";

dayjs.extend(relativeTime);
dayjs.extend(calendar);

const HEADER_HEIGHT = 90;
const HEADER_PADDING_TOP = 45;

const ChatScreen = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { conversationId, username, userId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [messageText, setMessageText] = useState("");
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const listRef = useRef<FlashList<any>>(null);
  const hasScrolledInitially = useRef(false);

  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();

  const { data, fetchNextPage, isFetchingNextPage } = usePaginatedMessages(
    conversationId as string
  );

  const { mutate: sendMessage } = useSendMessage(
    conversationId as string,
    user?.id as string
  );

  useRealtimeMessages(conversationId as string);

  const messages = data?.pages.flat() ?? [];

  const handleSend = () => {
    if (!messageText.trim()) return;
    sendMessage(messageText.trim());
    setMessageText("");

    setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
      setShowScrollToBottom(false);
    }, 60);
  };

  const debouncedPush = useDebouncedCallback(
    (destination: Parameters<typeof router.push>[0]) => {
      router.push(destination);
    },
    500
  );

  const inputAnimatedStyle = useAnimatedStyle(() => {
    const extraOffset = -20;
    return {
      transform: [
        {
          translateY: withTiming(
            keyboardHeight.value === 0 ? extraOffset : keyboardHeight.value,
            { duration: 180 }
          ),
        },
      ],
    };
  });

  const listAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(keyboardHeight.value, { duration: 180 }),
        },
      ],
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.background,
            height: HEADER_HEIGHT,
            paddingTop: HEADER_PADDING_TOP,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.usernameWrapper}>
          <TouchableOpacity
            onPress={() => {
              if (userId) {
                debouncedPush({
                  pathname: "/(userProfile)",
                  params: { userProfileId: userId as string },
                });
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.headerText, { color: theme.text }]}>
              @{username}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rightSpacer} />
      </View>

      {/* Message List */}
      <Animated.View style={[{ flex: 1 }, listAnimatedStyle]}>
        <FlashList
          ref={listRef}
          data={messages}
          inverted
          estimatedItemSize={60}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingTop: 50,
            paddingBottom: 100 + insets.bottom,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const next = messages[index + 1];
            const showTimestamp =
              !next ||
              dayjs(item.created_at).diff(dayjs(next.created_at), "minute") > 5;

            return (
              <View>
                {showTimestamp && (
                  <Text style={[styles.timeSeparator, { color: theme.subText }]}>
                    {dayjs(item.created_at).calendar(null, {
                      sameDay: "[Today at] h:mm A",
                      lastDay: "[Yesterday at] h:mm A",
                      lastWeek: "dddd [at] h:mm A",
                      sameElse: "MMM D, YYYY [at] h:mm A",
                    })}
                  </Text>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    {
                      alignSelf:
                        item.sender_id === user?.id ? "flex-end" : "flex-start",
                      backgroundColor:
                        item.sender_id === user?.id
                          ? theme.primary
                          : theme.subText,
                    },
                  ]}
                >
                  <Text style={{ color: "#fff" }}>{item.message_text}</Text>
                </View>
              </View>
            );
          }}
          onEndReached={() => {
            if (!isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          scrollEventThrottle={16}
          onScroll={({ nativeEvent }) => {
            const y = nativeEvent.contentOffset.y;
            setShowScrollToBottom(y > 100);
          }}
          onContentSizeChange={() => {
            if (!hasScrolledInitially.current && messages.length > 0) {
              listRef.current?.scrollToOffset({ offset: 0, animated: false });
              hasScrolledInitially.current = true;
            }
          }}
        />
      </Animated.View>

      {/* Scroll-To-Bottom Button */}
      {showScrollToBottom && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={[
            styles.floatingButtonAboveInput,
            { bottom: insets.bottom + 90 },
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              listRef.current?.scrollToOffset({ offset: 0, animated: true });
              setShowScrollToBottom(false);
            }}
            style={styles.scrollButtonTouchable}
          >
            <Ionicons name="chevron-down" size={24} color={theme.text} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Input Field */}
      <Animated.View style={[inputAnimatedStyle]}>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: theme.background,
              paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
            },
          ]}
        >
          <TextInput
            value={messageText}
            // scrollEnabled={false}
            onChangeText={setMessageText}
            placeholder="Type a message"
            placeholderTextColor={theme.subText}
            style={[
              styles.messageInput,
              {
                color: theme.text,
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={handleSend}
            style={styles.sendIconWrapper}
            disabled={!messageText.trim()}
          >
            <Ionicons
              name="arrow-up-circle"
              size={40}
              color={messageText.trim() ? theme.primary : theme.subText}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  usernameWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  rightSpacer: { width: 28 },
  timeSeparator: {
    fontSize: 12,
    textAlign: "center",
    marginVertical: 10,
  },
  messageBubble: {
    padding: 10,
    marginVertical: 4,
    marginHorizontal: 10,
    borderRadius: 14,
    maxWidth: "75%",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    maxHeight: 100,
  },
  sendIconWrapper: {
    marginLeft: 8,
    paddingBottom: 2,
  },
  floatingButtonAboveInput: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 10,
  },
  scrollButtonTouchable: {
    backgroundColor: "rgba(0,0,0,0.1)",
    padding: 8,
    borderRadius: 18,
  },
});

export default ChatScreen;
