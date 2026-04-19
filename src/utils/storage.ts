import { LocalStorage } from "@raycast/api";

export interface SavedPrompt {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

const SAVED_PROMPTS_KEY = "saved-prompts";

export async function getSavedPrompts(): Promise<SavedPrompt[]> {
  const raw = await LocalStorage.getItem<string>(SAVED_PROMPTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SavedPrompt[];
  } catch {
    return [];
  }
}

export async function savePrompt(prompt: Omit<SavedPrompt, "id" | "createdAt">): Promise<SavedPrompt> {
  const prompts = await getSavedPrompts();
  const newPrompt: SavedPrompt = {
    ...prompt,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  prompts.push(newPrompt);
  await LocalStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(prompts));
  return newPrompt;
}

export async function updatePrompt(id: string, updates: Partial<Pick<SavedPrompt, "title" | "body">>): Promise<void> {
  const prompts = await getSavedPrompts();
  const idx = prompts.findIndex((p) => p.id === id);
  if (idx >= 0) {
    prompts[idx] = { ...prompts[idx], ...updates };
    await LocalStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(prompts));
  }
}

export async function deletePrompt(id: string): Promise<void> {
  const prompts = await getSavedPrompts();
  const filtered = prompts.filter((p) => p.id !== id);
  await LocalStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(filtered));
}
