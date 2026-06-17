import { useState } from "react";
import { PROFILES, type ProfileId } from "../services/presets";

interface Props {
  activeProfile: ProfileId;
  defaultCity: string;
  onSelect: (id: ProfileId, city?: string) => void;
  onClose: () => void;
}

export function ProfilePicker({ activeProfile, defaultCity, onSelect, onClose }: Props) {
  const [cityFor, setCityFor] = useState<ProfileId | null>(null);
  const [city, setCity] = useState(defaultCity);

  function choose(id: ProfileId) {
    const profile = PROFILES.find((p) => p.id === id);
    if (profile?.needsCity) {
      setCityFor(id);
      return;
    }
    onSelect(id);
  }

  function confirmCity() {
    const trimmed = city.trim();
    if (!trimmed || !cityFor) return;
    onSelect(cityFor, trimmed);
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="picker-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-head">
          <h2>{cityFor ? "Choose your city" : "Choose a profile"}</h2>
          <button className="settings-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {cityFor ? (
          <div className="picker-city">
            <p className="widget-muted">
              The Local profile uses your city for weather, news, and sports.
            </p>
            <input
              className="settings-input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Austin"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && confirmCity()}
            />
            <div className="picker-city-actions">
              <button className="settings-link-btn" onClick={() => setCityFor(null)}>
                ← Back
              </button>
              <button className="settings-add" onClick={confirmCity} disabled={!city.trim()}>
                Apply
              </button>
            </div>
          </div>
        ) : (
          <div className="picker-grid">
            {PROFILES.map((p) => (
              <button
                key={p.id}
                className={`picker-card ${p.id === activeProfile ? "active" : ""}`}
                onClick={() => choose(p.id)}
              >
                <span className="picker-name">{p.name}</span>
                <span className="picker-desc">{p.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
