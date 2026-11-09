import { useMemo, useState } from "react";
import "./ProcessingActivity.css";

const INITIAL_JOBS = [
  {
    id: "REQ-2605-018",
    source: "Camera",
    submitted: "10:42:16",
    duration: "00:24",
    processingTime: "Waiting",
    status: "Pending",
    date: "2026-11-05",
  },
  {
    id: "REQ-2605-017",
    source: "Upload",
    submitted: "10:41:58",
    duration: "00:32",
    processingTime: "00:18",
    status: "Processing",
    date: "2026-11-05",
  },
  {
    id: "REQ-2605-016",
    source: "Camera",
    submitted: "10:40:12",
    duration: "00:18",
    processingTime: "00:09",
    status: "Completed",
    date: "2026-11-05",
  },
  {
    id: "REQ-2605-015",
    source: "Upload",
    submitted: "10:39:46",
    duration: "00:24",
    processingTime: "00:04",
    status: "Failed",
    date: "2026-11-05",
  },
  {
    id: "REQ-2605-014",
    source: "Upload",
    submitted: "10:38:22",
    duration: "00:21",
    processingTime: "00:11",
    status: "Completed",
    date: "2026-11-05",
  },
];

const STATUS_OPTIONS = [
  "All statuses",
  "Pending",
  "Processing",
  "Completed",
  "Failed",
];

function ProcessingActivity() {
  const [jobs] = useState(INITIAL_JOBS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [dateFilter, setDateFilter] = useState("2026-11-05");
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    status: "All statuses",
    date: "2026-11-05",
  });

  const [selectedJob, setSelectedJob] = useState(
    INITIAL_JOBS.find((job) => job.status === "Failed")
  );

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
      search,
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

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
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

  const formatDate = (date) => {
    if (!date) return "All dates";

    return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="processing-page">
      {/* Page heading */}
      <div className="processing-heading">
        <h1>Translation &amp; processing activity</h1>
        <p>
          Sample data · 5 November 2026 · Times shown in Pakistan Standard
          Time (PKT).
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
              <option key={status}>{status}</option>
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

      {/* Recent jobs table */}
      <section className="processing-table-card">
        <div className="processing-table-heading">
          <h2>Queue &amp; recent jobs</h2>
          <span>{filteredJobs.length} requests</span>
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
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <tr
                    key={job.id}
                    className={job.status === "Failed" ? "failed-row" : ""}
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
                    No processing requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="processing-table-footer">
          Completed means processing finished; it does not mean the
          translation is expert/community validated.
        </div>
      </section>

      {/* Failure details */}
      {selectedJob && selectedJob.status === "Failed" && (
        <div className="processing-error-panel">
          <div className="processing-error-heading">
            <span className="processing-error-icon">!</span>
            <strong>
              {selectedJob.id} · Video could not be decoded
            </strong>
          </div>

          <p>
            <strong>UNSUPPORTED_VIDEO</strong> — Processing stopped after{" "}
            {selectedJob.processingTime}. Ask the user to export a playable
            video and upload it again. No translation was produced.
          </p>
        </div>
      )}

      {selectedJob && selectedJob.status !== "Failed" && (
        <div className="processing-selected-panel">
          <strong>{selectedJob.id}</strong>
          <span>
            Selected request status: {selectedJob.status}. No additional
            failure details are available.
          </span>
        </div>
      )}
    </div>
  );
}

export default ProcessingActivity;