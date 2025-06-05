import { useCallback, useRef } from "react";

export function useDebouncedCallback(callback: (...args: any[]) => void, delay: number) {
  const lastCalled = useRef(0);
  return useCallback((...args: any[]) => {
    const now = Date.now();
    if (now - lastCalled.current > delay) {
      lastCalled.current = now;
      callback(...args);
    }
  }, [callback, delay]);
}