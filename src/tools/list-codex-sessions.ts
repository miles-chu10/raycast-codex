import { readSessions } from "../utils/codex";

type Input = {
  query?: string;
  limit?: number;
};

export default function tool(input: Input = {}) {
  const query = input.query?.trim().toLowerCase();
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);
  const sessions = readSessions()
    .filter((session) =>
      query ? session.thread_name.toLowerCase().includes(query) : true,
    )
    .slice(0, limit);

  return { count: sessions.length, sessions };
}
