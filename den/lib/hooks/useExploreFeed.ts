import { PostWithUser } from "@/lib/schema";
import { useInfiniteQuery } from "react-query";
import { getExploreFeedPosts } from "../services/post";

type ExplorePost = PostWithUser & {
  score: number;
  like_count: number;
  comment_count: number;
  is_liked: boolean;
};

export const useExploreFeed = (userId: string | undefined, limit = 10) => {
  const isValidUserId = !!userId && userId !== "undefined";

  return useInfiniteQuery<ExplorePost[]>({
    queryKey: ["exploreFeed", userId],
    queryFn: ({ pageParam = 1 }) =>
      getExploreFeedPosts({ userId, pageParam, limit }),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length < limit ? undefined : allPages.length + 1;
    },
    enabled: isValidUserId,
  });
};

// export const useExploreFeed = (userId?: string, limit = 10) => {
//   return useInfiniteQuery<ExplorePost[]>({
//     queryKey: ["exploreFeed"],
//     queryFn: ({ pageParam = 1 }) => getExploreFeedPosts({ pageParam, limit }),
//     getNextPageParam: (lastPage, allPages) => {
//       return lastPage.length < limit ? undefined : allPages.length + 1;
//     },
//     enabled: !!userId && userId !== "undefined",
//   });
// };
