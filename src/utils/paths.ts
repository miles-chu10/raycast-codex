import fs from "fs";
import os from "os";
import path from "path";
import { getPreferenceValues } from "@raycast/api";

interface Preferences {
  defaultDirectory?: string;
}

export function expandHome(input: string): string {
  if (input === "~") return os.homedir();
  if (input.startsWith("~/")) return path.join(os.homedir(), input.slice(2));
  return input;
}

export function getDefaultDirectory(): string {
  const prefs = getPreferenceValues<Preferences>();
  return expandHome(
    prefs.defaultDirectory?.trim() || path.join(os.homedir(), "Projects"),
  );
}

export function resolveWorkingDirectory(directory?: string): string {
  const projectsRoot = path.join(os.homedir(), "Projects");
  const rawDirectory = directory?.trim();
  const candidate = rawDirectory
    ? path.isAbsolute(expandHome(rawDirectory))
      ? expandHome(rawDirectory)
      : path.join(projectsRoot, rawDirectory)
    : getDefaultDirectory();
  const resolved = path.resolve(candidate);
  const stat = fs.existsSync(resolved) ? fs.statSync(resolved) : null;

  if (!stat?.isDirectory()) {
    throw new Error(
      `Working directory does not exist or is not a directory: ${resolved}`,
    );
  }

  return resolved;
}

export function getProjectsRoot(root?: string): string {
  return path.resolve(
    expandHome(root?.trim() || path.join(os.homedir(), "Projects")),
  );
}
