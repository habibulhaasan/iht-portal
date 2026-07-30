"use client";

export default function ProgressBar({ percent, stepLabel }) {
  return (
    <div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="progress-label">
        <span>{stepLabel}</span>
        <span>{percent}% complete</span>
      </div>
    </div>
  );
}
