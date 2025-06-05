import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TextInput,
  Keyboard,
  Pressable,
  Dimensions,
  Alert,
  TouchableWithoutFeedback,
  UIManager,
} from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  withSpring,
  withDecay,
  useAnimatedStyle,
  runOnJS,
  runOnUI,
  useAnimatedGestureHandler,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import {
  PanGestureHandler,
  GestureHandlerRootView,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import { useTheme } from "@/lib/contexts/ThemeProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePaginatedComments } from "@/lib/hooks/usePaginatedComments";
import { useAddComment } from "@/lib/hooks/useAddComment";
import { useDeleteComment } from "@/lib/hooks/useDeleteComment";
import { formatCommentTime } from "@/lib/utilities/formatCommentTime";
import { useAuth } from "@/lib/contexts/AuthContext";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Ionicons } from "@expo/vector-icons";
import Avatar from "./Avatar";
import { Comment } from "@/lib/schema";
import { FlashList } from "@shopify/flash-list";
// NEW: Import the hook for animated keyboard values
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SWIPE_THRESHOLD = 150;
const MAX_MODAL_HEIGHT = SCREEN_HEIGHT * 0.7;

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CommentModalProps {
  visible: boolean;
  onDismiss: () => void;
  postId: string | null;
}

const CommentItem = React.memo(
  ({
    item,
    theme,
    isDeleting,
    userId,
    onDelete,
  }: {
    item: Comment;
    theme: ReturnType<typeof useTheme>["theme"];
    isDeleting: boolean;
    userId: string | null;
    onDelete: (id: string) => void;
  }) => {
    const isOwnComment = item.user_id === userId;
    const timeAgo = item.created_at ? formatCommentTime(item.created_at) : "";

    return (
      <Pressable
        onLongPress={() => isOwnComment && !isDeleting && onDelete(item.id)}
        delayLongPress={300}
        android_ripple={{ color: theme.text }}
        style={({ pressed }) => [
          styles.commentRow,
          pressed && { opacity: 0.8 },
        ]}
      >
        <View style={styles.avatarWrapper}>
          <Avatar
            uri={item.user?.avatar_url ?? null}
            fallbackText={item.user?.username?.charAt(0).toUpperCase() ?? "?"}
            size={40}
            theme={theme}
          />
        </View>
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={[styles.username, { color: theme.text }]}>
              {item.user?.username}
            </Text>
            <View style={styles.commentMeta}>
              <Text style={[styles.timestamp, { color: theme.subText }]}>
                {timeAgo}
              </Text>
            </View>
          </View>
          <Text style={[styles.commentText, { color: theme.text }]}>
            {item.comment_text}
          </Text>
        </View>
      </Pressable>
    );
  }
);

const CommentModal: React.FC<CommentModalProps> = ({
  visible,
  onDismiss,
  postId,
}) => {
  const { theme, themeName } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [isModalShown, setIsModalShown] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlashList<Comment>>(null);

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  // NEW: Get the animated keyboard height
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();

  const fallbackPostId = postId ?? "__placeholder__";

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    usePaginatedComments(fallbackPostId);
    
  const { mutate: submitComment, isLoading: isAdding } =
  useAddComment(fallbackPostId);

  const { mutate: deleteComment, isLoading: isDeleting } =
    useDeleteComment(fallbackPostId);

  const comments = useMemo(() => {
    const all = data?.pages.flat() ?? [];
    const dedupedMap = new Map<string, Comment>();

    for (const comment of all) {
      if (comment.id.startsWith("temp-")) {
        if (
          ![...dedupedMap.values()].some(
            (c) =>
              c.user_id === comment.user_id &&
              c.comment_text.trim() === comment.comment_text.trim() &&
              !c.id.startsWith("temp-")
          )
        ) {
          dedupedMap.set(comment.id, comment);
        }
      } else {
        dedupedMap.set(comment.id, comment);
      }
    }

    return Array.from(dedupedMap.values());
  }, [data]);

  useEffect(() => {
    const open = () => {
      "worklet";
      backdropOpacity.value = withTiming(1, { duration: 180 });
      translateY.value = withSpring(0, {
        damping: 18,       // was 22
        stiffness: 160,    // was 140
        mass: 0.6,
        overshootClamping: true,
      });
    };

    const close = () => {
      "worklet";
      backdropOpacity.value = withTiming(0, { duration: 150 });
      translateY.value = withSpring(
        SCREEN_HEIGHT,
        {
          damping: 24,      // was 30
          stiffness: 160,   // was 150
          mass: 0.6,
        },
        (isFinished) => {
          if (isFinished) runOnJS(onDismiss)();
        }
      );
    };

    if (visible) {
      setIsModalShown(true);
      runOnUI(open)();
      setTimeout(() => {
        setText("");
        inputRef.current?.clear();
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      }, 350);
    } else {
      runOnUI(close)();
      setTimeout(() => setIsModalShown(false), 350);
    }
  }, [visible]);

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startY: number }
  >({
    onStart: (_, ctx) => {
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      translateY.value = Math.max(0, ctx.startY + event.translationY);
    },
    onEnd: (event) => {
      const shouldDismiss =
        event.translationY > SWIPE_THRESHOLD || event.velocityY > 800;

      if (shouldDismiss) {
        translateY.value = withDecay({
          velocity: event.velocityY,
          clamp: [0, SCREEN_HEIGHT],
        });
        backdropOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(onDismiss)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 120 });
      }
    },
  });

  // Modal container animated style (for open/close only)
  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    borderTopLeftRadius: interpolate(
      translateY.value,
      [0, SCREEN_HEIGHT],
      [20, 40],
      Extrapolate.CLAMP
    ),
    borderTopRightRadius: interpolate(
      translateY.value,
      [0, SCREEN_HEIGHT],
      [20, 40],
      Extrapolate.CLAMP
    ),
    zIndex: 1,
  }));

  // NEW: Animate only the input container to “float” with the keyboard
  const inputAnimatedStyle = useAnimatedStyle(() => {
    const extraOffset = -20; // shift upward by 20px in neutral position
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
  

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: visible ? "auto" : "none",
  }));

  const dismissKeyboard = () => Keyboard.dismiss();

  const handleAddComment = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !user?.id || !postId || isAdding) return;

    setText("");
    inputRef.current?.clear();

    submitComment(
      { postId, userId: user.id, comment_text: trimmed },
      {
        onError: () => {
          setText(trimmed);
          inputRef.current?.setNativeProps({ text: trimmed });
        },
      }
    );

    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100);
  }, [text, user, postId, isAdding, submitComment]);

  const confirmDelete = useCallback(
    (commentId: string) => {
      Alert.alert("Delete Comment", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteComment(commentId),
        },
      ]);
    },
    [deleteComment]
  );

  const renderCommentItem = useCallback(
    ({ item }: { item: Comment }) => (
      <CommentItem
        item={item}
        theme={theme}
        isDeleting={isDeleting}
        userId={user?.id ?? null}
        onDelete={confirmDelete}
      />
    ),
    [theme, isDeleting, user?.id, confirmDelete]
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage]);

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFill}>
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <Animated.View
          style={[
            styles.backdrop,
            backdropAnimatedStyle,
            { backgroundColor: theme.overlay },
          ]}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.modalContainer,
          modalAnimatedStyle,
          {
            backgroundColor: theme.modalBackground,
            maxHeight: MAX_MODAL_HEIGHT,
          },
        ]}
      >
        <PanGestureHandler
          onGestureEvent={gestureHandler}
          activeOffsetY={10}
          enabled={visible}
        >
          <Animated.View style={styles.handleWrapper}>
            <View style={[styles.handle, { backgroundColor: theme.subText }]} />
          </Animated.View>
        </PanGestureHandler>

        {isModalShown && (
          <FlashList
            ref={flatListRef}
            key={themeName}
            contentContainerStyle={styles.commentList}
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={renderCommentItem}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.75}
            estimatedItemSize={64}
            keyboardDismissMode="interactive"
            extraData={comments.map((c) => c.id)}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !isLoading ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={48}
                    color={theme.subText}
                  />
                  <Text style={[styles.emptyText, { color: theme.subText }]}>
                    No comments yet. Be the first!
                  </Text>
                </View>
              ) : null
            }
          />
        )}

        {/* 
          Remove the KeyboardAvoidingView.
          Instead, wrap the input container in an Animated.View that shifts upward based on the keyboard.
        */}
        <Animated.View style={[inputAnimatedStyle]}>
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: theme.modalBackground },
            ]}
          >
            <TextInput
              ref={inputRef}
              placeholder="Add a comment"
              placeholderTextColor={theme.subText}
              style={[
                styles.input,
                { color: theme.text, borderColor: theme.border },
              ]}
              value={text}
              onChangeText={setText}
              onSubmitEditing={handleAddComment}
              editable={!isAdding}
              multiline={false}
              returnKeyType="send"
              maxLength={500}
            />
            <Pressable
              onPress={handleAddComment}
              disabled={!text.trim() || isAdding}
            >
              <Ionicons
                name="arrow-up-circle"
                size={46}
                color={text.trim() && !isAdding ? theme.primary : theme.subText}
                style={styles.sendIcon}
              />
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: MAX_MODAL_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  handleWrapper: { alignItems: "center", paddingVertical: 10 },
  handle: { width: 40, height: 5, borderRadius: 3 },
  commentList: { paddingHorizontal: 16, paddingBottom: 12 },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  avatarWrapper: { marginRight: 12 },
  commentContent: { flex: 1 },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  username: { fontWeight: "600", fontSize: 14, marginRight: 8 },
  commentText: { fontSize: 15, lineHeight: 20, paddingTop: 2 },
  timestamp: { fontSize: 12, opacity: 0.7 },
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  emptyState: {
    paddingTop: 24,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  emptyText: { marginTop: 16, fontSize: 16 },
  commentMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 90,
  },

  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    height: 45,
  },

  sendIcon: {
    marginHorizontal: 4,
  },
});

export default CommentModal;
