import { useEffect, useState, useRef } from "react";

export function useTypewriter(text: string, speed: number = 30) {
  const [displayText, setDisplayText] = useState("");
  const previousTextRef = useRef("");

  useEffect(() => {
    if (text.length === 0) {
      setDisplayText("");
      previousTextRef.current = "";
      return;
    }

    if (text === previousTextRef.current) {
      return;
    }

    const newText = text.slice(previousTextRef.current.length);
    const startIndex = previousTextRef.current.length;

    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < newText.length) {
        setDisplayText(text.slice(0, startIndex + currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    previousTextRef.current = text;

    return () => clearInterval(interval);
  }, [text, speed]);

  return displayText;
}
