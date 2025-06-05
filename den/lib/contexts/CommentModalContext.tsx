// contexts/CommentModalContext.tsx
import React, { createContext, useContext, useState, useCallback } from "react";
import CommentModal from "@/components/general/CommentModal";

type CommentModalContextType = {
  open: (postId: string) => void;
  close: () => void;
};

const CommentModalContext = createContext<CommentModalContextType | undefined>(undefined);

export const useCommentModal = () => {
  const context = useContext(CommentModalContext);
  if (!context) {
    throw new Error("useCommentModal must be used within a CommentModalProvider");
  }
  return context;
};

export const CommentModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [postId, setPostId] = useState<string | null>(null);

  const open = useCallback((id: string) => {
    setPostId(id);
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <CommentModalContext.Provider value={{ open, close }}>
      {children}
      <CommentModal visible={visible} onDismiss={close} postId={postId} />
    </CommentModalContext.Provider>
  );
};
