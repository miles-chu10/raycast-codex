import { List, ActionPanel, Action, useNavigation, Icon, Color, Form, showToast, Toast, Alert, confirmAlert } from "@raycast/api";
import { useState, useEffect } from "react";
import { getSavedPrompts, savePrompt, updatePrompt, deletePrompt, SavedPrompt } from "./utils/storage";
import RunTask from "./run-task";

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function NewPromptForm({ onSave }: { onSave: () => void }) {
  const { pop } = useNavigation();

  async function handleSubmit(values: { title: string; body: string }) {
    if (!values.body.trim()) {
      await showToast({ style: Toast.Style.Failure, title: "Prompt body is required" });
      return;
    }
    const title = values.title.trim() || values.body.trim().split("\n")[0].slice(0, 80);
    await savePrompt({ title, body: values.body.trim() });
    await showToast({ style: Toast.Style.Success, title: "Prompt saved" });
    onSave();
    pop();
  }

  return (
    <Form
      navigationTitle="New Saved Prompt"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Prompt" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title="Title" placeholder="Short label (optional — defaults to first line)" />
      <Form.TextArea id="body" title="Prompt" placeholder="Enter your prompt..." autoFocus />
    </Form>
  );
}

function EditPromptForm({ prompt, onSave }: { prompt: SavedPrompt; onSave: () => void }) {
  const { pop } = useNavigation();

  async function handleSubmit(values: { title: string; body: string }) {
    if (!values.body.trim()) {
      await showToast({ style: Toast.Style.Failure, title: "Prompt body is required" });
      return;
    }
    const title = values.title.trim() || values.body.trim().split("\n")[0].slice(0, 80);
    await updatePrompt(prompt.id, { title, body: values.body.trim() });
    await showToast({ style: Toast.Style.Success, title: "Prompt updated" });
    onSave();
    pop();
  }

  return (
    <Form
      navigationTitle={`Edit: ${prompt.title}`}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Changes" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title="Title" defaultValue={prompt.title} />
      <Form.TextArea id="body" title="Prompt" defaultValue={prompt.body} autoFocus />
    </Form>
  );
}

export default function SavedPrompts() {
  const { push } = useNavigation();
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  async function loadPrompts() {
    const data = await getSavedPrompts();
    setPrompts(data.slice().reverse()); // newest first
    setIsLoading(false);
  }

  useEffect(() => {
    loadPrompts();
  }, []);

  async function handleDelete(prompt: SavedPrompt) {
    const confirmed = await confirmAlert({
      title: "Delete Prompt",
      message: `Are you sure you want to delete "${prompt.title}"?`,
      primaryAction: { title: "Delete", style: Alert.ActionStyle.Destructive },
    });
    if (confirmed) {
      await deletePrompt(prompt.id);
      await showToast({ style: Toast.Style.Success, title: "Prompt deleted" });
      await loadPrompts();
    }
  }

  const filtered = searchText
    ? prompts.filter(
        (p) =>
          p.title.toLowerCase().includes(searchText.toLowerCase()) ||
          p.body.toLowerCase().includes(searchText.toLowerCase()),
      )
    : prompts;

  return (
    <List
      navigationTitle="Saved Prompts"
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Filter prompts..."
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action
            title="New Prompt"
            icon={Icon.Plus}
            onAction={() => push(<NewPromptForm onSave={loadPrompts} />)}
            shortcut={{ modifiers: ["cmd"], key: "n" }}
          />
        </ActionPanel>
      }
    >
      {filtered.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Document}
          title="No saved prompts"
          description="Press ⌘N to create your first saved prompt"
        />
      ) : (
        filtered.map((prompt) => (
          <List.Item
            key={prompt.id}
            icon={{ source: Icon.Document, tintColor: Color.Green }}
            title={prompt.title}
            subtitle={prompt.body.length > 60 ? prompt.body.slice(0, 60) + "…" : prompt.body}
            accessories={[{ text: formatDate(prompt.createdAt) }]}
            detail={<List.Item.Detail markdown={`# ${prompt.title}\n\n${prompt.body}`} />}
            actions={
              <ActionPanel>
                <Action
                  title="Run This Prompt"
                  icon={Icon.Play}
                  onAction={() => push(<RunTask initialPrompt={prompt.body} />)}
                />
                <Action
                  title="Edit Prompt"
                  icon={Icon.Pencil}
                  onAction={() => push(<EditPromptForm prompt={prompt} onSave={loadPrompts} />)}
                  shortcut={{ modifiers: ["cmd"], key: "e" }}
                />
                <Action.CopyToClipboard
                  title="Copy Prompt"
                  content={prompt.body}
                  shortcut={{ modifiers: ["cmd"], key: "c" }}
                />
                <Action
                  title="Delete Prompt"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  onAction={() => handleDelete(prompt)}
                  shortcut={{ modifiers: ["ctrl"], key: "x" }}
                />
                <Action
                  title="New Prompt"
                  icon={Icon.Plus}
                  onAction={() => push(<NewPromptForm onSave={loadPrompts} />)}
                  shortcut={{ modifiers: ["cmd"], key: "n" }}
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
