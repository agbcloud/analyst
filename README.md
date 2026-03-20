# Analyst

Analyst is an AI-powered data analysis web app built with Next.js.  
It accepts prompts plus optional files, asks an LLM to generate Python code, runs that code in an AGB sandbox, and returns execution results (including chart outputs) in the chat UI.

## Features

- Multi-provider model support (OpenAI, Anthropic, Google; custom base URL/model override).
- File-aware prompting (`.txt`, `.csv`, `.json`, `.md`, `.py`) with lightweight preprocessing.
- Streaming chat responses with throttled rendering for smoother UX.
- Automatic Python code extraction from model output.
- Secure remote execution in AGB sandbox sessions.
- In-chat tool result rendering for execution output.

## Tech Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Vercel AI SDK (`ai`, `@ai-sdk/*`)
- Tailwind CSS + Radix UI
- AGB Cloud SDK for sandbox lifecycle and code execution

## How It Works

1. User enters a prompt and optionally uploads files.
2. Frontend sends messages, selected model, and processed files to `/api/chat`.
3. Server builds a system prompt and streams LLM output back to the UI.
4. Frontend extracts Python code from the model response.
5. Extracted code is posted to `/api/sandbox` and executed in AGB.
6. Execution results are appended as a tool message in chat.

## Requirements

- Node.js 18+ (recommended 20+)
- `pnpm` (recommended), `npm`, `yarn`, or `bun`
- A valid **AGB API Key**
- A valid **LLM API Key** for the selected provider

> API keys are configured in the app settings panel at runtime (not via `.env` by default).

## Getting Started

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. Open model settings and provide:
   - **AGB API Key**
   - **LLM API Key**
   - Optional **Base URL** and **Custom Model**
2. Choose a model from the picker.
3. Add prompt and optional files.
4. Submit and wait for:
   - streamed model response
   - sandbox execution result message

## Available Scripts

- `pnpm dev` - Run local development server
- `pnpm build` - Create production build
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Project Structure

```text
app/
  api/chat/route.ts      # LLM streaming endpoint
  api/sandbox/route.ts   # AGB sandbox execution endpoint
  page.tsx               # Main chat UI
components/              # UI and chat components
lib/
  model.ts               # Provider/model client factory
  prompt.ts              # System prompt construction
  preprocess.ts          # File preprocessing helpers
  models.json            # Model catalog
```

## Notes

- The sandbox endpoint currently executes generated code as Python.
- Uploaded files are prefixed and injected into the analysis prompt.
- AGB sessions are created per request and cleaned up after execution.
