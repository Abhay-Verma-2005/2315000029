import { useState, useEffect } from "react";
import { fetchNotifications } from "../api";
import { Log } from "../logger";
import FilterBar from "../components/FilterBar";
import NotificationCard from "../components/NotificationCard";

function AllNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState(null);
  const [viewedIds, setViewedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("viewedNotifications") || "[]");
    } catch {
      return [];
    }
  });
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  useEffect(() => {
    loadNotifications();
  }, [page, filter]);

  async function loadNotifications() {
    setLoading(true);
    setError(null);

    try {
      await Log("frontend", "info", "page", `Loading notifications page=${page} filter=${filter}`);
      const data = await fetchNotifications(page, limit, filter);
      const items = data.notifications || [];
      setNotifications(items);
      setHasMore(items.length === limit);

      const currentIds = items.map((n) => n.ID);
      const newViewedIds = [...new Set([...viewedIds, ...currentIds])];
      setViewedIds(newViewedIds);
      localStorage.setItem("viewedNotifications", JSON.stringify(newViewedIds));

      await Log("frontend", "info", "page", `Loaded ${items.length} notifications`);
    } catch (err) {
      await Log("frontend", "error", "page", `Failed to load: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(newFilter) {
    setFilter(newFilter);
    setPage(1);
  }

  function isNew(id) {
    return !viewedIds.includes(id);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>All Notifications</h1>
        <p className="page-subtitle">Your notifications are listed below</p>
      </div>

      <FilterBar activeFilter={filter} onFilterChange={handleFilterChange} />

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading notifications...</p>
        </div>
      )}

      {error && (
        <div className="error-container" id="error-message">
          <span className="error-icon">[ERR]</span>
          <p>Failed to load notifications: {error}</p>
          <button className="retry-btn" onClick={loadNotifications}>Retry</button>
        </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <div className="empty-container">
          <span className="empty-icon">[EMPTY]</span>
          <p>No notifications found</p>
        </div>
      )}

      {!loading && !error && (
        <div className="notifications-grid">
          {notifications.map((n) => (
            <NotificationCard key={n.ID} notification={n} isNew={isNew(n.ID)} />
          ))}
        </div>
      )}

      {!loading && !error && (
        <div className="pagination">
          <button
            id="prev-page"
            className="page-btn"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            ← Previous
          </button>
          <span className="page-info">Page {page}</span>
          <button
            id="next-page"
            className="page-btn"
            disabled={!hasMore}
            onClick={() => setPage(page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default AllNotifications;
