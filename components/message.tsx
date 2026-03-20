"use client";

import { UIMessage, isTextUIPart } from "ai";
import { BotIcon, UserIcon } from "lucide-react";
import Markdown, { Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ToolOutput } from "./tool-output";
import { ToolResult } from "../lib/types";
import { useThrottledValue } from "../lib/hooks/useThrottledValue";
import { memo, useMemo } from "react";

const markdownComponents: Partial<Components> = {
  code(props) {
    const { children, className, ...rest } = props;
    const match = /language-(\w+)/.exec(className || "");
    return match ? (
      <SyntaxHighlighter
        PreTag="div"
        className="border text-sm !rounded-xl"
        language={match[1]}
        style={oneLight}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    ) : (
      <code {...rest} className={className}>
        {children}
      </code>
    );
  },
};

export const MessageComponent = memo(function MessageComponent({
  message,
  isStreaming,
}: {
  message: UIMessage;
  isStreaming: boolean;
}) {
  const parts = message.parts || [];
  const textParts = parts.filter(isTextUIPart);
  const content = textParts.map((part) => part.text).join("");
  const isUser = message.role === "user";

  const throttledContent = useThrottledValue(content, isStreaming ? 100 : 0);
  const displayContent = isStreaming ? throttledContent : content;

  const renderedMarkdown = useMemo(
    () => <Markdown components={markdownComponents}>{displayContent}</Markdown>,
    [displayContent]
  );

  return (
    <div className="px-4">
      <div
        className={`flex gap-4 mx-auto w-full max-w-2xl py-2 ${
          isUser ? "flex-row-reverse" : ""
        }`}
      >
        <div className="h-fit rounded-md flex items-center justify-center">
          {isUser ? (
            <UserIcon className="w-6 h-6 text-primary" />
          ) : (
            <BotIcon className="mt-1 w-6 h-6 text-primary" />
          )}
        </div>
        <div
          className={`overflow-hidden flex-1 flex flex-col gap-2 ${
            isUser ? "items-end max-w-md" : ""
          }`}
        >
          {renderedMarkdown}
          <ToolOutput result={message.parts as unknown as ToolResult} />
        </div>
      </div>
    </div>
  );
});
