"use client";

import { X } from "lucide-react";

export default function MobileMoreSheet({ open, items, activeKey, onNavigate, onClose }) {
  if (!open) return null;

  return (
    <div className="more-sheet-overlay" onClick={onClose}>
      <div className="more-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="more-sheet-header">
          <span>More</span>
          <button type="button" className="more-sheet-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="more-sheet-list">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={`more-sheet-item ${activeKey === item.key ? "active" : ""}`}
                onClick={() => onNavigate(item)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
                {item.badge != null && <span className="nav-badge">{item.badge}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}