import { useCallback, useEffect, useRef, useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { ProfileBar } from "./components/ProfileBar";
import { ProfilePicker } from "./components/ProfilePicker";
import { SettingsPanel } from "./components/SettingsPanel";
import { randomBackground } from "./services/backgrounds";
import { parsePrompt } from "./services/intentParser";
import {
  defaultCity,
  getProfile,
  seedWidgets,
  type ProfileId,
} from "./services/presets";
import { loadApiKeys, saveApiKeys, type ApiKeys } from "./storage/apiKeyStorage";
import {
  loadActiveProfile,
  loadLocalCity,
  loadProfileWidgets,
  saveActiveProfile,
  saveLocalCity,
  saveProfileWidgets,
  type ProfileWidgets,
} from "./storage/profileStorage";
import {
  loadBackgroundImage,
  loadPrefs,
  saveBackgroundImage,
  savePrefs,
  type Prefs,
} from "./storage/prefsStorage";
import type { GenericMapping, WidgetConfig } from "./types/widget";

const FONT_ZOOM: Record<Prefs["fontScale"], string> = {
  small: "0.85",
  medium: "1",
  large: "1.18",
};

/** Ensure the active profile has a seeded widget list, seeding from preset if not. */
function ensureSeeded(map: ProfileWidgets, id: ProfileId, city: string): ProfileWidgets {
  if (map[id]) return map;
  return { ...map, [id]: seedWidgets(id, { city }) };
}

export default function App() {
  const [apiKeys, setApiKeys] = useState<ApiKeys>(() => loadApiKeys());
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [city, setCity] = useState<string>(() => loadLocalCity() || defaultCity());

  const [activeProfile, setActiveProfile] = useState<ProfileId>(() => loadActiveProfile() ?? "custom");
  const [profileWidgets, setProfileWidgets] = useState<ProfileWidgets>(() => {
    const initialActive = loadActiveProfile() ?? "custom";
    const seeded = ensureSeeded(loadProfileWidgets(), initialActive, loadLocalCity() || defaultCity());
    saveProfileWidgets(seeded);
    return seeded;
  });

  const [background, setBackground] = useState<string | null>(() => loadBackgroundImage());
  const [parsing, setParsing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsPrefill, setSettingsPrefill] = useState<string | undefined>();
  const [pickerOpen, setPickerOpen] = useState(false);

  const widgets = profileWidgets[activeProfile] ?? [];

  // --- background: paint the stored image instantly, then rotate to a fresh one
  useEffect(() => {
    const style = document.body.style;
    if (background) {
      style.backgroundImage = `linear-gradient(rgba(11, 13, 20, 0.72), rgba(11, 13, 20, 0.82)), url("${background}")`;
      style.backgroundSize = "cover";
      style.backgroundPosition = "center";
    } else {
      style.backgroundImage = "";
    }
  }, [background]);

  useEffect(() => {
    document.body.style.zoom = FONT_ZOOM[prefs.fontScale];
  }, [prefs.fontScale]);

  // Keep the current background in a ref so reroll can avoid an immediate repeat.
  const bgRef = useRef(background);
  bgRef.current = background;

  const rerollBackground = useCallback((profile: ProfileId) => {
    const url = randomBackground(profile, bgRef.current ?? undefined);
    setBackground(url);
    saveBackgroundImage(url);
  }, []);

  // Rotate the background once per new-tab load for the active profile's theme.
  const rotatedRef = useRef(false);
  useEffect(() => {
    if (rotatedRef.current) return;
    rotatedRef.current = true;
    rerollBackground(activeProfile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- widget mutations operate on the active profile's list
  const setActiveWidgets = useCallback(
    (updater: (prev: WidgetConfig[]) => WidgetConfig[]) => {
      setProfileWidgets((prev) => {
        const next = { ...prev, [activeProfile]: updater(prev[activeProfile] ?? []) };
        saveProfileWidgets(next);
        return next;
      });
    },
    [activeProfile],
  );

  const addWidget = useCallback(
    async (prompt: string) => {
      setParsing(true);
      try {
        const configs = await parsePrompt(prompt, Object.keys(apiKeys));
        setActiveWidgets((prev) => [...prev, ...configs]);
      } finally {
        setParsing(false);
      }
    },
    [apiKeys, setActiveWidgets],
  );

  const removeWidget = useCallback(
    (id: string) => setActiveWidgets((prev) => prev.filter((w) => w.id !== id)),
    [setActiveWidgets],
  );

  const handleMappingResolved = useCallback(
    (id: string, mapping: GenericMapping) =>
      setActiveWidgets((prev) =>
        prev.map((w) =>
          w.id === id && w.type === "generic" ? { ...w, params: { ...w.params, mapping } } : w,
        ),
      ),
    [setActiveWidgets],
  );

  // Merge a params patch into a widget (used by interactive widgets, e.g. the
  // watchlist editing its symbols). Persists via setActiveWidgets.
  const updateWidgetParams = useCallback(
    (id: string, patch: Record<string, unknown>) =>
      setActiveWidgets((prev) =>
        prev.map((w) => (w.id === id ? ({ ...w, params: { ...w.params, ...patch } } as WidgetConfig) : w)),
      ),
    [setActiveWidgets],
  );

  // --- profile switching
  const selectProfile = useCallback(
    (id: ProfileId, pickedCity?: string) => {
      const useCity = pickedCity ?? city;
      if (pickedCity && id === "local") {
        setCity(pickedCity);
        saveLocalCity(pickedCity);
      }
      setProfileWidgets((prev) => {
        // Seed if unseen; for Local, (re)seed whenever a city is explicitly chosen.
        const needsSeed = !prev[id] || (id === "local" && !!pickedCity);
        const next = needsSeed ? { ...prev, [id]: seedWidgets(id, { city: useCity }) } : prev;
        if (needsSeed) saveProfileWidgets(next);
        return next;
      });
      setActiveProfile(id);
      saveActiveProfile(id);
      setPickerOpen(false);
      rerollBackground(id);
    },
    [city, rerollBackground],
  );

  const resetProfile = useCallback(() => {
    const fresh = seedWidgets(activeProfile, { city });
    setProfileWidgets((prev) => {
      const next = { ...prev, [activeProfile]: fresh };
      saveProfileWidgets(next);
      return next;
    });
  }, [activeProfile, city]);

  // --- settings / keys / prefs
  const handleSaveKeys = useCallback((keys: ApiKeys) => {
    setApiKeys(keys);
    saveApiKeys(keys);
  }, []);

  const updatePrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      savePrefs(next);
      return next;
    });
  }, []);

  const openSettings = useCallback((prefill?: string) => {
    setSettingsPrefill(prefill);
    setSettingsOpen(true);
  }, []);

  return (
    <>
      <Dashboard
        widgets={widgets}
        apiKeys={apiKeys}
        parsing={parsing}
        clockPrefs={{ hour12: prefs.hour12, timeZone: prefs.timeZone }}
        profileName={getProfile(activeProfile).name}
        onPrompt={addWidget}
        onRemove={removeWidget}
        onMappingResolved={handleMappingResolved}
        onUpdateParams={updateWidgetParams}
        onOpenSettings={openSettings}
        onChangeProfile={() => setPickerOpen(true)}
      />

      <ProfileBar
        onOpenSettings={() => openSettings()}
        onChangeBackground={() => rerollBackground(activeProfile)}
        onChangeProfile={() => setPickerOpen(true)}
        onResetProfile={resetProfile}
      />

      {pickerOpen && (
        <ProfilePicker
          activeProfile={activeProfile}
          defaultCity={city}
          onSelect={selectProfile}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {settingsOpen && (
        <SettingsPanel
          apiKeys={apiKeys}
          prefs={prefs}
          prefillName={settingsPrefill}
          onSaveKeys={handleSaveKeys}
          onUpdatePrefs={updatePrefs}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  );
}
