# raycast-codex — AGENTS.md

Raycast extension for OpenAI Codex CLI. Wraps `codex exec --json` with a streaming UI, session browser, and saved-prompts manager.

## Build & dev

```bash
npm run build   # ray build -e dist
npm run dev     # ray develop (hot reload in Raycast)
npm run lint    # ray lint
```

## Source layout

```
src/
  run-task.tsx          # Form → streams codex output in Detail view
  sessions.tsx          # Lists ~/.codex/session_index.jsonl, resume support
  saved-prompts.tsx     # LocalStorage CRUD, quick-launch to run-task
  components/
    job-detail.tsx      # Spawns codex exec subprocess, renders JSONL stream
  utils/
    codex.ts            # readSessions(), buildCodexArgs(), parseCodexEvent()
    storage.ts          # getSavedPrompts/savePrompt/updatePrompt/deletePrompt
```

## Coding conventions

- TypeScript strict mode — no implicit `any`
- `@raycast/api` for all UI components (List, Detail, Form, Action, ActionPanel, LocalStorage)
- `child_process.spawn` for subprocesses — never `execFile`; stdout is streamed line-by-line
- JSONL parsing lives in `utils/codex.ts` `parseCodexEvent()` — keep it there, don't inline
- No docstrings; comments only where logic is non-obvious

## JSONL event format (`codex exec --json`)

Each stdout line is one of:
```json
{"type": "message",     "content": "..."}
{"type": "tool_call",   "name": "...", "input": {...}}
{"type": "tool_result", "output": "..."}
{"type": "done",        "session_id": "..."}
```

Always handle unknown `type` values gracefully (skip/log).

## Session index

`~/.codex/session_index.jsonl` — append-only, one JSON record per line. `readSessions()` parses and returns newest-first.

## Watch out for

- PATH in Raycast's sandboxed environment may not include `codex`. Resolve with `which codex` at startup; fall back to `~/.local/bin/codex`.
- Batch stdout setState updates — Detail view markdown re-renders on every call; accumulate lines before flushing.
- LocalStorage keys for saved prompts: namespace them (e.g., `saved-prompts`) to avoid collisions with other extensions.
