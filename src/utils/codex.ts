import { getPreferenceValues } from "@raycast/api";
import fs from "fs";
import os from "os";
import path from "path";

interface Preferences {
  codexPath: string;
}

export function getCodexPath(): string {
  const prefs = getPreferenceValues<Preferences>();
  const configured = prefs.codexPath?.trim();
  const candidates = [
    configured,
    "/opt/homebrew/bin/codex",
    "/usr/local/bin/codex",
    path.join(os.homedir(), ".local", "bin", "codex"),
  ].filter((candidate): candidate is string => Boolean(candidate));

  return (
    candidates.find((candidate) => fs.existsSync(candidate)) ||
    configured ||
    "codex"
  );
}

export interface CodexSession {
  id: string;
  thread_name: string;
  updated_at: string;
}

export function readSessions(): CodexSession[] {
  const indexPath = path.join(os.homedir(), ".codex", "session_index.jsonl");
  if (!fs.existsSync(indexPath)) return [];

  const content = fs.readFileSync(indexPath, "utf8").trim();
  if (!content) return [];

  return content
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as CodexSession;
      } catch {
        return null;
      }
    })
    .filter((s): s is CodexSession => s !== null)
    .reverse(); // newest first
}

export interface RunTaskOptions {
  prompt: string;
  directory: string;
  model?: string;
  fullAuto?: boolean;
  sessionId?: string;
}

export function buildCodexArgs(opts: RunTaskOptions): string[] {
  // Subcommand first, then all flags, then the prompt positional (clap convention)
  const args: string[] = opts.sessionId
    ? ["exec", "resume", opts.sessionId]
    : ["exec"];

  args.push("--json", "--skip-git-repo-check");

  if (opts.fullAuto !== false) {
    args.push("--full-auto");
  }

  if (opts.model) {
    args.push("-m", opts.model);
  }

  // Prompt is the final positional argument
  if (opts.prompt) {
    args.push(opts.prompt);
  }

  return args;
}

// Parse a JSONL event from codex exec --json into a human-readable chunk.
// Returns null for events we don't want to surface (metadata, tool outputs, etc).
export function parseCodexEvent(
  line: string,
): { text: string; kind: "text" | "tool" | "meta" } | null {
  let event: {
    type: string;
    payload?: Record<string, unknown>;
    content?: string;
    name?: string;
    input?: unknown;
    output?: string;
    session_id?: string;
  };
  try {
    event = JSON.parse(line);
  } catch {
    return null;
  }

  if (event.type === "message" && typeof event.content === "string") {
    return { text: event.content, kind: "text" };
  }

  if (event.type === "tool_call") {
    const input =
      typeof event.input === "string"
        ? event.input
        : JSON.stringify(event.input ?? "");
    const label = event.name ? `**[${event.name}]**` : "**[tool]**";
    return {
      text: `\n${label}\n\`\`\`\n${input.trim()}\n\`\`\`\n`,
      kind: "tool",
    };
  }

  if (event.type === "done") {
    return {
      text: `_Session \`${event.session_id ?? "unknown"}\` finished_\n\n`,
      kind: "meta",
    };
  }

  if (event.type === "session_meta") {
    const p = event.payload as { id?: string } | undefined;
    return {
      text: `_Session \`${p?.id ?? "unknown"}\` started_\n\n`,
      kind: "meta",
    };
  }

  if (event.type === "response_item") {
    const p = event.payload as {
      type: string;
      role?: string;
      content?: Array<{ type: string; text?: string }>;
      name?: string;
      arguments?: string;
    };

    if (p.type === "message" && p.role === "assistant") {
      const text = (p.content ?? [])
        .filter((c) => c.type === "output_text" && c.text)
        .map((c) => c.text)
        .join("");
      if (text) return { text, kind: "text" };
    }

    if (p.type === "tool_use" || p.type === "tool_call") {
      const cmd =
        typeof p.arguments === "string"
          ? p.arguments.trim()
          : JSON.stringify(p.arguments ?? "");
      const label = p.name ? `**[${p.name}]**` : "**[tool]**";
      return { text: `\n${label}\n\`\`\`\n${cmd}\n\`\`\`\n`, kind: "tool" };
    }
  }

  return null;
}
