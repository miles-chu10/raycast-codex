import {
  Form,
  ActionPanel,
  Action,
  useNavigation,
  showToast,
  Toast,
} from "@raycast/api";
import { JobDetail } from "./components/job-detail";
import { savePrompt } from "./utils/storage";
import { CODEX_WORKFLOWS } from "./utils/workflows";

interface FormValues {
  prompt: string;
  directory: string[];
  model: string;
  fullAuto: boolean;
  workflow: string;
}

export default function RunTask({
  initialPrompt,
  initialDirectory,
}: {
  initialPrompt?: string;
  initialDirectory?: string;
} = {}) {
  const { push } = useNavigation();

  async function handleSubmit(values: FormValues) {
    const directory = values.directory?.[0];
    if (!directory) {
      await showToast({
        style: Toast.Style.Failure,
        title: "No directory selected",
      });
      return;
    }
    if (!values.prompt.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Prompt is required",
      });
      return;
    }

    push(
      <JobDetail
        prompt={values.prompt.trim()}
        directory={directory}
        model={values.model || undefined}
        fullAuto={values.fullAuto}
        workflow={values.workflow}
      />,
    );
  }

  async function handleSavePrompt(values: FormValues) {
    if (!values.prompt.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Prompt is required",
      });
      return;
    }
    const firstLine = values.prompt.trim().split("\n")[0].slice(0, 80);
    await savePrompt({ title: firstLine, body: values.prompt.trim() });
    await showToast({ style: Toast.Style.Success, title: "Prompt saved" });
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Run Task" onSubmit={handleSubmit} />
          <Action.SubmitForm
            title="Save Prompt"
            onSubmit={handleSavePrompt}
            shortcut={{ modifiers: ["cmd"], key: "s" }}
          />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="prompt"
        title="Prompt"
        placeholder="Describe what you want Codex to do..."
        defaultValue={initialPrompt ?? ""}
        autoFocus
      />
      <Form.FilePicker
        id="directory"
        title="Working Directory"
        allowMultipleSelection={false}
        canChooseFiles={false}
        canChooseDirectories={true}
        defaultValue={initialDirectory ? [initialDirectory] : undefined}
      />
      <Form.Separator />
      <Form.Dropdown id="workflow" title="Workflow" defaultValue="custom">
        {CODEX_WORKFLOWS.map((workflow) => (
          <Form.Dropdown.Item
            key={workflow.id}
            value={workflow.id}
            title={workflow.title}
          />
        ))}
      </Form.Dropdown>
      <Form.Dropdown id="model" title="Model" defaultValue="">
        <Form.Dropdown.Item value="" title="Default (gpt-5.4)" />
        <Form.Dropdown.Item value="o4-mini" title="o4-mini" />
        <Form.Dropdown.Item value="o3" title="o3" />
        <Form.Dropdown.Item
          value="gpt-5.3-codex-spark"
          title="Spark (gpt-5.3-codex-spark)"
        />
      </Form.Dropdown>
      <Form.Checkbox
        id="fullAuto"
        title="Sandbox"
        label="Allow file writes (workspace-write sandbox)"
        defaultValue={true}
      />
    </Form>
  );
}
