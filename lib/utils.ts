import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { preProcessFile } from "./preprocess";
import type { FileUIPart } from "ai";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function toUploadableFile(file: File, options?: { cutOff?: number }): Promise<FileUIPart> {
  const base64 = await preProcessFile(file, options);
  return {
    type: "file",
    mediaType: file.type,
    url: `data:${file.type};base64,${base64}`,
    filename: file.name,
  };
}
