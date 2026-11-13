import { useEffect, useMemo, useState } from "react";
import { getSystemLogs } from "../../api/admin";
import "./SystemLogs.css";

const SEVERITIES = ["All severities", "INFO", "WARN", "ERROR", "CRITICAL"];

const TIME_FILTERS = [
  { label: "Last 24 hours", value: "24" },
  { label: "Last 7 days", value: "168" },
  { label: "Last 30 days", value: "720" },
  { label: "All time", value: "all" },
];

const formatTimestamp = (date) => {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
};

function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [referenceTime, setReferenceTime] = useState(() => Date.now());
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("24");
  const [severityFilter, setSeverityFilter] = useState("All severities");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const entriesPerPage = 8;

  useEffect(() => {
    let isMounted = true;

    async function loadLogs() {
      try {
        setLoading(true);
        setError("");

        const data = await getSystemLogs();

        if (!Array.isArray(data)) {
          throw new Error("Invalid system logs response from the server.");
        }

        const formattedLogs = data.map((log) => ({
          id: log.id,
          severity: log.severity,
          event: log.event,
          source: log.source,
          requestId: log.request_id || "",
          details: log.details,
          timestamp: new Date(log.timestamp),
        }));

        if (isMounted) {
          setLogs(formattedLogs);
          setReferenceTime(Date.now());
          setSelectedLog(null);
          setCurrentPage(1);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Unable to load system logs.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadLogs();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        log.event.toLowerCase().includes(searchText) ||
        log.source.toLowerCase().includes(searchText) ||
        log.requestId.toLowerCase().includes(searchText);

      const matchesSeverity =
        severityFilter === "All severities" ||
        log.severity === severityFilter;

      const matchesTime =
        timeFilter === "all" ||
        (referenceTime - log.timestamp.getTime()) / (1000 * 60 * 60) <=
          Number(timeFilter);

      return matchesSearch && matchesSeverity && matchesTime;
    });
  }, [logs, referenceTime, search, severityFilter, timeFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLogs.length / entriesPerPage)
  );

  const visibleLogs = filteredLogs.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  const handleTimeFilter = (event) => {
    setTimeFilter(event.target.value);
    setCurrentPage(1);
  };

  const handleSeverityFilter = (event) => {
    setSeverityFilter(event.target.value);
    setCurrentPage(1);
  };

  const exportCSV = () => {
    const headers = [
      "Timestamp",
      "Severity",
      "Event",
      "Source",
      "Request ID",
      "Details",
    ];

    const rows = filteredLogs.map((log) => [
      formatTimestamp(log.timestamp),
      log.severity,
      log.event,
      log.source,
      log.requestId,
      log.details,
    ]);

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "ishara-system-logs.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="system-logs-page">
      <div className="system-logs-heading">
        <h1>System logs</h1>
        <p>Review processing events, errors and service activity.</p>
      </div>

      <div className="system-logs-toolbar">
        <div className="system-logs-search">
          <span>⌕</span>
          <input
            type="text"
            placeholder="Search event, user or request ID"
            value={search}
            onChange={handleSearch}
          />
        </div>

        <select
          value={timeFilter}
          onChange={handleTimeFilter}
          aria-label="Filter by time"
        >
          {TIME_FILTERS.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>

        <select
          value={severityFilter}
          onChange={handleSeverityFilter}
          aria-label="Filter by severity"
        >
          {SEVERITIES.map((severity) => (
            <option key={severity} value={severity}>
              {severity}
            </option>
          ))}
        </select>

        <button
          className="system-logs-export"
          onClick={exportCSV}
          disabled={loading || Boolean(error)}
        >
          <span>↓</span> Export CSV
        </button>
      </div>

      <div className="system-logs-legend">
        {SEVERITIES.slice(1).map((severity) => (
          <span key={severity} className="system-logs-legend-item">
            <span className={`system-logs-dot ${severity.toLowerCase()}`} />
            {severity}
          </span>
        ))}
      </div>

      <div className="system-logs-table-card">
        <div className="system-logs-table-wrapper">
          <table className="system-logs-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Severity</th>
                <th>Event</th>
                <th>Source</th>
                <th>Details</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="system-logs-empty">
                    Loading system logs...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="5" className="system-logs-empty">
                    {error}
                  </td>
                </tr>
              ) : visibleLogs.length > 0 ? (
                visibleLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={selectedLog?.id === log.id ? "selected" : ""}
                    onClick={() => setSelectedLog(log)}
                  >
                    <td>{formatTimestamp(log.timestamp)}</td>

                    <td>
                      <span
                        className={`system-logs-severity ${log.severity.toLowerCase()}`}
                      >
                        <span className="system-logs-dot" />
                        {log.severity}
                      </span>
                    </td>

                    <td className="system-logs-event">{log.event}</td>
                    <td>{log.source}</td>
                    <td>Request ID: {log.requestId || "N/A"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="system-logs-empty">
                    No logs found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="system-logs-table-footer">
          Showing{" "}
          {filteredLogs.length === 0
            ? 0
            : (currentPage - 1) * entriesPerPage + 1}
          –
          {Math.min(currentPage * entriesPerPage, filteredLogs.length)} of{" "}
          {filteredLogs.length} logs

          <div className="system-logs-pagination">
            <button
              disabled={currentPage === 1 || loading || Boolean(error)}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .slice(0, 5)
              .map((page) => (
                <button
                  key={page}
                  className={currentPage === page ? "active" : ""}
                  disabled={loading || Boolean(error)}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}

            <button
              disabled={
                currentPage === totalPages || loading || Boolean(error)
              }
              onClick={() => handlePageChange(currentPage + 1)}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {selectedLog && !error && (
        <div className="system-logs-failure-card">
          <div className="system-logs-failure-heading">
            <h3>Log details</h3>

            <span
              className={`system-logs-severity ${selectedLog.severity.toLowerCase()}`}
            >
              <span className="system-logs-dot" />
              {selectedLog.severity}
            </span>
          </div>

          <p>{selectedLog.details}</p>

          <div className="system-logs-failure-meta">
            <span>Request ID: {selectedLog.requestId || "N/A"}</span>
            <span>Source: {selectedLog.source}</span>
            <button onClick={() => setSelectedLog(null)}>Close</button>
          </div>
        </div>
      )}

      <div className="system-logs-data-note">
        {loading
          ? "Retrieving system activity from the database..."
          : error
            ? "System activity could not be retrieved."
            : `Showing ${logs.length} real database log entries.`}
      </div>
    </div>
  );
}

export default SystemLogs;
