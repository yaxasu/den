import { formatDistanceToNowStrict, parseISO, format } from "date-fns";

export const formatCommentTime = (isoDate: string) => {
  const date = parseISO(isoDate);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 10) return "just now";
  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;

  const isSameYear = date.getFullYear() === now.getFullYear();
  return format(date, isSameYear ? "MMM d" : "MMM d, yyyy");
};
