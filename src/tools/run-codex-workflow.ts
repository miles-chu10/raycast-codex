import { Tool } from "@raycast/api";
import { getSavedPrompts } from "../utils/storage";
import { runCodexExec } from "../utils/codex-runner";
import { resolveWorkingDirectory } from "../utils/paths";
import { getWorkflow } from "../utils/workflows";

type Input = {
  prompt?: string;
  directory?: string;
  workflow?: string;
  savedPromptId?: string;
  model?: string;
  fullAuto?: boolean;
  sessionId?: string;
  timeoutSeconds?: number;
};

function clampTimeoutSeconds(value?: number): number {
  if (!value) return 180;
  return Math.min(Math.max(Math.round(value), 15), 900);
}

async function resolvePrompt(input: Input): Promise<string> {
  const prompt = input.prompt?.trim() ?? "";
  if (!input.savedPromptId) return prompt;

  const savedPrompt = (await getSavedPrompts()).find(
    (candidate) => candidate.id === input.savedPromptId,
  );
  if (!savedPrompt)
    throw new Error(`Saved prompt not found: ${input.savedPromptId}`);
  return prompt
    ? `${savedPrompt.body}\n\nAdditional request:\n${prompt}`
    : savedPrompt.body;
}

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  const workflow = getWorkflow(input.workflow);
  return {
    message: "Run Codex from Raycast?",
    info: [
      { name: "Workflow", value: workflow.title },
      { name: "Directory", value: input.directory || "(default directory)" },
      { name: "Session", value: input.sessionId },
      {
        name: "Mode",
        value:
          input.fullAuto === false
            ? "read-only / ask before writes"
            : "full-auto file writes allowed",
      },
      {
        name: "Timeout",
        value: `${clampTimeoutSeconds(input.timeoutSeconds)}s`,
      },
    ],
  };
};

export default async function tool(input: Input = {}) {
  const workflow = getWorkflow(input.workflow);
  const prompt = await resolvePrompt(input);
  if (!prompt.trim())
    throw new Error(
      "Prompt is required unless savedPromptId points to a saved prompt",
    );

  const directory = resolveWorkingDirectory(input.directory);
  const result = await runCodexExec({
    prompt,
    directory,
    workflow: workflow.id,
    model: input.model,
    fullAuto: input.fullAuto ?? workflow.defaultFullAuto,
    sessionId: input.sessionId,
    timeoutMs: clampTimeoutSeconds(input.timeoutSeconds) * 1_000,
  });

  return {
    ...result,
    nextSteps: result.success
      ? "Use the transcript to answer the user. Include the sessionId when useful for follow-up or resume."
      : "Tell the user Codex failed or timed out, then include stderr/transcript details that explain the failure.",
  };
}
