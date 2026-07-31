"use client";

import { useState } from "react";
import { useDirectorySettings, saveDirectorySettings, DIRECTORY_FIELDS } from "../../lib/directorySettings";

export default function DirectorySettingsPanel() {
  const { settings, loaded } = useDirectorySettings();
  const [pending, setPending] = useState(null);
  const [saving, setSaving] = useState(false);

  const effective = pending ?? settings;

  const toggle = async (key) => {
    const next = { ...effective, [key]: !effective[key] };
    setPending(next);
    setSaving(true);
    try {
      await saveDirectorySettings(next);
    } finally {
      setSaving(false);
      setPending(null);
    }
  };

  if (!loaded) return <p className="helper-text">Loading directory settings…</p>;

  return (
    <div className="admin-panel-section">
      <h3>Directory visibility</h3>
      <p className="step-sub">
        Controls what can ever appear in the member directory. For
        member-controlled fields, this is the ceiling — turning it off here
        hides the field for everyone, regardless of any individual member's
        own privacy choice.
      </p>
      <div className="directory-settings-list">
        {DIRECTORY_FIELDS.map((f) => (
          <div key={f.key} className="directory-settings-row">
            <div className="directory-settings-text">
              <div className="directory-settings-label">{f.label}</div>
              <div className="directory-settings-sub">
                {f.togglableByUser ? "Also member-controlled" : "Admin-only switch"}
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={!!effective[f.key]}
                disabled={saving}
                onChange={() => toggle(f.key)}
              />
              <span className="toggle-track"><span className="toggle-thumb" /></span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}