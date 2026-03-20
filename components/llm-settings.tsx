import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Settings2 } from "lucide-react";
import { LLMModelConfig } from "@/lib/model";

export function LLMSettings({
  languageModel,
  onLanguageModelChange,
  hasMissingRequiredKeys = false,
}: {
  languageModel: LLMModelConfig;
  onLanguageModelChange: (model: LLMModelConfig) => void;
  hasMissingRequiredKeys?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 rounded-md ${
            hasMissingRequiredKeys
              ? "text-red-500 bg-red-50 ring-1 ring-red-200 hover:bg-red-100"
              : "text-muted-foreground"
          }`}
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <>
          <div className="flex flex-col gap-2 px-2 py-2">
            <Label htmlFor="agbApiKey" className="flex items-center gap-1">
              AGB API Key
              <span className="text-red-500">*</span>
            </Label>
            <Input
              name="agbApiKey"
              type="password"
              placeholder="Auto"
              required={true}
              defaultValue={languageModel.agbApiKey}
              onChange={(e) =>
                onLanguageModelChange({
                  agbApiKey:
                    e.target.value.length > 0 ? e.target.value : undefined,
                })
              }
              className="text-sm"
            />
          </div>
          <div className="flex flex-col gap-2 px-2 py-2">
            <Label htmlFor="apiKey" className="flex items-center gap-1">
              LLM API Key
              <span className="text-red-500">*</span>
            </Label>
            <Input
              name="apiKey"
              type="password"
              placeholder="Auto"
              required={true}
              defaultValue={languageModel.apiKey}
              onChange={(e) =>
                onLanguageModelChange({
                  apiKey:
                    e.target.value.length > 0 ? e.target.value : undefined,
                })
              }
              className="text-sm"
            />
          </div>
          <DropdownMenuSeparator />
        </>
        <>
          <div className="flex flex-col gap-2 px-2 py-2">
            <Label htmlFor="baseURL">Base URL</Label>
            <Input
              name="baseURL"
              type="text"
              placeholder="Auto"
              required={true}
              defaultValue={languageModel.baseURL}
              onChange={(e) =>
                onLanguageModelChange({
                  baseURL:
                    e.target.value.length > 0 ? e.target.value : undefined,
                })
              }
              className="text-sm"
            />
          </div>
          <DropdownMenuSeparator />
        </>
        <div className="flex flex-col gap-2 px-2 py-2">
          <Label htmlFor="model">Custom Model</Label>
          <Input
            name="model"
            type="text"
            placeholder="Auto"
            required={false}
            defaultValue={languageModel.model}
            onChange={(e) =>
              onLanguageModelChange({
                model: e.target.value.length > 0 ? e.target.value : undefined,
              })
            }
            className="text-sm"
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
