"use client";

import { RepoBanner } from "@/components/repo-banner";
import { useChat } from "@ai-sdk/react";
import { MessageComponent } from "@/components/message";
import { FileText, SendHorizonal, PlusIcon, X } from "lucide-react";
import { extractCodeFromText } from "@/lib/code";
import Logo from "@/components/logo";
import modelsList from "@/lib/models.json";
import { LLMModelConfig } from "@/lib/model";
import { LLMPicker } from "@/components/llm-picker";
import { LLMSettings } from "@/components/llm-settings";
import { useLocalStorage } from "usehooks-ts";
import { preProcessFile } from "@/lib/preprocess";
import { FileUIPart, UIMessage } from "ai";
import { toast } from "sonner";
import { memo, useCallback, useEffect, useRef, useState } from "react";

const EXAMPLE_MESSAGES = [
  "Plot today's weather temperature chart",
  "Plot Bitcoin price chart for last 30 days",
  "Create a pie chart of global population by country",
];

const STREAM_RENDER_THROTTLE_MS = 80;

const MemoizedMessage = memo(function MemoizedMessage({
  message,
  isStreaming,
}: {
  message: UIMessage;
  isStreaming: boolean;
}) {
  return <MessageComponent message={message} isStreaming={isStreaming} />;
});

function useThrottledMessages(messages: UIMessage[], delayMs: number) {
  const [throttledMessages, setThrottledMessages] = useState(messages);
  const lastUpdateRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestMessagesRef = useRef(messages);

  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (delayMs <= 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      lastUpdateRef.current = Date.now();
      setThrottledMessages(messages);
      return;
    }

    const runUpdate = () => {
      lastUpdateRef.current = Date.now();
      timeoutRef.current = null;
      setThrottledMessages(latestMessagesRef.current);
    };

    const elapsed = Date.now() - lastUpdateRef.current;
    const remaining = Math.max(delayMs - elapsed, 0);

    if (remaining === 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      runUpdate();
      return;
    }

    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(runUpdate, remaining);
    }
  }, [messages, delayMs]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledMessages;
}

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [input, setInput] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  const [languageModel, setLanguageModel] = useLocalStorage<LLMModelConfig>(
    "languageModel",
    {
      model: "GPT-5.2",
    },
    {
      initializeWithValue: false,
    }
  );

  const currentModel = modelsList.models.find(
    (model) => model.id === languageModel.model
  );

  function handleLanguageModelChange(e: LLMModelConfig) {
    setLanguageModel({ ...languageModel, ...e });
  }

  const { messages, sendMessage, setMessages, status } = useChat({
    onFinish: async (options) => {
      const message = options.message;
      const textContent = message.parts.find((p) => p.type === "text") as
        | { type: "text"; text: string }
        | undefined;
      const code = textContent ? extractCodeFromText(textContent.text) : null;
      if (code) {
        const formData = new FormData();
        formData.append("code", code);

        if (languageModel.agbApiKey) {
          formData.append("agbApiKey", languageModel.agbApiKey);
        }

        for (const file of files) {
          formData.append(`file_${file.name}`, file);
        }

        const response = await fetch("/api/sandbox", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        const sandboxMessage: UIMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          parts: [
            {
              type: "text",
              text: "Sandbox execution result",
            },
            {
              toolName: "runCode",
              result: {
                results: result.results,
                ...(result.error
                  ? {
                      error: {
                        name: "SandboxError",
                        traceback: result.error,
                      },
                    }
                  : {}),
              },
            },
          ] as UIMessage["parts"],
        };

        setMessages((prev) => [...prev, sandboxMessage]);

        console.log("Result:", result);
        setFiles([]);
      }

      setInput("");
    },
  });

  const isLoading = status === "streaming" || status === "submitted";
  const hasAgbApiKey = Boolean(languageModel?.agbApiKey?.trim());
  const hasLlmApiKey = Boolean(languageModel?.apiKey?.trim());
  const hasMissingRequiredKeys =
    (hasAgbApiKey || hasLlmApiKey) && (!hasAgbApiKey || !hasLlmApiKey);
  const renderedMessages = useThrottledMessages(
    messages as UIMessage[],
    isLoading ? STREAM_RENDER_THROTTLE_MS : 0
  );

  const handleMessagesScroll = useCallback(() => {
    const messagesElement = messagesContainerRef.current;
    if (!messagesElement) return;

    const distanceToBottom =
      messagesElement.scrollHeight -
      messagesElement.scrollTop -
      messagesElement.clientHeight;

    shouldAutoScrollRef.current = distanceToBottom < 120;
  }, []);

  useEffect(() => {
    const messagesElement = messagesContainerRef.current;
    if (!messagesElement || !shouldAutoScrollRef.current) return;

    const rafId = requestAnimationFrame(() => {
      messagesElement.scrollTop = messagesElement.scrollHeight;
    });

    return () => cancelAnimationFrame(rafId);
  }, [renderedMessages]);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles((prev) => [...prev, ...Array.from(e.target.files || [])]);
  }

  function handleFileRemove(file: File) {
    setFiles((prev) => prev.filter((f) => f !== file));
  }

  async function customSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    shouldAutoScrollRef.current = true;

    if (!currentModel && !languageModel?.model) {
      toast.error("No model is selected.");
      return;
    }

    if (!languageModel?.agbApiKey?.trim()) {
      toast.error("AGB API Key is required.");
      return;
    }

    if (!languageModel?.apiKey?.trim()) {
      toast.error("LLM API Key is required.");
      return;
    }

    const processedFiles = await Promise.all(
      files.map(async (file) => {
        const content = await preProcessFile(file, { cutOff: 5 });
        return {
          name: file.name,
          contentType: file.type || "text/plain",
          content,
        };
      })
    );

    const uploadedFiles: FileUIPart[] = processedFiles.map((file) => ({
      type: "file",
      filename: file.name,
      mediaType: file.contentType,
      url: `data:${file.contentType};charset=utf-8,${encodeURIComponent(file.content)}`,
    }));

    await sendMessage(
      {
        text: input,
        files: uploadedFiles,
      },
      {
        body: {
          files: processedFiles,
          model: currentModel,
          config: languageModel,
        },
      }
    );
  }

  return (
    <div className="flex flex-col min-h-screen max-h-screen">
      <nav className="flex gap-0.5 justify-between items-center px-4 py-3 top-0 fixed left-0 right-0 bg-white/80 backdrop-blur-sm shadow-sm z-10">
        <div className="flex items-center gap-2 w-full max-w-2xl mx-auto">
          <Logo className="w-6 h-6" />
          <h1 className="text-md font-medium">
            Analyst by{" "}
            <a
              href="https://agb.cloud"
              target="_blank"
              className="underline decoration-2 text-primary"
            >
              AGBCLOUD
            </a>
          </h1>
          <RepoBanner />
        </div>
      </nav>

      <div
        className="flex-1 overflow-y-auto pt-20"
        id="messages"
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
      >
        {renderedMessages.map((m, index) => (
          <MemoizedMessage
            key={m.id}
            message={m as UIMessage}
            isStreaming={
              isLoading &&
              m.role === "assistant" &&
              index === renderedMessages.length - 1
            }
          />
        ))}
      </div>

      <div className="mb-4 mx-4">
        <div className="mx-auto w-full max-w-2xl flex flex-col gap-2">
          <div className="flex gap-2 overflow-x-auto">
            {messages.length === 0 && files.length === 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1 pr-4 [mask-image:linear-gradient(to_right,transparent,black_0%,black_95%,transparent)]">
                {EXAMPLE_MESSAGES.map((msg) => (
                  <button
                    key={msg}
                    className="flex items-center gap-2 p-1.5 border rounded-lg text-gray-800"
                    onClick={() => setInput(msg)}
                  >
                    <span className="text-sm truncate">{msg}</span>
                  </button>
                ))}
              </div>
            )}
            {files.map((file) => (
              <div
                key={file.name}
                className="flex items-center gap-2 p-1.5 border rounded-lg bg-slate-100 text-gray-800"
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => handleFileRemove(file)}
                  className="cursor-pointer"
                  disabled={isLoading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-between items-end">
            <div className="flex gap-2">
              <LLMPicker
                models={modelsList.models}
                languageModel={languageModel}
                onLanguageModelChange={handleLanguageModelChange}
              />
              <LLMSettings
                languageModel={languageModel}
                onLanguageModelChange={handleLanguageModelChange}
                hasMissingRequiredKeys={hasMissingRequiredKeys}
              />
            </div>
            {isLoading && (
              <span className="text-xs text-gray-700">Loading…</span>
            )}
          </div>
          <form
            onSubmit={customSubmit}
            className="flex border p-2 border-1.5 border-border rounded-xl overflow-hidden shadow-sm"
          >
            <input
              type="file"
              id="multimodal"
              name="multimodal"
              accept=".txt,.csv,.json,.md,.py"
              multiple={true}
              className="hidden"
              onChange={handleFileInput}
            />
            <button
              type="button"
              className="border p-1.5 rounded-lg hover:bg-primary/10 text-slate-800"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("multimodal")?.click();
              }}
            >
              <PlusIcon className="w-5 h-5" />
            </button>
            <input
              autoFocus
              required
              className="w-full px-2 outline-none"
              value={input}
              placeholder="Enter your prompt..."
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="bg-primary text-white p-1.5 rounded-lg hover:bg-primary/80"
            >
              <SendHorizonal className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
