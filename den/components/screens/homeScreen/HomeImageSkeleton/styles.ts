import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  profilePressable: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerTextContainer: {
    justifyContent: "center",
  },
  username: {
    fontSize: 16,
    fontWeight: "700",
  },
  usernamePlaceholder: {
    width: 100,
    height: 14,
    borderRadius: 4,
  },

  mediaWrapper: {
    width: "100%",
    aspectRatio: 4 / 5,
    marginVertical: 8,
    overflow: "hidden",
  },
  mediaPlaceholder: {
    width: "100%",
    height: "100%",
  },

  footer: {
    paddingHorizontal: 8,
  },
  engagementBar: {},
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  captionWrapper: {
    marginTop: 10,
    position: "relative",
  },
  captionText: {
    fontSize: 14,
  },
  readMoreButton: {
    marginTop: 4,
  },
  menuButton: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Transparent Modal Styles */
  modalWrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContainer: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  deleteButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
  fallbackCenter: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0", // optional, can match your theme
  },
});
