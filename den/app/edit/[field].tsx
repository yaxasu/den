import BioEditForm from "@/components/editStuff/bio";
import CaptionEditForm from "@/components/editStuff/caption";
import NameEditForm from "@/components/editStuff/name";
import PictureEditForm from "@/components/editStuff/picture";
import UsernameEditForm from "@/components/editStuff/username";
import { useTheme } from "@/lib/contexts/ThemeProvider";
import { useLocalSearchParams } from "expo-router"; // or useRouter().query in Next.js
import { Text, View } from "react-native";

export default function Edit() {
  const { field, postId } = useLocalSearchParams();
  const { theme } = useTheme();

  const resolvedPostId = Array.isArray(postId) ? postId[0] : postId;

  return (
    <View
      style={{ paddingTop: 40, flex: 1, backgroundColor: theme.background }}
    >
      {field === "picture" && <PictureEditForm />}
      {field === "username" && <UsernameEditForm />}
      {field === "name" && <NameEditForm />}
      {field === "bio" && <BioEditForm />}
      {field === "caption" && typeof resolvedPostId === "string" && (
        <CaptionEditForm postId={resolvedPostId} />
      )}
    </View>
  );
}
