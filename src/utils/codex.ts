import { getPreferenceValues } from "@raycast/api";
import fs from "fs";
import os from "os";
import path from "path";

interface Preferences {
  codexPath: string;
}

export function getCodexPath(): string {
  const prefs = getPreferenceValues<Preferences>();
  return prefs.codexPath?.trim() || "/opt/homebrew/bin/codex";
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

  args.push("-C", opts.directory);

  // Prompt is the final positional argument
  if (opts.prompt) {
    args.push(opts.prompt);
  }

  return args;
}

// Parse a JSONL event from codex exec --json into a human-readable chunk.
// Returns null for events we don't want to surface (metadata, tool outputs, etc).
export function parseCodexEvent(line: string): { text: string; kind: "text" | "tool" | "meta" } | null {
  let event: { type: string; payload: Record<string, unknown> };
  try {
    event = JSON.parse(line);
  } catch {
    return null;
  }

  if (event.type === "session_meta") {
    const p = event.payload as { id?: string };
    return { text: `_Session \`${p.id ?? "unknown"}\` started_\n\n`, kind: "meta" };
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
      const cmd = typeof p.arguments === "string" ? p.arguments.trim() : JSON.stringify(p.arguments ?? "");
      const label = p.name ? `**[${p.name}]**` : "**[tool]**";
      return { text: `\n${label}\n\`\`\`\n${cmd}\n\`\`\`\n`, kind: "tool" };
    }
  }

  return null;
}
