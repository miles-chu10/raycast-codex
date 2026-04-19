@AGENTS.md

# raycast-codex

Raycast extension for OpenAI Codex CLI. Three commands that wrap `codex exec --json` and manage sessions/prompts.

## Commands

| File | Command | Purpose |
|------|---------|---------|
| `src/run-task.tsx` | run-task | Form → streams `codex exec --json` output in a Detail view |
| `src/sessions.tsx` | sessions | Lists sessions from `~/.codex/session_index.jsonl`, resume support |
| `src/saved-prompts.tsx` | saved-prompts | LocalStorage CRUD, quick-launch to run-task |

## Key source files

- `src/components/job-detail.tsx` — spawns `codex exec` subprocess, parses JSONL events, renders streaming output
- `src/utils/codex.ts` — `readSessions()`, `buildCodexArgs()`, `parseCodexEvent()`
- `src/utils/storage.ts` — `getSavedPrompts()`, `savePrompt()`, `updatePrompt()`, `deletePrompt()` via Raycast LocalStorage

## Build & dev

```bash
npm run build   # ray build -e dist
npm run dev     # ray develop (hot reload in Raycast)
npm run lint    # ray lint
```

## Important patterns

**Streaming subprocess** — always use `child_process.spawn` (not `execFile`). Read stdout line-by-line; each line is a JSONL event.

**JSONL event format** from `codex exec --json`:
```json
{"type": "message", "content": "..."}
{"type": "tool_call", "name": "...", "input": {...}}
{"type": "tool_result", "output": "..."}
{"type": "done", "session_id": "..."}
```
Parse via `parseCodexEvent()` in `src/utils/codex.ts`.

**Session index** — `~/.codex/session_index.jsonl` is append-only; each line is a session record. Use `readSessions()` which returns them newest-first.

## Gotchas

- Raycast Detail view markdown re-renders on each state update — batch stdout lines before setState to avoid jitter.
- `codex exec` may not be on PATH in Raycast's environment; resolve via `which codex` at startup or hardcode `~/.local/bin/codex` as fallback.
- TypeScript strict mode is on — no implicit `any`, no unchecked optional chaining.
