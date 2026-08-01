"use client";

export default function MobileNav({ items, activeKey, onNavigate }) {
  return (
    <nav className="dashboard-nav-mobile" aria-label="Primary">
      {items.map((item) => {
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
    </nav>
  );
}