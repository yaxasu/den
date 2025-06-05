// KeyedReload.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

const ReloadContext = createContext<() => void>(() => {});
export const useReload = () => useContext(ReloadContext);

export function KeyedReload({ children }: { children: ReactNode }) {
  const [key, setKey] = useState(0);
  const reload = useCallback(() => setKey(k => k + 1), []);
  return (
    <ReloadContext.Provider value={reload}>
      <React.Fragment key={key}>{children}</React.Fragment>
    </ReloadContext.Provider>
  );
}