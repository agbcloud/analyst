import { CustomFiles } from "@/lib/types";
import { AGB, CreateSessionParams } from "agbcloud-sdk";
import { FILE_PREFIX } from "@/config/file";

// const sandboxTimeout = 10 * 60 * 1000; // 10 minute in ms

export const maxDuration = 60;

export async function POST(req: Request) {
  let agb: AGB | null = null;
  let session: Awaited<ReturnType<AGB["create"]>>["session"] | null = null;

  try {
    const formData = await req.formData();
    const code = formData.get("code") as string | null;
    const agbApiKey = formData.get("agbApiKey") as string | null;

    if (!code || !code.trim()) {
      return new Response(
        JSON.stringify({
          error: "Invalid request: 'code' is required.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const files: CustomFiles[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === "code" || key === "agbApiKey") continue;

      if (value instanceof File) {
        const content = await value.text();
        files.push({
          name: value.name,
          content: content,
          contentType: value.type,
        });
      }
    }

    const apiKey = agbApiKey || "";
    agb = new AGB({
      apiKey,
    });

    const createResult = await agb.create(
      new CreateSessionParams({ imageId: "agb-code-space-1" })
    );

    if (!createResult.success || !createResult.session) {
      return new Response(
        JSON.stringify({
          error: "Failed to create sandbox session.",
          details: createResult.errorMessage || "Unknown error.",
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    session = createResult.session;

    // Upload files
    for (const file of files) {
      await session.file.write(`${FILE_PREFIX}${file.name}`, file.content);
      const fileInfo = await session.file.getFileInfo(`/tmp/${file.name}`);
      console.log(`File ${file.name} uploaded successfully`, fileInfo);
    }

    const { results, logs, errorMessage } = await session.code.run(code, "python");

    return new Response(
      JSON.stringify({
        results,
        logs,
        error: errorMessage,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected server error occurred.";
    return new Response(
      JSON.stringify({
        error: "Sandbox execution failed.",
        details: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    if (agb && session) {
      try {
        await agb.delete(session);
      } catch (cleanupError) {
        console.error("Failed to clean up sandbox session.", cleanupError);
      }
    }
  }
}
