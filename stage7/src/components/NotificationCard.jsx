function NotificationCard({ notification, isNew, rank }) {
  const typeColors = {
    Placement: { bg: "rgba(99, 102, 241, 0.12)", border: "#6366f1", text: "#6366f1", icon: "PLM" },
    Result: { bg: "rgba(16, 185, 129, 0.12)", border: "#10b981", text: "#10b981", icon: "RES" },
    Event: { bg: "rgba(245, 158, 11, 0.12)", border: "#f59e0b", text: "#f59e0b", icon: "EVT" }
  };

  const colors = typeColors[notification.Type] || typeColors.Event;

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className={`notification-card ${isNew ? "is-new" : "is-read"}`} id={`notification-${notification.ID}`}>
      {isNew && <div className="new-badge">NEW</div>}
      {rank !== undefined && (
        <div className="rank-badge" style={{ background: colors.border }}>
          #{rank}
        </div>
      )}

      <div className="card-header">
        <span className="card-icon">{colors.icon}</span>
        <span className="card-type" style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
          {notification.Type}
        </span>
        <span className="card-time">{formatTime(notification.Timestamp)}</span>
      </div>

      <p className="card-message">{notification.Message}</p>

      <div className="card-footer">
        <span className="card-timestamp">{notification.Timestamp}</span>
        <span className="card-id">ID: {notification.ID.substring(0, 8)}...</span>
      </div>
    </div>
  );
}

export default NotificationCard;
