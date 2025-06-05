import React, { createContext, useCallback, useContext, useState } from 'react';
import FloatingModal from '@/components/general/FloatingModal';

type Option = {
  text: string;
  onPress: () => void;
  destructive?: boolean;
  loading?: boolean;
};

interface FloatingModalContextType {
  showFloatingModal: (options: Option[], cancelText?: string) => void;
  hideFloatingModal: () => void;
}

const FloatingModalContext = createContext<FloatingModalContextType | undefined>(undefined);

export const useFloatingModal = () => {
  const context = useContext(FloatingModalContext);
  if (!context) throw new Error('useFloatingModal must be used within a FloatingModalProvider');
  return context;
};

export const FloatingModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [cancelText, setCancelText] = useState<string>('Cancel');

  const showFloatingModal = useCallback((opts: Option[], cancel = 'Cancel') => {
    setOptions(opts);
    setCancelText(cancel);
    setVisible(true);
  }, []);

  const hideFloatingModal = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <FloatingModalContext.Provider value={{ showFloatingModal, hideFloatingModal }}>
      {children}
      <FloatingModal
        visible={visible}
        onDismiss={hideFloatingModal}
        options={options}
        cancelText={cancelText}
      />
    </FloatingModalContext.Provider>
  );
};
