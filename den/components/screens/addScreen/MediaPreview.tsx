import React from "react";
import { Image, StyleSheet } from "react-native";
import { Video, ResizeMode } from "expo-av";

interface MediaItem {
  uri: string;
  type: "image" | "video";
}

interface MediaPreviewProps {
  media: MediaItem[];
}

const MediaPreview: React.FC<MediaPreviewProps> = ({ media }) => {
  if (!media[0]) return null;

  return media[0].type === "image" ? (
    <Image source={{ uri: media[0].uri }} style={styles.singleMedia} />
  ) : (
    <Video
      source={{ uri: media[0].uri }}
      style={styles.singleMedia}
      resizeMode={ResizeMode.CONTAIN}
      shouldPlay
      isLooping
      useNativeControls
    />
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      paddingHorizontal: 16,
      borderBottomWidth: 1,
    },
    postButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
    },
    postButtonText: {
      fontWeight: "600",
    },
    contentContainer: {
      flexGrow: 1,
      paddingBottom: 16,
    },
    errorText: {
      textAlign: "center",
      margin: 8,
      fontWeight: "500",
    },
    mediaUploadContainer: {
      margin: 16,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      alignSelf: "center",
      width: "90%",
      position: "relative", // so the clear button can be absolutely positioned
    },
    uploadText: {
      marginTop: 8,
      fontSize: 16,
      fontWeight: "500",
    },
    singleMedia: {
      width: "100%",
      height: "100%",
      borderRadius: 12,
    },
    clearButton: {
      position: "absolute",
      top: 10,
      right: 10,
      zIndex: 10,
    },
    inputContainer: {
      marginHorizontal: 16,
      borderRadius: 12,
      padding: 16,
    },
    captionInput: {
      fontSize: 16,
      maxHeight: 200,
      paddingBottom: 20,
    },
    charCount: {
      position: "absolute",
      bottom: 8,
      right: 12,
      fontSize: 12,
    },
  });

export default MediaPreview;
