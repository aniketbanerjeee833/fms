import { useRef, useCallback } from "react";

export default function useListRestore(key, enabled = true, defaultCount = 10) {
  const initial = useRef(null);

  if (initial.current === null) {
    if (enabled) {
      initial.current = {
        count: Number(sessionStorage.getItem(`${key}:count`)) || defaultCount,
        offset: Number(sessionStorage.getItem(`${key}:offset`)) || 0,
      };
    } else {
      // fresh visit: start at the top and forget the old position
      initial.current = { count: defaultCount, offset: 0 };
      sessionStorage.setItem(`${key}:count`, String(defaultCount));
      sessionStorage.setItem(`${key}:offset`, "0");
    }
  }

  const saveCount = useCallback((n) => {
    if (n > 0) sessionStorage.setItem(`${key}:count`, String(n));
  }, [key]);

  const saveOffset = useCallback((o) => {
    sessionStorage.setItem(`${key}:offset`, String(o));
  }, [key]);

  const reset = useCallback(() => {
    initial.current = { count: defaultCount, offset: 0 };
    sessionStorage.setItem(`${key}:count`, String(defaultCount));
    sessionStorage.setItem(`${key}:offset`, "0");
  }, [key, defaultCount]);

  return { initial, saveCount, saveOffset, reset };
}