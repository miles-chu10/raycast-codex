import { ChildProcess, spawn } from "child_process";
import { LocalStorage } from "@raycast/api";
import { buildCodexArgs, getCodexPath, parseCodexEvent } from "./codex";
import { buildWorkflowPrompt } from "./workflows";

const MAX_OUTPUT_CHARS = 12_000;

export interface CodexRunOptions {
  prompt: string;
  directory: string;
  workflow?: string;
  model?: string;
  fullAuto?: boolean;
  sessionId?: string;
  timeoutMs?: number;
}

export interface CodexRunResult {
  success: boolean;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  sessionId?: string;
  directory: string;
  workflow: string;
  transcript: string;
  toolCalls: string[];
  stderr: string;
  timedOut: boolean;
}

function truncate(value: string, maxLength = MAX_OUTPUT_CHARS): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}\n... (truncated, ${value.length - maxLength} more characters)`;
}

function getRaycastPath(): string {
  return `/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH ?? ""}`;
}

export async function runCodexExec(
  options: CodexRunOptions,
): Promise<CodexRunResult> {
  const workflow = options.workflow || "custom";
  const prompt = buildWorkflowPrompt(workflow, options.prompt);
  const args = buildCodexArgs({
    prompt,
    directory: options.directory,
    model: options.model,
    fullAuto: options.fullAuto,
    sessionId: options.sessionId,
  });

  return new Promise((resolve, reject) => {
    const proc: ChildProcess = spawn(getCodexPath(), args, {
      cwd: options.directory,
      env: { ...process.env, PATH: getRaycastPath() },
    });

    let buffer = "";
    let stderr = "";
    let transcript = "";
    let sessionId = options.sessionId;
    let timedOut = false;
    const toolCalls: string[] = [];
    const timeoutMs = options.timeoutMs ?? 180_000;

    const timeout = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGTERM");
      setTimeout(() => proc.kill("SIGKILL"), 5_000).unref();
    }, timeoutMs);

    proc.stdout?.on("data", (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const raw = JSON.parse(line) as {
            type?: string;
            payload?: { id?: string };
            session_id?: string;
          };
          const announcedId = raw.payload?.id || raw.session_id;
          if (
            (raw.type === "session_meta" || raw.type === "done") &&
            announcedId
          ) {
            sessionId = announcedId;
            LocalStorage.setItem(
              `session-dir:${announcedId}`,
              options.directory,
            );
          }
        } catch {
          transcript += `${line}\n`;
          continue;
        }

        const parsed = parseCodexEvent(line);
        if (!parsed) continue;
        if (parsed.kind === "tool") toolCalls.push(parsed.text.trim());
        transcript += parsed.text;
      }
    });

    proc.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    proc.on("close", (exitCode, signal) => {
      clearTimeout(timeout);
      if (buffer.trim()) {
        const parsed = parseCodexEvent(buffer);
        transcript += parsed?.text ?? buffer;
      }

      resolve({
        success: exitCode === 0 && !timedOut,
        exitCode,
        signal,
        sessionId,
        directory: options.directory,
        workflow,
        transcript: truncate(transcript.trim()),
        toolCalls: toolCalls.slice(-20),
        stderr: truncate(stderr.trim(), 4_000),
        timedOut,
      });
    });
  });
}
