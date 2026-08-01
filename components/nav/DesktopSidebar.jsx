"use client";

export default function DesktopSidebar({ items, activeKey, onNavigate, userEmail, onLogout }) {
  return (
    <aside className="dashboard-sidebar dashboard-sidebar-desktop">
      <div className="dashboard-brand">IHT · Rangpur</div>
      <nav>
        {items.map((item) => (
          <button
            key={item.key}
            className={`dashboard-nav-item ${activeKey === item.key ? "active" : ""}`}
            onClick={() => onNavigate(item)}
          >
            {item.label}
            {item.badge != null && <span className="nav-badge">{item.badge}</span>}
          </button>
        ))}
      </nav>
      <button className="dashboard-logout" onClick={onLogout}>Log out</button>
      <div className="dashboard-user-email">{userEmail}</div>
    </aside>
  );
}