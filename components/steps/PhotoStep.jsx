"use client";

import { defaultAvatarFor, resizeAndEncode } from "../../lib/photoUtils";

export default function PhotoStep({ data, setData }) {
  const gender = data.gender;
  const preview = data.photo?.useDefault === false && data.photo?.base64 ? data.photo.base64 : defaultAvatarFor(gender);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await resizeAndEncode(file);
    setData((d) => ({ ...d, photo: { base64, useDefault: false } }));
  };

  const removePhoto = () => setData((d) => ({ ...d, photo: { base64: null, useDefault: true } }));

  return (
    <div>
      <h2>Profile photo</h2>
      <p className="step-sub">Optional — if you skip this, a default avatar for your gender is shown instead.</p>

      <div className="photo-upload">
        <img src={preview} alt="Profile preview" className="photo-preview" />
        <div>
          <label className="btn-ghost btn" style={{ display: "inline-block", cursor: "pointer", width: "auto" }}>
            Choose photo
            <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
          </label>
          {!data.photo?.useDefault && data.photo?.base64 && (
            <button type="button" onClick={removePhoto} style={{ display: "block", marginTop: 10, background: "none", border: "none", color: "#a3401f", fontSize: 13, cursor: "pointer" }}>
              Remove photo
            </button>
          )}
        </div>
      </div>
      <p className="helper-text">Photo is resized and stored as a compressed image — no separate file storage needed for now.</p>
    </div>
  );
}
