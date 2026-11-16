import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "../api/auth";
import "./TranslationHistory.css";

const EMPTY_RECORDS = [];

function getRecordDate(record) {
  const value = record.created_at ?? record.createdAt ?? record.date;
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function formatDate(date) {
  if (!date) return "Date unavailable";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(date) {
  if (!date) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(duration) {
  if (typeof duration === "string" && duration.trim()) return duration;
  if (!Number.isFinite(duration) || duration < 0) return "Duration unavailable";
  const totalSeconds = Math.floor(duration);
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function Icon({ name }) {
  const paths = {
    history: <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5m4-1v5l3 2" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
    video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3z" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    filter: <><path d="M4 6h16M7 12h10m-7 6h4" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
  };
  return <svg className="ish-history-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}

function Header({ user, onLogout }) {
  const name = user?.full_name?.trim() || "there";
  const initials = name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  return (
    <header className="ish-history-header">
      <Link className="ish-history-brand" to="/dashboard">ishara.ai</Link>
      <nav className="ish-history-nav" aria-label="User dashboard navigation">
        <Link className="ish-history-nav-item" to="/dashboard">Dashboard</Link>
        <span className="ish-history-nav-item is-active" aria-current="page">Translation History</span>
        <Link className="ish-history-nav-item" to="/dashboard/profile-settings">Profile / Settings</Link>
      </nav>
      <div className="ish-history-account">
        <span className="ish-history-avatar" aria-hidden="true">{initials || "I"}</span>
        <span className="ish-history-account-name">{name}</span>
        <button type="button" className="ish-history-signout" onClick={onLogout}>Sign out</button>
      </div>
    </header>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "unknown").toLowerCase();
  const label = normalized === "completed" ? "Completed" : normalized === "processing" ? "Processing" : normalized === "failed" ? "Failed" : "Status unavailable";
  return <span className={`ish-history-status is-${normalized}`}><i />{label}</span>;
}

function HistoryRow({ record }) {
  const date = getRecordDate(record);
  const source = record.source || record.file_name || record.fileName || "Video translation";
  return (
    <tr>
      <td data-label="Translation"><span className="ish-history-source"><i><Icon name="video" /></i><span><strong>{source}</strong><small>{record.source_language || "PSL video"}</small></span></span></td>
      <td data-label="Date & time"><span className="ish-history-date">{formatDate(date)}{date && <small>{formatTime(date)}</small>}</span></td>
      <td data-label="Duration"><span className="ish-history-duration"><Icon name="clock" />{formatDuration(record.duration_seconds ?? record.duration)}</span></td>
      <td data-label="Status"><StatusBadge status={record.status} /></td>
    </tr>
  );
}

function TranslationHistory({ user, records = EMPTY_RECORDS }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("any");

  function handleLogout() {
    logoutUser();
    navigate("/login", { replace: true });
  }

  const historyRecords = Array.isArray(records) ? records : EMPTY_RECORDS;
  const filteredRecords = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const cutoff = dateFilter === "today" ? startOfToday : dateFilter === "7days" ? new Date(now.getTime() - 7 * 86400000) : dateFilter === "30days" ? new Date(now.getTime() - 30 * 86400000) : null;
    return historyRecords
      .filter((record) => {
        const searchable = [record.source, record.file_name, record.fileName, record.source_language]
          .filter(Boolean).join(" ").toLocaleLowerCase();
        const matchesQuery = searchable.includes(query.trim().toLocaleLowerCase());
        const matchesStatus = statusFilter === "all" || String(record.status || "").toLowerCase() === statusFilter;
        const date = getRecordDate(record);
        const withinDateRange = Boolean(date && cutoff && date >= cutoff && date <= now);
        const matchesDate = !cutoff || withinDateRange;
        return matchesQuery && matchesStatus && matchesDate;
      })
      .sort((left, right) => (getRecordDate(right)?.getTime() || 0) - (getRecordDate(left)?.getTime() || 0));
  }, [dateFilter, historyRecords, query, statusFilter]);

  function clearFilters() {
    setQuery("");
    setStatusFilter("all");
    setDateFilter("any");
  }

  return (
    <main className="ish-history-page">
      <div className="ish-history-shell">
        <Header user={user} onLogout={handleLogout} />
        <section className="ish-history-heading">
          <div><h1>Translation History</h1><p>Access your previous PSL translations.</p></div>
        </section>

        <section className="ish-history-filters" aria-label="Search and filter translations">
          <label className="ish-history-search"><span>Search translations</span><i><Icon name="search" /></i><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by title" /></label>
          <label><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="completed">Completed</option><option value="processing">Processing</option><option value="failed">Failed</option></select></label>
          <label><span>Date</span><select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}><option value="any">Any date</option><option value="today">Today</option><option value="7days">Last 7 days</option><option value="30days">Last 30 days</option></select></label>
          <button className="ish-history-clear" type="button" onClick={clearFilters}>Clear filters</button>
        </section>

        {historyRecords.length > 0 ? (
          <>
            <div className="ish-history-results-summary"><span>{filteredRecords.length} {filteredRecords.length === 1 ? "translation" : "translations"}{query.trim() ? ` found for “${query.trim()}”` : ""}</span><span>Newest first</span></div>
            {filteredRecords.length ? (
              <section className="ish-history-table-card" aria-label="Translation records">
                <div className="ish-history-table-wrap">
                  <table>
                    <thead><tr><th scope="col">Translation</th><th scope="col">Date &amp; time</th><th scope="col">Duration</th><th scope="col">Status</th></tr></thead>
                    <tbody>{filteredRecords.map((record, index) => <HistoryRow key={record.id ?? `${record.file_name || record.fileName || "translation"}-${record.created_at || record.createdAt || record.date || index}`} record={record} />)}</tbody>
                  </table>
                </div>
                <div className="ish-history-table-footer">Translation history appears here when processing becomes available.</div>
              </section>
            ) : (
              <section className="ish-history-no-results" aria-live="polite">
                <span className="ish-history-search-icon"><Icon name="search" /></span>
                <h2>No translations found</h2>
                <p>No records match the current search or filters. Try another search or clear your filters.</p>
                <button className="ish-history-clear-button" type="button" onClick={clearFilters}>Clear filters</button>
              </section>
            )}
          </>
        ) : (
          <section className="ish-history-empty" aria-labelledby="ish-history-empty-title">
            <span className="ish-history-empty-icon"><Icon name="history" /></span>
            <h2 id="ish-history-empty-title">Your first translation starts here</h2>
            <p>No translations yet. Record your signing or choose a PSL video. Your translation history will appear here once translation processing is available.</p>
            <div className="ish-history-empty-actions"><Link className="ish-history-primary-link" to="/dashboard/live-camera">Open Camera</Link><Link className="ish-history-secondary-link" to="/dashboard/upload-video">Choose Video</Link></div>
            <span className="ish-history-empty-note">One complete thought. One step closer to connection.</span>
          </section>
        )}
      </div>
    </main>
  );
}

export default TranslationHistory;
