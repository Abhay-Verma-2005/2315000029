import { useState, useEffect } from "react";
import { fetchAllNotifications } from "../api";
import { Log } from "../logger";
import FilterBar from "../components/FilterBar";
import NotificationCard from "../components/NotificationCard";

const WEIGHT = { Placement: 3, Result: 2, Event: 1 };

function getTopN(notifications, n = 10) {
  return [...notifications]
    .sort((a, b) => {
      const weightDiff = WEIGHT[b.Type] - WEIGHT[a.Type];
      if (weightDiff !== 0) return weightDiff;
      return new Date(b.Timestamp) - new Date(a.Timestamp);
    })
    .slice(0, n);
}

function PriorityInbox() {
  const [allNotifications, setAllNotifications] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topN, setTopN] = useState(10);
  const [filter, setFilter] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allNotifications, topN, filter]);

  async function loadAll() {
    setLoading(true);
    setError(null);

    try {
      await Log("frontend", "info", "page", "Loading priority inbox");
      const data = await fetchAllNotifications();
      setAllNotifications(data);
      await Log("frontend", "info", "page", `Priority inbox loaded ${data.length} total notifications`);
    } catch (err) {
      await Log("frontend", "error", "page", `Priority inbox failed: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let pool = allNotifications;
    if (filter) {
      pool = pool.filter((n) => n.Type === filter);
    }
    const top = getTopN(pool, topN);
    setFiltered(top);
    Log("frontend", "debug", "page", `Showing top ${top.length} of ${pool.length} filtered notifications`);
  }

  function handleFilterChange(newFilter) {
    setFilter(newFilter);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Priority Inbox</h1>
        <p className="page-subtitle">Top notifications ranked by importance and recency</p>
      </div>

      <div className="priority-controls">
        <FilterBar activeFilter={filter} onFilterChange={handleFilterChange} />

        <div className="top-n-selector">
          <label htmlFor="top-n-select">Show top:</label>
          <select
            id="top-n-select"
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="priority-legend">
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "#6366f1" }}></span>
          Placement (Weight: 3)
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "#10b981" }}></span>
          Result (Weight: 2)
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: "#f59e0b" }}></span>
          Event (Weight: 1)
        </span>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading all notifications...</p>
        </div>
      )}

      {error && (
        <div className="error-container" id="priority-error">
          <span className="error-icon">[ERR]</span>
          <p>Failed to load: {error}</p>
          <button className="retry-btn" onClick={loadAll}>Retry</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty-container">
          <span className="empty-icon">[EMPTY]</span>
          <p>No notifications match your criteria</p>
        </div>
      )}

      {!loading && !error && (
        <div className="notifications-grid">
          {filtered.map((n, i) => (
            <NotificationCard key={n.ID} notification={n} isNew={false} rank={i + 1} />
          ))}
        </div>
      )}

      {!loading && !error && (
        <div className="priority-stats">
          <p>
            Showing <strong>{filtered.length}</strong> of <strong>{allNotifications.length}</strong> total notifications
          </p>
        </div>
      )}
    </div>
  );
}

export default PriorityInbox;
