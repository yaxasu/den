// src/schema/index.ts

export interface Profile {
    id: string;
    email: string;
    username?: string;
    full_name?: string;
    birthday?: string;
    avatar_url?: string;
    bio?: string;
    created_at?: string;
  }
  
  export interface Post {
    id: string;
    user_id: string;
    caption: string;
    media_url?: string;
    media_type?: string;
    created_at?: string;
    is_paid?: boolean;
    updated_at?: string;
    thumbnail_url?: string;
    status?: string;
    media_metadata?: any;
    image_id?: string
  }


export type PostWithUser = Post & {
  user: Profile;
};
  
  export interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    comment_text: string;
    parent_comment_id?: string | null;
    created_at?: string;
    updated_at?: string;
    user: {
      id: string;
      username: string;
      avatar_url: string | null;
    };
  }
  
  export interface Like {
    post_id: string;
    user_id: string;
    created_at?: string;
  }
  
  export interface MediaItem {
    uri: string;
    type: "image" | "video";
    id?: string
  }
  
  export interface PostPayload {
    userId: string;
    caption: string;
    media: MediaItem;
  }
  
  export interface Follow {
    follower_id: string;
    following_id: string;
    created_at?: string;
  }

  export interface Interactions {
    id: string,
    userId: string,
    type: string,
    postId?: string,
    target_user_id?: string,
    metadat?: object,
    created_at: string,
    direction: string
  }

  export interface Conversation {
    id: string;
    participant_ids: string[];
    created_at: string;
  }
  
  export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    message_text: string;
    created_at: string;
    sender?: Profile;
  }

  export interface ConversationRow {
    id: string;
    participant_ids: string[];
    created_at: string;
    other_user: {
      id: string;
      full_name?: string;
      username?: string;
      avatar_url?: string;
    };
    last_message_text?: string;
    last_message_created_at?: string;
  }