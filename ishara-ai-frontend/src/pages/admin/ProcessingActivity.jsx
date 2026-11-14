import { useEffect, useMemo, useState } from "react";
import { getAllProcessingActivities } from "../../api/admin";
import "./ProcessingActivity.css";

const STATUS_OPTIONS = [
  "All statuses",
  "Pending",
  "Processing",
  "Completed",
  "Failed",
];

function getStatusLabel(status) {
  return status
    ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    : "Unknown";
}

function getPKTParts(dateValue) {
  if (!dateValue) return null;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function formatPKTDate(dateValue) {
  const parts = getPKTParts(dateValue);
  if (!parts) return "—";

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function formatPKTTime(dateValue) {
  const parts = getPKTParts(dateValue);
  if (!parts) return "—";

  return `${parts.hour}:${parts.minute}:${parts.second}`;
}

function formatDisplayDate(date) {
  if (!date) return "All dates";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return "—";

  const totalSeconds = Math.max(0, Math.floor(Number(seconds)));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

function formatProcessingTime(seconds, status) {
  if (seconds !== null && seconds !== undefined) {
    return formatDuration(seconds);
  }

  if (status === "pending") return "Waiting";
  if (status === "processing") return "In progress";

  return "—";
}

function mapActivity(activity) {
  const status = getStatusLabel(activity.status);

  return {
    id: activity.request_id,
    activityId: activity.id,
    source:
      activity.input_source === "camera"
        ? "Camera"
        : activity.input_source === "upload"
          ? "Upload"
          : activity.input_source || "—",
    submitted: formatPKTTime(activity.created_at),
    duration: formatDuration(activity.clip_duration_seconds),
    processingTime: formatProcessingTime(
      activity.processing_time_seconds,
      activity.status
    ),
    status,
    date: formatPKTDate(activity.created_at),
    errorMessage: activity.error_message,
    createdAt: activity.created_at,
  };
}

function ProcessingActivity() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [dateFilter, setDateFilter] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    status: "All statuses",
    date: "",
  });

  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadActivities() {
      try {
        setLoading(true);
        setError("");

        const data = await getAllProcessingActivities();

        if (!isMounted) return;

        const records = Array.isArray(data) ? data : [];
        const mappedJobs = records.map(mapActivity);

        setJobs(mappedJobs);

        setSelectedJob((currentSelected) => {
          if (!currentSelected) {
            return (
              mappedJobs.find((job) => job.status === "Failed") ||
              mappedJobs[0] ||
              null
            );
          }

          return (
            mappedJobs.find(
              (job) => job.activityId === currentSelected.activityId
            ) || null
          );
        });
      } catch (err) {
        if (isMounted) {
          setError(
            err.message || "Unable to load processing activity records."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadActivities();

    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    return {
      Pending: jobs.filter((job) => job.status === "Pending").length,
      Processing: jobs.filter((job) => job.status === "Processing").length,
      Completed: jobs.filter((job) => job.status === "Completed").length,
      Failed: jobs.filter((job) => job.status === "Failed").length,
    };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch = job.id
        .toLowerCase()
        .includes(appliedFilters.search.toLowerCase());

      const matchesStatus =
        appliedFilters.status === "All statuses" ||
        job.status === appliedFilters.status;

      const matchesDate =
        !appliedFilters.date || job.date === appliedFilters.date;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [jobs, appliedFilters]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      search: search.trim(),
      status: statusFilter,
      date: dateFilter,
    });
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("All statuses");
    setDateFilter("");

    setAppliedFilters({
      search: "",
      status: "All statuses",
      date: "",
    });
  };

  const handleExportCSV = () => {
    const headers = [
      "Request ID",
      "Source",
      "Submitted (PKT)",
      "Clip duration",
      "Processing time",
      "Status",
      "Date",
    ];

    const rows = filteredJobs.map((job) => [
      job.id,
      job.source,
      job.submitted,
      job.duration,
      job.processingTime,
      job.status,
      job.date,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "ishara-processing-activity.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="processing-page">
      {/* Page heading */}
      <div className="processing-heading">
        <h1>Translation &amp; processing activity</h1>
        <p>
          Live processing records · {formatDisplayDate(appliedFilters.date)} ·
          Times shown in Pakistan Standard Time (PKT).
        </p>
      </div>

      {/* Summary cards */}
      <div className="processing-summary-grid">
        <div className="processing-summary-card">
          <div className="processing-summary-top">
            <span>Pending</span>
            <strong>{summary.Pending}</strong>
          </div>
          <p>Waiting in queue</p>
        </div>

        <div className="processing-summary-card">
          <div className="processing-summary-top">
            <span>Processing</span>
            <strong>{summary.Processing}</strong>
          </div>
          <p>Video being processed</p>
        </div>

        <div className="processing-summary-card">
          <div className="processing-summary-top">
            <span>Completed</span>
            <strong>{summary.Completed}</strong>
          </div>
          <p>Processing finished</p>
        </div>

        <div className="processing-summary-card">
          <div className="processing-summary-top">
            <span>Failed</span>
            <strong>{summary.Failed}</strong>
          </div>
          <p>Needs attention</p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="processing-filter-section">
        <div className="processing-filter-field processing-search-field">
          <label htmlFor="processing-search">Find a request</label>
          <input
            id="processing-search"
            type="text"
            placeholder="Search request ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleApplyFilters();
            }}
          />
        </div>

        <div className="processing-filter-field">
          <label htmlFor="processing-status">Status</label>
          <select
            id="processing-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="processing-filter-field">
          <label htmlFor="processing-date">Date</label>
          <input
            id="processing-date"
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
          />
        </div>

        <button
          type="button"
          className="processing-apply-btn"
          onClick={handleApplyFilters}
        >
          Apply filters
        </button>

        <button
          type="button"
          className="processing-reset-btn"
          onClick={handleResetFilters}
        >
          Reset
        </button>
      </div>

      {/* API error */}
      {error && (
        <div className="processing-error-panel">
          <div className="processing-error-heading">
            <span className="processing-error-icon">!</span>
            <strong>Unable to load processing activity</strong>
          </div>
          <p>{error}</p>
        </div>
      )}

      {/* Recent jobs table */}
      <section className="processing-table-card">
        <div className="processing-table-heading">
          <h2>Queue &amp; recent jobs</h2>
          <div>
            <span>{filteredJobs.length} requests</span>
            <button
              type="button"
              className="processing-apply-btn"
              onClick={handleExportCSV}
              disabled={loading || filteredJobs.length === 0}
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="processing-table-wrapper">
          <table className="processing-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Source</th>
                <th>Submitted (PKT)</th>
                <th>Clip duration</th>
                <th>Processing time</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="processing-empty">
                    Loading processing activities...
                  </td>
                </tr>
              ) : filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <tr
                    key={job.activityId}
                    className={[
                      job.status === "Failed" ? "failed-row" : "",
                      selectedJob?.activityId === job.activityId
                        ? "selected-row"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setSelectedJob(job)}
                  >
                    <td className="processing-request-id">{job.id}</td>
                    <td>{job.source}</td>
                    <td>{job.submitted}</td>
                    <td>{job.duration}</td>
                    <td>{job.processingTime}</td>
                    <td>
                      <span
                        className={`processing-status-badge ${job.status.toLowerCase()}`}
                      >
                        <span className="processing-status-dot" />
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="processing-empty">
                    {jobs.length === 0
                      ? "No processing activity records are available yet."
                      : "No processing requests match your filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="processing-table-footer">
          Completed means PSL processing finished; it does not mean the result
          is expert/community validated.
        </div>
      </section>

      {/* Selected request details */}
      {selectedJob && selectedJob.status === "Failed" && (
        <div className="processing-error-panel">
          <div className="processing-error-heading">
            <span className="processing-error-icon">!</span>
            <strong>{selectedJob.id} · Processing failed</strong>
          </div>

          <p>
            {selectedJob.errorMessage ||
              "No failure details were provided for this request."}
          </p>
        </div>
      )}

      {selectedJob && selectedJob.status !== "Failed" && (
        <div className="processing-selected-panel">
          <strong>{selectedJob.id}</strong>
          <span>
            Selected request status: {selectedJob.status}.{" "}
            {selectedJob.status === "Completed"
              ? "PSL processing has finished."
              : "No failure details are available."}
          </span>
        </div>
      )}
    </div>
  );
}

export default ProcessingActivity;