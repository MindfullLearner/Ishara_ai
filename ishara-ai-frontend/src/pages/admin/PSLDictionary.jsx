
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllPSLSigns,
  updatePSLSign,
  deletePSLSign,
} from "../../api/admin";
import "./PSLDictionary.css";

const FILTERS = [
  "All",
  "Greetings",
  "Food",
  "Travel",
  "Draft",
  "Reviewed",
];

function formatDate(dateValue) {
  if (!dateValue) return "—";

  return new Date(dateValue).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function PSLDictionary() {
  const navigate = useNavigate();

  const [signs, setSigns] = useState([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const entriesPerPage = 7;

  // Load dictionary entries from the backend.
  useEffect(() => {
    let isMounted = true;

    async function loadSigns() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getAllPSLSigns();

        if (isMounted) {
          setSigns(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Unable to load PSL dictionary entries.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSigns();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredSigns = useMemo(() => {
    return signs.filter((sign) => {
      const searchText = search.toLowerCase();

      const word = (sign.word || "").toLowerCase();
      const description = (sign.description || "").toLowerCase();
      const category = (sign.category || "").toLowerCase();

      const matchesSearch =
        word.includes(searchText) ||
        description.includes(searchText);

      const matchesFilter =
        activeFilter === "All" ||
        (activeFilter === "Food" &&
          category === "food & drink") ||
        (activeFilter === "Draft" &&
          sign.status === "draft") ||
        (activeFilter === "Reviewed" &&
          sign.status === "reviewed") ||
        category === activeFilter.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [signs, search, activeFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSigns.length / entriesPerPage)
  );

  const visibleSigns = filteredSigns.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const handleStatusUpdate = async (sign) => {
    const newStatus =
      sign.status === "reviewed" ? "draft" : "reviewed";

    try {
      setProcessingId(sign.id);
      setActionError("");

      const updatedSign = await updatePSLSign(sign.id, {
        word: sign.word,
        description: sign.description || "",
        category: sign.category,
        video_url: sign.video_url || null,
        image_url: sign.image_url || null,
        status: newStatus,
      });

      setSigns((previous) =>
        previous.map((item) =>
          item.id === sign.id ? updatedSign : item
        )
      );
    } catch (err) {
      setActionError(err.message || "Unable to update sign status.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this sign entry?"
    );

    if (!confirmed) return;

    try {
      setProcessingId(id);
      setActionError("");

      await deletePSLSign(id);

      const updatedSigns = signs.filter(
        (sign) => sign.id !== id
      );

      setSigns(updatedSigns);

      const remainingCount = updatedSigns.filter((sign) => {
        const searchText = search.toLowerCase();

        const matchesSearch =
          (sign.word || "").toLowerCase().includes(searchText) ||
          (sign.description || "").toLowerCase().includes(searchText);

        const category = (sign.category || "").toLowerCase();

        const matchesFilter =
          activeFilter === "All" ||
          (activeFilter === "Food" && category === "food & drink") ||
          (activeFilter === "Draft" && sign.status === "draft") ||
          (activeFilter === "Reviewed" && sign.status === "reviewed") ||
          category === activeFilter.toLowerCase();

        return matchesSearch && matchesFilter;
      }).length;

      const newTotalPages = Math.max(
        1,
        Math.ceil(remainingCount / entriesPerPage)
      );

      setCurrentPage((page) => Math.min(page, newTotalPages));
    } catch (err) {
      setActionError(err.message || "Unable to delete sign entry.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="psl-dictionary-page">
      <div className="psl-page-heading">
        <div>
          <h1>PSL sign dictionary</h1>
          <p>
            Manage approved signs, glosses, video references and review
            status.
          </p>
        </div>

        <button
          className="psl-primary-btn"
          onClick={() => navigate("/admin/psl-dictionary/add")}
        >
          + Add sign entry
        </button>
      </div>

      {error && (
        <p className="psl-form-error" role="alert">
          {error}
        </p>
      )}

      {actionError && (
        <p className="psl-form-error" role="alert">
          {actionError}
        </p>
      )}

      <div className="psl-search-section">
        <label htmlFor="psl-search">Search signs</label>

        <div className="psl-search-and-filters">
          <input
            id="psl-search"
            type="text"
            placeholder="Search sign or English meaning"
            value={search}
            onChange={handleSearchChange}
          />

          <div className="psl-filter-buttons">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                className={activeFilter === filter ? "active" : ""}
                onClick={() => handleFilterChange(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="psl-table-card">
        <div className="psl-table-wrapper">
          <table className="psl-table">
            <thead>
              <tr>
                <th>Sign label</th>
                <th>Category</th>
                <th>Update date</th>
                <th>Review status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="psl-empty-state">
                    Loading PSL dictionary entries...
                  </td>
                </tr>
              ) : visibleSigns.length > 0 ? (
                visibleSigns.map((sign) => (
                  <tr key={sign.id}>
                    <td className="psl-sign-label">
                      {sign.word}
                    </td>

                    <td>{sign.category}</td>

                    <td>
                      {formatDate(sign.updated_at || sign.created_at)}
                    </td>

                    <td>
                      <span
                        className={`psl-status-badge ${
                          sign.status === "draft"
                            ? "draft"
                            : "reviewed"
                        }`}
                      >
                        {sign.status === "draft" ? "Draft" : "Reviewed"}
                      </span>
                    </td>

                    <td>
                      <div className="psl-action-buttons">
                        <button
                          className="psl-action-btn"
                          onClick={() =>
                            navigate(`/admin/psl-dictionary/edit/${sign.id}`)
                          }
                          disabled={processingId === sign.id}
                        >
                          Edit
                        </button>

                        <button
                          className="psl-action-btn"
                          onClick={() => handleStatusUpdate(sign)}
                          disabled={processingId === sign.id}
                        >
                          {processingId === sign.id
                            ? "Saving..."
                            : "Update"}
                        </button>

                        <button
                          className="psl-action-btn delete"
                          onClick={() => handleDelete(sign.id)}
                          disabled={processingId === sign.id}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="psl-empty-state">
                    {error
                      ? "Could not load sign entries."
                      : "No sign entries found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="psl-table-footer">
          <span>
            Showing{" "}
            {filteredSigns.length === 0
              ? 0
              : (currentPage - 1) * entriesPerPage + 1}
            –
            {Math.min(
              currentPage * entriesPerPage,
              filteredSigns.length
            )}{" "}
            of {filteredSigns.length} entries
          </span>

          <div className="psl-pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => page - 1)}
            >
              ‹
            </button>

            {Array.from(
              { length: totalPages },
              (_, index) => index + 1
            )
              .slice(0, 5)
              .map((page) => (
                <button
                  key={page}
                  className={currentPage === page ? "active" : ""}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => page + 1)}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="psl-data-note">
        <span className="psl-note-dot"></span>
        Connected to the ISHARA AI database
      </div>
    </div>
  );
}

export default PSLDictionary;
