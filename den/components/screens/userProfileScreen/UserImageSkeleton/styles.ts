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
  avatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    marginRight: 10,
    justifyContent: "center",   // 👈 ensures vertical centering
    alignItems: "center",       // 👈 ensures horizontal centering
  },  
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  username: {
    fontSize: 16,
    fontWeight: "bold",
  },
  usernamePlaceholder: {
    width: 100,
    height: 10,
    borderRadius: 4,
  },
  mediaWrapper: {
    width: "100%",
    aspectRatio: 4 / 5,
    // aspectRatio: 1,
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
