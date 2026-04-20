export type CodexWorkflowId =
  | "custom"
  | "plan"
  | "implement"
  | "review"
  | "debug"
  | "test"
  | "docs"
  | "ship";

export interface CodexWorkflow {
  id: CodexWorkflowId;
  title: string;
  description: string;
  promptPrefix: string;
  defaultFullAuto: boolean;
}

export const CODEX_WORKFLOWS: CodexWorkflow[] = [
  {
    id: "custom",
    title: "Custom Prompt",
    description: "Run the prompt exactly as written.",
    promptPrefix: "",
    defaultFullAuto: true,
  },
  {
    id: "plan",
    title: "Plan",
    description:
      "Inspect the project and produce an implementation plan without editing files.",
    promptPrefix:
      "Create a concrete implementation plan for the requested work. Inspect the repository as needed, but do not edit files. Include assumptions, risks, and validation steps.",
    defaultFullAuto: false,
  },
  {
    id: "implement",
    title: "Implement",
    description:
      "Make the requested code changes, then run relevant validation.",
    promptPrefix:
      "Implement the requested change end to end. Follow the repository instructions, keep edits scoped, run relevant validation, and summarize changed files and any remaining blockers.",
    defaultFullAuto: true,
  },
  {
    id: "review",
    title: "Review",
    description:
      "Review the current diff or requested area for bugs and regressions.",
    promptPrefix:
      "Review the requested code or current diff. Prioritize verified bugs, regressions, security issues, and missing tests. Findings first with file and line references. Do not edit files.",
    defaultFullAuto: false,
  },
  {
    id: "debug",
    title: "Debug",
    description: "Investigate a bug, identify root cause, and fix when safe.",
    promptPrefix:
      "Investigate the reported issue systematically. Establish the root cause before changing code, then implement the narrowest safe fix and verify it.",
    defaultFullAuto: true,
  },
  {
    id: "test",
    title: "Test",
    description: "Run relevant checks and report or fix failures.",
    promptPrefix:
      "Run the validation that matches this repository. If failures are caused by the requested change and the fix is low risk, fix them; otherwise report the exact failure and likely cause.",
    defaultFullAuto: true,
  },
  {
    id: "docs",
    title: "Docs",
    description: "Update project documentation to match the requested state.",
    promptPrefix:
      "Update the relevant project documentation for the requested change. Keep wording concise, avoid unrelated docs churn, and run any available formatting or validation checks.",
    defaultFullAuto: true,
  },
  {
    id: "ship",
    title: "Ship Prep",
    description:
      "Prepare a change for handoff without pushing external changes.",
    promptPrefix:
      "Prepare the current work for shipping. Inspect git status and diff, run relevant validation, identify risky changes, and produce a concise handoff. Do not commit, push, or open a PR unless explicitly requested.",
    defaultFullAuto: false,
  },
];

export function getWorkflow(workflowId?: string): CodexWorkflow {
  return (
    CODEX_WORKFLOWS.find((workflow) => workflow.id === workflowId) ??
    CODEX_WORKFLOWS[0]
  );
}

export function buildWorkflowPrompt(
  workflowId: string | undefined,
  prompt: string,
): string {
  const workflow = getWorkflow(workflowId);
  const trimmedPrompt = prompt.trim();
  if (!workflow.promptPrefix) return trimmedPrompt;
  if (!trimmedPrompt) return workflow.promptPrefix;
  return `${workflow.promptPrefix}\n\nUser request:\n${trimmedPrompt}`;
}
