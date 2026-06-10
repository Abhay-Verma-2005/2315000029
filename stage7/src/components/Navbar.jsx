import { useState } from "react";
import { Log } from "../logger";

function Navbar({ currentPage, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);

  function handleNav(page) {
    Log("frontend", "info", "component", `Navigating to ${page}`);
    onNavigate(page);
    setMenuOpen(false);
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand" onClick={() => handleNav("all")}>
          <span className="brand-text">CampusNotification</span>
        </div>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span className={`hamburger-line ${menuOpen ? "open" : ""}`}></span>
          <span className={`hamburger-line ${menuOpen ? "open" : ""}`}></span>
          <span className={`hamburger-line ${menuOpen ? "open" : ""}`}></span>
        </button>

        <div className={`navbar-links ${menuOpen ? "show" : ""}`}>
          <button
            id="nav-all-notifications"
            className={`nav-link ${currentPage === "all" ? "active" : ""}`}
            onClick={() => handleNav("all")}
          >
            All Notifications
          </button>
          <button
            id="nav-priority-inbox"
            className={`nav-link ${currentPage === "priority" ? "active" : ""}`}
            onClick={() => handleNav("priority")}
          >
            Priority Inbox
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
