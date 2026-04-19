import { List, ActionPanel, Action, useNavigation, Icon, Color, Form, showToast, Toast, getPreferenceValues, LocalStorage } from "@raycast/api";
import { useState, useEffect } from "react";
import fs from "fs";
import { readSessions, CodexSession } from "./utils/codex";
import { JobDetail } from "./components/job-detail";
import RunTask from "./run-task";

interface Preferences {
  codexPath: string;
}

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ResumePanel({ session }: { session: CodexSession }) {
  const { push } = useNavigation();
  const [savedDirectory, setSavedDirectory] = useState<string | undefined>(undefined);

  useEffect(() => {
    LocalStorage.getItem<string>(`session-dir:${session.id}`).then((dir) => {
      if (dir) setSavedDirectory(dir);
    });
  }, [session.id]);

  async function handleSubmit(values: { directory: string[]; prompt: string }) {
    const directory = values.directory?.[0];
    if (!directory) {
      await showToast({ style: Toast.Style.Failure, title: "No directory selected" });
      return;
    }

    const prefs = getPreferenceValues<Preferences>();
    const codexBin = prefs.codexPath?.trim() || "/opt/homebrew/bin/codex";
    if (!fs.existsSync(codexBin)) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Codex binary not found",
        message: `Check path in preferences: ${codexBin}`,
      });
      return;
    }

    push(
      <JobDetail
        prompt={values.prompt.trim()}
        directory={directory}
        sessionId={session.id}
        fullAuto={true}
      />,
    );
  }

  return (
    <Form
      navigationTitle={`Resume: ${session.thread_name}`}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Resume Session" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description title="Session" text={session.thread_name} />
      <Form.Description title="Session ID" text={session.id} />
      <Form.FilePicker
        id="directory"
        title="Working Directory"
        allowMultipleSelection={false}
        canChooseFiles={false}
        canChooseDirectories={true}
        defaultValue={savedDirectory ? [savedDirectory] : undefined}
      />
      <Form.TextArea
        id="prompt"
        title="Follow-up Prompt"
        placeholder="Optional: add instructions for this resumed session"
        defaultValue=""
      />
    </Form>
  );
}

export default function Sessions() {
  const { push } = useNavigation();
  const [searchText, setSearchText] = useState("");
  const [sessions, setSessions] = useState<CodexSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Read file system off the render cycle to avoid blocking the UI
    setSessions(readSessions());
    setIsLoading(false);
  }, []);

  const filtered = searchText
    ? sessions.filter((s) => s.thread_name.toLowerCase().includes(searchText.toLowerCase()))
    : sessions;

  return (
    <List
      navigationTitle="Codex Sessions"
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Filter sessions..."
      isLoading={isLoading}
    >
      {filtered.length === 0 ? (
        <List.EmptyView
          icon={Icon.Terminal}
          title="No sessions found"
          description="Run a Codex task first to see sessions here"
        />
      ) : (
        filtered.map((session) => (
          <List.Item
            key={session.id}
            icon={{ source: Icon.Clock, tintColor: Color.Blue }}
            title={session.thread_name}
            subtitle={formatRelativeTime(session.updated_at)}
            accessories={[{ text: session.id.slice(0, 8), tooltip: `Full ID: ${session.id}` }]}
            actions={
              <ActionPanel>
                <Action
                  title="Resume Session"
                  icon={Icon.Play}
                  onAction={() => push(<ResumePanel session={session} />)}
                />
                <Action.CopyToClipboard
                  title="Copy Session ID"
                  content={session.id}
                  shortcut={{ modifiers: ["cmd"], key: "c" }}
                />
                <Action
                  title="New Task"
                  icon={Icon.Plus}
                  onAction={() => push(<RunTask />)}
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
