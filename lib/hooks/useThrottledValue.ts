import { useRef, useState, useEffect } from "react";

export function useThrottledValue<T>(value: T, intervalMs: number = 80): T {
  const [throttled, setThrottled] = useState(value);
  const lastUpdated = useRef(Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const now = Date.now();
    const elapsed = now - lastUpdated.current;

    if (elapsed >= intervalMs) {
      setThrottled(value);
      lastUpdated.current = now;
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setThrottled(value);
        lastUpdated.current = Date.now();
      }, intervalMs - elapsed);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, intervalMs]);

  return throttled;
}
