import type { ApiKeys } from "../storage/apiKeyStorage";
import type { GenericMapping, WidgetConfig } from "../types/widget";
import { WidgetCard } from "./WidgetCard";

interface Props {
  widgets: WidgetConfig[];
  apiKeys: ApiKeys;
  onRemove: (id: string) => void;
  onMappingResolved: (id: string, mapping: GenericMapping) => void;
  onUpdateParams: (id: string, patch: Record<string, unknown>) => void;
  onOpenSettings: (prefillName?: string) => void;
}

export function WidgetGrid({
  widgets,
  apiKeys,
  onRemove,
  onMappingResolved,
  onUpdateParams,
  onOpenSettings,
}: Props) {
  return (
    <main className="widget-grid">
      {widgets.map((w) => (
        <WidgetCard
          key={w.id}
          config={w}
          apiKeys={apiKeys}
          onRemove={onRemove}
          onMappingResolved={onMappingResolved}
          onUpdateParams={onUpdateParams}
          onOpenSettings={onOpenSettings}
        />
      ))}
    </main>
  );
}
