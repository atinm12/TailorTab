import { useMemo, useState, type FormEvent } from "react";
import type { ApiKeys } from "../storage/apiKeyStorage";
import type { FontScale, Prefs } from "../storage/prefsStorage";

interface Props {
  apiKeys: ApiKeys;
  prefs: Prefs;
  /** Highlight/prefill a key name the user was prompted to add. */
  prefillName?: string;
  onSaveKeys: (keys: ApiKeys) => void;
  onUpdatePrefs: (patch: Partial<Prefs>) => void;
  onClose: () => void;
}

const FONT_SCALES: { value: FontScale; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const FALLBACK_ZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Kolkata",
  "Australia/Sydney",
];

export function SettingsPanel({
  apiKeys,
  prefs,
  prefillName,
  onSaveKeys,
  onUpdatePrefs,
  onClose,
}: Props) {
  const [name, setName] = useState(prefillName ?? "");
  const [value, setValue] = useState("");

  const timeZones = useMemo<string[]>(() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      return FALLBACK_ZONES;
    }
  }, []);

  const entries = Object.entries(apiKeys);

  function addKey(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !value.trim()) return;
    const newKeys = { ...apiKeys, [trimmed]: value.trim() };
    onSaveKeys(newKeys);
    if (typeof pendo !== "undefined") {
      pendo.track("api_key_added", {
        keyName: trimmed,
        totalKeysAfter: Object.keys(newKeys).length,
        wasPrefilled: trimmed === prefillName,
      });
    }
    setName("");
    setValue("");
  }

  function removeKey(key: string) {
    const next = { ...apiKeys };
    delete next[key];
    onSaveKeys(next);
    if (typeof pendo !== "undefined") {
      pendo.track("api_key_removed", {
        keyName: key,
        totalKeysAfter: Object.keys(next).length,
      });
    }
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-head">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose} aria-label="Close settings">
            ×
          </button>
        </div>

        <section className="settings-section">
          <h3>Font size</h3>
          <div className="settings-segment">
            {FONT_SCALES.map((s) => (
              <button
                key={s.value}
                className={`settings-segment-btn ${prefs.fontScale === s.value ? "active" : ""}`}
                onClick={() => onUpdatePrefs({ fontScale: s.value })}
              >
                {s.label}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <h3>Time &amp; date</h3>
          <div className="settings-row">
            <span className="settings-row-label">Time format</span>
            <div className="settings-segment">
              <button
                className={`settings-segment-btn ${prefs.hour12 ? "active" : ""}`}
                onClick={() => onUpdatePrefs({ hour12: true })}
              >
                12-hour
              </button>
              <button
                className={`settings-segment-btn ${!prefs.hour12 ? "active" : ""}`}
                onClick={() => onUpdatePrefs({ hour12: false })}
              >
                24-hour
              </button>
            </div>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Time zone</span>
            <select
              className="settings-input settings-select"
              value={prefs.timeZone}
              onChange={(e) => onUpdatePrefs({ timeZone: e.target.value })}
            >
              <option value="auto">Auto (local)</option>
              {timeZones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="settings-section">
          <h3>API keys</h3>
          <p className="widget-muted">
            Save keys for gated APIs. The agent references a key by name (e.g.{" "}
            <code>{"{{NAME}}"}</code>) when building a request. Keys are stored locally and never
            sent to OpenAI.
          </p>
          {entries.length > 0 && (
            <ul className="settings-keys">
              {entries.map(([key, val]) => (
                <li key={key} className="settings-key">
                  <span className="settings-key-name">{key}</span>
                  <span className="settings-key-value">{"•".repeat(Math.min(val.length, 12))}</span>
                  <button className="settings-key-remove" onClick={() => removeKey(key)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form className="settings-form" onSubmit={addKey}>
            <input
              className="settings-input"
              placeholder="Key name (e.g. FINNHUB)"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              autoFocus={!!prefillName}
            />
            <input
              className="settings-input"
              placeholder="Key value"
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button className="settings-add" type="submit" disabled={!name.trim() || !value.trim()}>
              Add
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
