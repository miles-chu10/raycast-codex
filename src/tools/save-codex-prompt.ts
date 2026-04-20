import { Tool } from "@raycast/api";
import { savePrompt } from "../utils/storage";

type Input = {
  title?: string;
  prompt: string;
};

export const confirmation: Tool.Confirmation<Input> = async (input) => ({
  message: "Save this Codex prompt?",
  info: [
    {
      name: "Title",
      value:
        input.title?.trim() || input.prompt.trim().split("\n")[0].slice(0, 80),
    },
    { name: "Prompt", value: input.prompt.trim().slice(0, 500) },
  ],
});

export default async function tool(input: Input) {
  if (!input.prompt.trim()) throw new Error("Prompt is required");

  const prompt = await savePrompt({
    title:
      input.title?.trim() || input.prompt.trim().split("\n")[0].slice(0, 80),
    body: input.prompt.trim(),
  });

  return { saved: true, prompt };
}
