import { useState } from "react";
import { Log } from "./logger";
import Navbar from "./components/Navbar";
import AllNotifications from "./pages/AllNotifications";
import PriorityInbox from "./pages/PriorityInbox";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("all");

  function handleNavigate(page) {
    Log("frontend", "info", "page", `Switched to ${page} page`);
    setCurrentPage(page);
  }

  return (
    <div className="app">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="main-content">
        {currentPage === "all" && <AllNotifications />}
        {currentPage === "priority" && <PriorityInbox />}
      </main>
    </div>
  );
}

export default App;
