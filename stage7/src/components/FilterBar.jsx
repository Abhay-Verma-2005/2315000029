import { Log } from "../logger";

function FilterBar({ activeFilter, onFilterChange, notificationType }) {
  const filters = ["All", "Placement", "Result", "Event"];

  function handleClick(filter) {
    const value = filter === "All" ? null : filter;
    Log("frontend", "info", "component", `Filter changed to ${filter}`);
    onFilterChange(value);
  }

  return (
    <div className="filter-bar">
      {filters.map((filter) => (
        <button
          key={filter}
          id={`filter-${filter.toLowerCase()}`}
          className={`filter-btn ${
            (filter === "All" && !activeFilter) || activeFilter === filter
              ? "active"
              : ""
          } ${filter !== "All" ? `filter-${filter.toLowerCase()}` : ""}`}
          onClick={() => handleClick(filter)}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}

export default FilterBar;
