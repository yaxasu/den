import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { styles } from "./styles";
import { useCommentModal } from "@/lib/contexts/CommentModalContext";

interface PostFooterProps {
  item: any;
  showFullCaption: boolean;
  toggleCaption: () => void;
  needsTruncation: boolean;
  setNeedsTruncation: (val: boolean) => void;
  likeMutation: any;
  theme: any;
}

const PostFooter: React.FC<PostFooterProps> = ({
  item,
  showFullCaption,
  toggleCaption,
  needsTruncation,
  setNeedsTruncation,
  likeMutation,
  theme,
}) => {
  const { open } = useCommentModal()

  return (
    <View style={styles.footer}>
      {/* Like / Comments / Share Row */}
      <View style={styles.engagementBar}>
        <View style={styles.actionsRow}>
          {/* Like */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              likeMutation.mutate(item?.id);
            }}
            disabled={likeMutation.isLoading}
          >
            <Ionicons
              name={item.is_liked ? "heart" : "heart-outline"}
              size={30}
              color={item.is_liked ? "red" : theme.text}
              style={{ marginRight: 6 }}
            />
          </TouchableOpacity>

          <Text style={{ color: theme.text, marginRight: 16 }}>
            {item.like_count ?? 0}
          </Text>

          {/* Comments */}
          <TouchableOpacity
            onPress={() => {
              // Provide immediate feedback
              // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Call directly without debounce
              open(item.id);
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="chatbubble-outline"
              size={26}
              color={theme.text}
              style={{ marginRight: 6 }}
            />
          </TouchableOpacity>

          <Text style={{ color: theme.text, marginRight: 16 }}>
            {item.comment_count ?? 0}
          </Text>
        </View>
      </View>

      {/* Caption Text */}
      {item.caption && (
        <View style={styles.captionWrapper}>
          {/* Hidden text to detect line count */}
          <Text
            style={{ position: "absolute", opacity: 0 }}
            onTextLayout={({ nativeEvent }) => {
              if (nativeEvent.lines.length > 2) {
                setNeedsTruncation(true);
              }
            }}
          >
            {item.caption}
          </Text>

          <Text
            style={[styles.captionText, { color: theme.text }]}
            numberOfLines={showFullCaption ? undefined : 2}
          >
            {item.caption}
          </Text>

          {needsTruncation && (
            <TouchableOpacity
              style={styles.readMoreButton}
              onPress={toggleCaption}
            >
              <Text style={{ color: theme.primary, fontWeight: "600" }}>
                {showFullCaption ? "Show less" : "Read more"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default PostFooter;
