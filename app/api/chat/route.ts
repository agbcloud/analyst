import { getModelClient, LLMModel, LLMModelConfig } from "@/lib/model";
import { toPrompt } from "@/lib/prompt";
import { CustomFiles } from "@/lib/types";
import {
  streamText,
  convertToModelMessages,
  UIMessage,
  LanguageModel,
} from "ai";
import { FILE_PREFIX } from "@/config/file";

type MessageWithToolInvocations = UIMessage & {
  toolInvocations?: unknown[];
};

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json();
  const {
    messages,
    data,
  }: {
    messages: MessageWithToolInvocations[];
    data?: { files: CustomFiles[]; model: LLMModel; config: LLMModelConfig };
  } = body;

  const chatData = data || body;
  const normalizedFiles: CustomFiles[] = (chatData.files || []).map(
    (file: Partial<CustomFiles> & { base64?: string; name?: string }) => ({
      name: `${FILE_PREFIX}${file.name}` || "file",
      contentType: file.contentType || "text/plain",
      content: file.content || file.base64 || "",
    })
  );

  // Filter out tool invocations and file parts.
  const filteredMessages = messages.map((message) => {
    const filteredParts = Array.isArray(message.parts)
      ? message.parts.filter((part) => {
          return !(
            part &&
            typeof part === "object" &&
            "type" in part &&
            part.type === "file"
          );
        })
      : message.parts;

    if (message.toolInvocations) {
      return {
        ...message,
        parts: filteredParts,
        toolInvocations: undefined,
      };
    }
    return {
      ...message,
      parts: filteredParts,
    };
  });

  const { model, apiKey, ...modelParams } = chatData.config;

  const modelClient = getModelClient(chatData.model, chatData.config);

  const systemPrompt = toPrompt({ files: normalizedFiles });
  try {
    const result = await streamText({
      system: systemPrompt,
      model: modelClient as LanguageModel,
      messages: await convertToModelMessages(filteredMessages),
      ...modelParams,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("StreamText error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
