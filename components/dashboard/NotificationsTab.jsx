"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications, markNotificationRead } from "../../lib/notifications";

function timeAgo(ts) {
  const date = ts?.toDate?.();
  if (!date) return "";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function NotificationsTab() {
  const { user } = useAuth();
  const { notifications, unreadCount, ready } = useNotifications(user?.uid);

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => markNotificationRead(user.uid, n.id)));
  };

  return (
    <div className="notifications-tab">
      <div className="notifications-header">
        <h2>Notifications</h2>
        {unreadCount > 0 && (
          <button type="button" className="link-button" onClick={markAllRead}>
            <CheckCheck size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} />
            Mark all as read
          </button>
        )}
      </div>
      <p className="step-sub">{unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up."}</p>

      {!ready && <p className="helper-text">Loading notifications…</p>}

      {ready && notifications.length === 0 && (
        <div className="notifications-empty">
          <Bell size={28} />
          <p>No notifications yet.</p>
        </div>
      )}

      <ul className="notifications-list">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`notification-item ${n.read ? "" : "unread"}`}
            onClick={() => !n.read && markNotificationRead(user.uid, n.id)}
          >
            <div className="notification-item-top">
              <span className="notification-title">{n.title}</span>
              {!n.read && <span className="notification-dot" aria-label="Unread" />}
            </div>
            <p className="notification-body">{n.body}</p>
            <div className="notification-meta">
              {n.audience === "all" ? "Announcement" : "Direct message"} · {timeAgo(n.createdAt)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}