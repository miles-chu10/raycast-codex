import fs from "fs";
import path from "path";
import { getProjectsRoot } from "../utils/paths";

type Input = {
  root?: string;
  query?: string;
  limit?: number;
};

function hasFile(directory: string, fileName: string): boolean {
  return fs.existsSync(path.join(directory, fileName));
}

export default function tool(input: Input = {}) {
  const root = getProjectsRoot(input.root);
  const query = input.query?.trim().toLowerCase();
  const limit = Math.min(Math.max(input.limit ?? 40, 1), 100);

  if (!fs.existsSync(root)) {
    throw new Error(`Projects root does not exist: ${root}`);
  }

  const projects = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter(
      (entry) => !entry.name.startsWith(".") && entry.name !== "node_modules",
    )
    .filter((entry) =>
      query ? entry.name.toLowerCase().includes(query) : true,
    )
    .slice(0, limit)
    .map((entry) => {
      const directory = path.join(root, entry.name);
      return {
        name: entry.name,
        directory,
        isGitRepository: hasFile(directory, ".git"),
        hasPackageJson: hasFile(directory, "package.json"),
        hasAgents: hasFile(directory, "AGENTS.md"),
        hasClaude: hasFile(directory, "CLAUDE.md"),
      };
    });

  return { root, count: projects.length, projects };
}
