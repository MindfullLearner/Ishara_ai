
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllKnowledgeArticles,
  updateKnowledgeArticle,
  deleteKnowledgeArticle,
} from "../../api/admin";
import "./KnowledgeBase.css";

const CATEGORIES = [
  "All categories",
  "Translation",
  "Recording",
  "Policy",
  "Support",
  "PSL dictionary",
  "Video guidance",
];

const STATUSES = ["All statuses", "Published", "Draft"];

function formatDate(dateValue) {
  if (!dateValue) return "Not available";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function displayStatus(status) {
  return status?.toLowerCase() === "published" ? "Published" : "Draft";
}

function KnowledgeBase() {
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [status, setStatus] = useState("All statuses");
  const [sortOrder, setSortOrder] = useState("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const [manageArticle, setManageArticle] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const articlesPerPage = 6;

  // Fetch articles from the backend.
  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllKnowledgeArticles();

      setArticles(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.message || "Unable to load Knowledge Base articles."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // Search, filter and sort articles.
  const filteredArticles = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    const result = articles.filter((article) => {
      const matchesSearch =
        article.title?.toLowerCase().includes(searchText) ||
        article.category?.toLowerCase().includes(searchText) ||
        article.content?.toLowerCase().includes(searchText);

      const matchesCategory =
        category === "All categories" ||
        article.category === category;

      const matchesStatus =
        status === "All statuses" ||
        displayStatus(article.status) === status;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    return [...result].sort((a, b) => {
      if (sortOrder === "alphabetical") {
        return (a.title || "").localeCompare(b.title || "");
      }

      const dateA = new Date(a.updated_at || a.created_at).getTime() || 0;
      const dateB = new Date(b.updated_at || b.created_at).getTime() || 0;

      if (sortOrder === "oldest") {
        return dateA - dateB;
      }

      return dateB - dateA;
    });
  }, [articles, search, category, status, sortOrder]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredArticles.length / articlesPerPage)
  );

  const visibleArticles = filteredArticles.slice(
    (currentPage - 1) * articlesPerPage,
    currentPage * articlesPerPage
  );

  // Change article status through the backend.
  const handleStatusChange = async (article) => {
    const newStatus =
      article.status === "published" ? "draft" : "published";

    try {
      setActionLoading(true);
      setError("");

      const updatedArticle = await updateKnowledgeArticle(article.id, {
        title: article.title,
        content: article.content,
        category: article.category,
        status: newStatus,
      });

      setArticles((previous) =>
        previous.map((item) =>
          item.id === article.id ? updatedArticle : item
        )
      );

      setManageArticle(updatedArticle);
    } catch (err) {
      setError(err.message || "Unable to update article status.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete article through the backend.
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this article?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");

      await deleteKnowledgeArticle(id);

      const updatedArticles = articles.filter(
        (article) => article.id !== id
      );

      setArticles(updatedArticles);
      setManageArticle(null);

      const filteredCount = updatedArticles.filter((article) => {
        const searchText = search.trim().toLowerCase();

        const matchesSearch =
          article.title?.toLowerCase().includes(searchText) ||
          article.category?.toLowerCase().includes(searchText) ||
          article.content?.toLowerCase().includes(searchText);

        const matchesCategory =
          category === "All categories" ||
          article.category === category;

        const matchesStatus =
          status === "All statuses" ||
          displayStatus(article.status) === status;

        return matchesSearch && matchesCategory && matchesStatus;
      }).length;

      const newTotalPages = Math.max(
        1,
        Math.ceil(filteredCount / articlesPerPage)
      );

      setCurrentPage((page) => Math.min(page, newTotalPages));
    } catch (err) {
      setError(err.message || "Unable to delete article.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  const handleCategory = (event) => {
    setCategory(event.target.value);
    setCurrentPage(1);
  };

  const handleStatus = (event) => {
    setStatus(event.target.value);
    setCurrentPage(1);
  };

  const handleSort = (event) => {
    setSortOrder(event.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="knowledge-page">
      <div className="knowledge-heading">
        <div>
          <h1>Knowledge base</h1>
          <p>
            Maintain trusted learning resources and platform guidance.
          </p>
        </div>
      </div>

      {error && (
        <div className="knowledge-empty" role="alert">
          {error}
          <button type="button" onClick={fetchArticles}>
            Retry
          </button>
        </div>
      )}

      <div className="knowledge-toolbar">
        <div className="knowledge-search">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search articles, categories, or keywords"
            value={search}
            onChange={handleSearch}
          />
        </div>

        <select
          value={category}
          onChange={handleCategory}
          aria-label="Filter by category"
        >
          {CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={handleStatus}
          aria-label="Filter by status"
        >
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <button
          className="knowledge-add-btn"
          onClick={() => navigate("/admin/knowledge-base/add")}
        >
          + Add article
        </button>
      </div>

      <div className="knowledge-list-info">
        <span>
          {loading ? "Loading articles..." : `${filteredArticles.length} articles`}
        </span>

        <select
          value={sortOrder}
          onChange={handleSort}
          aria-label="Sort articles"
          className="knowledge-sort"
        >
          <option value="recent">Updated recently</option>
          <option value="oldest">Oldest first</option>
          <option value="alphabetical">Alphabetical</option>
        </select>
      </div>

      <div className="knowledge-article-list">
        {loading ? (
          <div className="knowledge-empty">
            Loading Knowledge Base articles...
          </div>
        ) : visibleArticles.length > 0 ? (
          visibleArticles.map((article) => (
            <article className="knowledge-article" key={article.id}>
              <div className="knowledge-article-info">
                <h3>{article.title}</h3>

                <div className="knowledge-article-meta">
                  <span className="knowledge-category">
                    {article.category}
                  </span>

                  <span>
                    Updated {formatDate(article.updated_at || article.created_at)}
                  </span>
                </div>
              </div>

              <div className="knowledge-article-actions">
                <span
                  className={`knowledge-status ${displayStatus(article.status).toLowerCase()}`}
                >
                  {displayStatus(article.status)}
                </span>

                <button
                  className="knowledge-action-btn edit"
                  onClick={() =>
                    navigate(`/admin/knowledge-base/edit/${article.id}`)
                  }
                >
                  <span>✎</span> Edit
                </button>

                <button
                  className="knowledge-action-btn"
                  onClick={() => setManageArticle(article)}
                >
                  ··· Manage
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="knowledge-empty">
            No articles found. Try changing your search or filters.
          </div>
        )}
      </div>

      <div className="knowledge-footer">
        <span>
          Showing{" "}
          {filteredArticles.length === 0
            ? 0
            : (currentPage - 1) * articlesPerPage + 1}
          {" – "}
          {Math.min(
            currentPage * articlesPerPage,
            filteredArticles.length
          )}{" "}
          of {filteredArticles.length} articles
        </span>

        <div className="knowledge-pagination">
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

      {manageArticle && (
        <div
          className="knowledge-modal-overlay"
          onClick={() => {
            if (!actionLoading) setManageArticle(null);
          }}
        >
          <div
            className="knowledge-modal knowledge-manage-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="knowledge-modal-heading">
              <h2>Manage article</h2>

              <button
                type="button"
                onClick={() => setManageArticle(null)}
                disabled={actionLoading}
              >
                ×
              </button>
            </div>

            <h3>{manageArticle.title}</h3>

            <p>
              {manageArticle.content?.length > 250
                ? `${manageArticle.content.slice(0, 250)}...`
                : manageArticle.content}
            </p>

            <div className="knowledge-manage-details">
              <span>Category: {manageArticle.category}</span>
              <span>Status: {displayStatus(manageArticle.status)}</span>
              <span>
                Updated: {formatDate(manageArticle.updated_at || manageArticle.created_at)}
              </span>
              <span>Article ID: KB-00{manageArticle.id}</span>
            </div>

            <div className="knowledge-modal-actions">
              <button
                className="knowledge-cancel-btn"
                onClick={() => handleDelete(manageArticle.id)}
                disabled={actionLoading}
              >
                {actionLoading ? "Please wait..." : "Delete"}
              </button>

              <button
                className="knowledge-cancel-btn"
                onClick={() => handleStatusChange(manageArticle)}
                disabled={actionLoading}
              >
                {actionLoading
                  ? "Please wait..."
                  : manageArticle.status === "published"
                    ? "Move to draft"
                    : "Publish"}
              </button>

              <button
                className="knowledge-add-btn"
                onClick={() =>
                  navigate(
                    `/admin/knowledge-base/edit/${manageArticle.id}`
                  )
                }
                disabled={actionLoading}
              >
                Edit article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KnowledgeBase;
