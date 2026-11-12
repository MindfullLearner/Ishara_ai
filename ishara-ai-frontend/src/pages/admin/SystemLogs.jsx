import { useMemo, useState } from "react";
import "./SystemLogs.css";

const createLogs = () => {
  const now = Date.now();

  const sampleLogs = [
    {
      id: 1,
      hoursAgo: 1,
      severity: "INFO",
      event: "Translation job completed",
      source: "Translate API",
      requestId: "ISH-00142",
      details: "The translation request was completed successfully.",
    },
    {
      id: 2,
      hoursAgo: 2,
      severity: "WARN",
      event: "Video upload received",
      source: "Media Ingest",
      requestId: "ISH-00143",
      details: "A new video was received and is waiting for processing.",
    },
    {
      id: 3,
      hoursAgo: 3,
      severity: "INFO",
      event: "User signed in",
      source: "Auth Service",
      requestId: "ISH-00144",
      details: "A user successfully signed in.",
    },
    {
      id: 4,
      hoursAgo: 5,
      severity: "INFO",
      event: "Dictionary record updated",
      source: "PSL Dictionary",
      requestId: "ISH-00145",
      details: "A PSL dictionary record was updated.",
    },
    {
      id: 5,
      hoursAgo: 7,
      severity: "ERROR",
      event: "Processing timeout resolved",
      source: "Worker Queue",
      requestId: "ISH-00146",
      details: "A processing task exceeded its expected execution time.",
    },
    {
      id: 6,
      hoursAgo: 9,
      severity: "ERROR",
      event: "Sign language model inference failed",
      source: "Inference API",
      requestId: "ISH-00147",
      details: "The inference service returned an unexpected processing error.",
    },
    {
      id: 7,
      hoursAgo: 12,
      severity: "CRITICAL",
      event: "Database connection retry limit reached",
      source: "Database Proxy",
      requestId: "ISH-00148",
      details: "The database connection could not be restored after multiple retries.",
    },
    {
      id: 8,
      hoursAgo: 15,
      severity: "WARN",
      event: "Knowledge base sync delayed",
      source: "Knowledge Base",
      requestId: "ISH-00149",
      details: "The knowledge base synchronization took longer than expected.",
    },
    {
      id: 9,
      hoursAgo: 18,
      severity: "INFO",
      event: "Admin profile updated",
      source: "Auth Service",
      requestId: "ISH-00150",
      details: "An administrator updated profile information.",
    },
    {
      id: 10,
      hoursAgo: 22,
      severity: "WARN",
      event: "Media processing queue increased",
      source: "Media Ingest",
      requestId: "ISH-00151",
      details: "The media processing queue is above its normal size.",
    },
    {
      id: 11,
      hoursAgo: 30,
      severity: "ERROR",
      event: "Translation request failed",
      source: "Translate API",
      requestId: "ISH-00152",
      details: "The translation service could not process the request.",
    },
    {
      id: 12,
      hoursAgo: 40,
      severity: "INFO",
      event: "New dictionary sign created",
      source: "PSL Dictionary",
      requestId: "ISH-00153",
      details: "A new PSL sign draft was created.",
    },
    {
      id: 13,
      hoursAgo: 55,
      severity: "CRITICAL",
      event: "Worker service unavailable",
      source: "Worker Queue",
      requestId: "ISH-00154",
      details: "The worker service became temporarily unavailable.",
    },
    {
      id: 14,
      hoursAgo: 80,
      severity: "INFO",
      event: "Knowledge base article updated",
      source: "Knowledge Base",
      requestId: "ISH-00155",
      details: "An article was updated successfully.",
    },
    {
      id: 15,
      hoursAgo: 120,
      severity: "WARN",
      event: "Authentication retry detected",
      source: "Auth Service",
      requestId: "ISH-00156",
      details: "Multiple authentication attempts were detected.",
    },
    {
      id: 16,
      hoursAgo: 160,
      severity: "ERROR",
      event: "Media validation failed",
      source: "Media Ingest",
      requestId: "ISH-00157",
      details: "The uploaded media did not pass validation.",
    },
  ];

  return sampleLogs.map((log) => ({
    ...log,
    timestamp: new Date(now - log.hoursAgo * 60 * 60 * 1000),
  }));
};

const INITIAL_LOGS = createLogs();

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
  const [logs] = useState(INITIAL_LOGS);
  const [referenceTime] = useState(() => Date.now());
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("24");
  const [severityFilter, setSeverityFilter] = useState("All severities");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);

  const entriesPerPage = 8;

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
        <p>
          Review processing events, errors and service activity. · Example data
        </p>
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

        <button className="system-logs-export" onClick={exportCSV}>
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
              {visibleLogs.length > 0 ? (
                visibleLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={
                      selectedLog?.id === log.id
                        ? "selected"
                        : ""
                    }
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
                    <td>Request ID: {log.requestId}</td>
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
              disabled={currentPage === 1}
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
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {selectedLog && (
        <div className="system-logs-failure-card">
          <div className="system-logs-failure-heading">
            <h3>Failure details</h3>

            <span
              className={`system-logs-severity ${selectedLog.severity.toLowerCase()}`}
            >
              <span className="system-logs-dot" />
              {selectedLog.severity}
            </span>
          </div>

          <p>{selectedLog.details}</p>

          <div className="system-logs-failure-meta">
            <span>Request ID: {selectedLog.requestId}</span>
            <span>Source: {selectedLog.source}</span>
            <button onClick={() => setSelectedLog(null)}>Close</button>
          </div>
        </div>
      )}

      <div className="system-logs-data-note">
        Showing example system activity. No real personal data is included.
      </div>
    </div>
  );
}

export default SystemLogs;
