// hooks/useFloatingOptionsModal.ts
import { useFloatingModal } from "@/lib/contexts/FloatingModalContext";
import { useCallback } from 'react';

type Option = {
  text: string;
  onPress: () => void;
  destructive?: boolean;
  loading?: boolean;
};

export const useFloatingOptionsModal = () => {
  const { showFloatingModal } = useFloatingModal();

  const openOptionsModal = useCallback(
    (options: Option[], cancelText: string = 'Cancel') => {
      showFloatingModal(options, cancelText);
    },
    [showFloatingModal]
  );

  return { openOptionsModal };
};
