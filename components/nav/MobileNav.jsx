"use client";

import { MoreHorizontal } from "lucide-react";

export default function MobileNav({ primaryItems, activeKey, onNavigate, overflowActive, overflowBadge, onMoreClick }) {
  return (
    <nav className="dashboard-nav-mobile" aria-label="Primary">
      {primaryItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            className={`mobile-nav-item ${activeKey === item.key ? "active" : ""}`}
            onClick={() => onNavigate(item)}
            aria-current={activeKey === item.key ? "page" : undefined}
          >
            <span className="mobile-nav-icon-wrap">
              <Icon size={20} />
              {item.badge != null && <span className="mobile-nav-badge">{item.badge > 9 ? "9+" : item.badge}</span>}
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}

      <button
        type="button"
        className={`mobile-nav-item ${overflowActive ? "active" : ""}`}
        onClick={onMoreClick}
        aria-haspopup="true"
      >
        <span className="mobile-nav-icon-wrap">
          <MoreHorizontal size={20} />
          {overflowBadge > 0 && <span className="mobile-nav-badge">{overflowBadge > 9 ? "9+" : overflowBadge}</span>}
        </span>
        <span>More</span>
      </button>
    </nav>
  );
}