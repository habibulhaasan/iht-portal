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
            <Icon size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}