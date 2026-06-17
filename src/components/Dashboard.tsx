import type { ApiKeys } from "../storage/apiKeyStorage";
import type { GenericMapping, WidgetConfig } from "../types/widget";
import { Clock } from "./Clock";
import { PromptBar } from "./PromptBar";
import { WidgetGrid } from "./WidgetGrid";

interface Props {
  widgets: WidgetConfig[];
  apiKeys: ApiKeys;
  parsing: boolean;
  clockPrefs: { hour12: boolean; timeZone: string };
  profileName: string;
  onPrompt: (prompt: string) => void;
  onRemove: (id: string) => void;
  onMappingResolved: (id: string, mapping: GenericMapping) => void;
  onUpdateParams: (id: string, patch: Record<string, unknown>) => void;
  onOpenSettings: (prefillName?: string) => void;
  onChangeProfile: () => void;
}

export function Dashboard({
  widgets,
  apiKeys,
  parsing,
  clockPrefs,
  profileName,
  onPrompt,
  onRemove,
  onMappingResolved,
  onUpdateParams,
  onOpenSettings,
  onChangeProfile,
}: Props) {
  return (
    <div className="dashboard">
      <Clock hour12={clockPrefs.hour12} timeZone={clockPrefs.timeZone} />
      <PromptBar parsing={parsing} onPrompt={onPrompt} />
      {widgets.length === 0 ? (
        <div className="empty-state">
          <p>
            <strong>{profileName}</strong> has no widgets yet.
          </p>
          <p className="empty-hint">
            Type a prompt above to add one — try <em>“weather in Austin”</em> or{" "}
            <em>“price of bitcoin”</em> — or{" "}
            <button className="empty-link" onClick={onChangeProfile}>
              pick a profile
            </button>{" "}
            to start with a preset set.
          </p>
        </div>
      ) : (
        <WidgetGrid
          widgets={widgets}
          apiKeys={apiKeys}
          onRemove={onRemove}
          onMappingResolved={onMappingResolved}
          onUpdateParams={onUpdateParams}
          onOpenSettings={onOpenSettings}
        />
      )}
    </div>
  );
}
