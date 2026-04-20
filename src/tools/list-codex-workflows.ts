import { CODEX_WORKFLOWS } from "../utils/workflows";
import { getSavedPrompts } from "../utils/storage";

type Input = {
  query?: string;
  includeSavedPrompts?: boolean;
  limit?: number;
};

export default async function tool(input: Input = {}) {
  const query = input.query?.trim().toLowerCase();
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);
  const includeSavedPrompts = input.includeSavedPrompts !== false;

  const builtInWorkflows = CODEX_WORKFLOWS.map((workflow) => ({
    source: "built-in" as const,
    id: workflow.id,
    title: workflow.title,
    description: workflow.description,
    defaultFullAuto: workflow.defaultFullAuto,
  }));

  const savedPrompts = includeSavedPrompts
    ? (await getSavedPrompts()).map((prompt) => ({
        source: "saved-prompt" as const,
        id: prompt.id,
        title: prompt.title,
        description: prompt.body.slice(0, 240),
        createdAt: prompt.createdAt,
      }))
    : [];

  const workflows = [...builtInWorkflows, ...savedPrompts]
    .filter((workflow) =>
      query
        ? workflow.id.toLowerCase().includes(query) ||
          workflow.title.toLowerCase().includes(query) ||
          workflow.description.toLowerCase().includes(query)
        : true,
    )
    .slice(0, limit);

  return { count: workflows.length, workflows };
}
