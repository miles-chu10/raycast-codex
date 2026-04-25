import { Detail, ActionPanel, Action, LocalStorage } from "@raycast/api";
import { ChildProcess, spawn } from "child_process";
import { useEffect, useRef, useState } from "react";
import { buildCodexArgs, getCodexPath, parseCodexEvent } from "../utils/codex";
import { buildWorkflowPrompt, getWorkflow } from "../utils/workflows";

export interface JobDetailProps {
  prompt: string;
  directory: string;
  model?: string;
  fullAuto?: boolean;
  sessionId?: string;
  workflow?: string;
}

export function JobDetail({
  prompt,
  directory,
  model,
  fullAuto = true,
  sessionId,
  workflow,
}: JobDetailProps) {
  const selectedWorkflow = getWorkflow(workflow);
  const [markdown, setMarkdown] = useState<string>(
    `## Codex Task\n\n**Workflow:** ${selectedWorkflow.title}\n\n**Directory:** \`${directory}\`\n\n**Prompt:** ${prompt}\n\n---\n\n`,
  );
  const [status, setStatus] = useState<"running" | "done" | "error">("running");
  const processRef = useRef<ChildProcess | null>(null);

  useEffect(() => {
    const codexBin = getCodexPath();
    const effectivePrompt = buildWorkflowPrompt(selectedWorkflow.id, prompt);
    const args = buildCodexArgs({
      prompt: effectivePrompt,
      directory,
      model: model || undefined,
      fullAuto,
      sessionId,
    });

    const proc = spawn(codexBin, args, {
      cwd: directory,
      env: {
        ...process.env,
        PATH: `/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH ?? ""}`,
      },
    });
    processRef.current = proc;

    let buffer = "";

    proc.stdout?.on("data", (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        // Persist session→directory mapping when the session ID is first announced
        try {
          const raw = JSON.parse(line) as {
            type: string;
            payload: { id?: string };
          };
          if (raw.type === "session_meta" && raw.payload?.id) {
            LocalStorage.setItem(`session-dir:${raw.payload.id}`, directory);
          }
        } catch {
          // not JSON — ignore
        }
        const parsed = parseCodexEvent(line);
        if (parsed) {
          setMarkdown((prev) => prev + parsed.text);
        }
      }
    });

    proc.stderr?.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) {
        setMarkdown((prev) => prev + `\n> ⚠️ ${msg}\n`);
      }
    });

    proc.on("close", (code) => {
      if (code === 0) {
        setStatus("done");
        setMarkdown((prev) => prev + "\n---\n✅ **Task complete.**");
      } else {
        setStatus("error");
        setMarkdown(
          (prev) =>
            prev +
            `\n---\n❌ **Process exited with code ${code ?? "unknown"}.**`,
        );
      }
    });

    proc.on("error", (err) => {
      setStatus("error");
      setMarkdown(
        (prev) =>
          prev +
          `\n---\n❌ **Failed to start Codex:** ${err.message}\n\nCheck the Codex binary path in extension preferences.`,
      );
    });

    return () => {
      proc.kill("SIGTERM");
      // Escalate to SIGKILL if process doesn't exit within 5 seconds
      const forceKill = setTimeout(() => proc.kill("SIGKILL"), 5000);
      proc.once("close", () => clearTimeout(forceKill));
    };
  }, []);

  function handleCancel() {
    processRef.current?.kill("SIGTERM");
    setStatus("done");
    setMarkdown((prev) => prev + "\n---\n🛑 **Cancelled.**");
  }

  return (
    <Detail
      isLoading={status === "running"}
      markdown={markdown}
      actions={
        <ActionPanel>
          {status === "running" && (
            <Action
              title="Cancel Task"
              onAction={handleCancel}
              shortcut={{ modifiers: ["cmd"], key: "." }}
            />
          )}
          {status !== "running" && (
            <Action.CopyToClipboard
              content={markdown}
              title="Copy Output"
              shortcut={{ modifiers: ["cmd"], key: "c" }}
            />
          )}
        </ActionPanel>
      }
    />
  );
}
