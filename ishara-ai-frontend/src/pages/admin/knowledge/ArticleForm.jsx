
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminDemoNotice from "../../../components/admin/AdminDemoNotice";
import "./ArticleForm.css";

const CATEGORIES = [
  "Video guidance",
  "Translation",
  "Recording",
  "Policy",
  "Support",
  "PSL dictionary",
];

const INITIAL_FORM = {
  title: "",
  summary: "",
  body: "",
  category: "Video guidance",
  status: "Draft",
};

function ArticleForm({ mode = "add", article = null }) {
  const navigate = useNavigate();
  const isEdit = mode === "edit";
  const [formData, setFormData] = useState(() =>
    isEdit && article
      ? {
        title: article.title || "",
        summary: article.summary || article.description || "",
        body: article.body || article.description || "",
        category: article.category || "Video guidance",
        status: article.status || "Draft",
      }
      : INITIAL_FORM
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const insertFormatting = (tag) => {
    const textarea = document.getElementById("article-body");

    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.body.slice(start, end);

    let formattedText = selectedText;

    if (tag === "bold") {
      formattedText = `**${selectedText || "bold text"}**`;
    } else if (tag === "italic") {
      formattedText = `*${selectedText || "italic text"}*`;
    } else if (tag === "underline") {
      formattedText = `<u>${selectedText || "underlined text"}</u>`;
    } else if (tag === "bullet") {
      formattedText = `\n• ${selectedText || "List item"}`;
    } else if (tag === "link") {
      formattedText = `[${selectedText || "Link text"}](https://example.com)`;
    }

    const updatedBody =
      formData.body.slice(0, start) +
      formattedText +
      formData.body.slice(end);

    setFormData((previous) => ({
      ...previous,
      body: updatedBody,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.title.trim() || !formData.summary.trim() || !formData.body.trim()) {
      return;
    }

    const savedArticles = JSON.parse(
      localStorage.getItem("isharaKnowledgeArticles") || "[]"
    );

    const now = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    if (isEdit && article) {
      const updatedArticle = {
        ...article,
        ...formData,
        description: formData.summary,
        date: now,
      };

      const updatedArticles = savedArticles.map((item) =>
        String(item.id) === String(article.id) ? updatedArticle : item
      );

      localStorage.setItem(
        "isharaKnowledgeArticles",
        JSON.stringify(updatedArticles)
      );
    } else {
      const newArticle = {
        id: Date.now(),
        ...formData,
        description: formData.summary,
        date: now,
      };

      localStorage.setItem(
        "isharaKnowledgeArticles",
        JSON.stringify([newArticle, ...savedArticles])
      );
    }

    navigate("/admin/knowledge-base");
  };

  return (
    <div className="article-form-page">
      <AdminDemoNotice>
        Article changes are saved in this browser only and are not sent to a backend API.
      </AdminDemoNotice>
      <button
        type="button"
        className="article-back-link"
        onClick={() => navigate("/admin/knowledge-base")}
      >
        ← Knowledge base
      </button>

      <div className="article-page-heading">
        <h1>{isEdit ? "Edit article" : "Add article"}</h1>
        <p>
          {isEdit
            ? "Update existing guidance and review its publication status before saving."
            : "Write practical, accessible guidance for people using Ishara AI."}
        </p>
      </div>

      <form className="article-form-layout" onSubmit={handleSubmit}>
        <section className="article-form-main">
          <div className="article-form-card">
            <h2>Article details</h2>

            <div className="article-field">
              <label htmlFor="article-title">Title *</label>
              <input
                id="article-title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter a clear article title"
                required
              />
            </div>

            <div className="article-field">
              <label htmlFor="article-summary">Summary *</label>
              <textarea
                id="article-summary"
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                placeholder="Write a short summary of this article"
                rows="2"
                required
              />
            </div>

            <div className="article-field">
              <label htmlFor="article-body">Article body *</label>

              <div className="article-editor">
                <div className="article-editor-toolbar">
                  <span>Paragraph</span>

                  <button type="button" onClick={() => insertFormatting("bold")} title="Bold">
                    <b>B</b>
                  </button>

                  <button type="button" onClick={() => insertFormatting("italic")} title="Italic">
                    <i>I</i>
                  </button>

                  <button type="button" onClick={() => insertFormatting("underline")} title="Underline">
                    <u>U</u>
                  </button>

                  <button type="button" onClick={() => insertFormatting("bullet")} title="Bullet">
                    •
                  </button>

                  <button type="button" onClick={() => insertFormatting("link")} title="Insert link">
                    🔗
                  </button>
                </div>

                <textarea
                  id="article-body"
                  name="body"
                  value={formData.body}
                  onChange={handleChange}
                  placeholder="Write your article content here..."
                  rows="13"
                  required
                />
              </div>
            </div>

            <div className="article-form-bottom">
              <span>* Required fields</span>

              <div>
                <button
                  type="button"
                  className="article-cancel-btn"
                  onClick={() => navigate("/admin/knowledge-base")}
                >
                  Cancel
                </button>

                <button type="submit" className="article-save-btn">
                  {isEdit
                    ? formData.status === "Published"
                      ? "Update article"
                      : "Save draft"
                    : formData.status === "Published"
                      ? "Publish article"
                      : "Save draft"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <aside className="article-form-sidebar">
          <div className="article-form-card">
            <h2>Publication settings</h2>

            {isEdit && (
              <span
                className={`article-current-status ${formData.status.toLowerCase()}`}
              >
                ● {formData.status}
              </span>
            )}

            <div className="article-field">
              <label htmlFor="article-category">Category *</label>
              <select
                id="article-category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="article-field">
              <label>Save as *</label>

              <div className="article-status-options">
                <label className={formData.status === "Draft" ? "selected" : ""}>
                  <input
                    type="radio"
                    name="status"
                    value="Draft"
                    checked={formData.status === "Draft"}
                    onChange={handleChange}
                  />
                  Draft
                </label>

                <label className={formData.status === "Published" ? "selected" : ""}>
                  <input
                    type="radio"
                    name="status"
                    value="Published"
                    checked={formData.status === "Published"}
                    onChange={handleChange}
                  />
                  Published
                </label>
              </div>
            </div>

            <span className="article-status-hint">
              Drafts are only visible to admins. Published articles become
              available in the knowledge base.
            </span>

            {isEdit && article && (
              <div className="article-metadata">
                <span>Article ID: KB-00{article.id}</span>
                <span>Last updated: {article.date || "Not available"}</span>
              </div>
            )}
          </div>

          {formData.status === "Draft" ? (
            <div className="article-guidance-card warning">
              <h3>ⓘ Before publishing</h3>
              <p>
                Check readability, permissions and technical instructions.
                Guidance about PSL should be reviewed by knowledgeable experts
                and the community.
              </p>
            </div>
          ) : (
            <div className="article-guidance-card info">
              <h3>ⓘ Publishing updates</h3>
              <p>
                This article will be visible in the knowledge base. Make sure
                the information is accurate and easy to understand.
              </p>
            </div>
          )}

          <div className="article-form-card article-checklist">
            <h2>Writing checklist</h2>
            <p>Use short, descriptive headings.</p>
            <p>Explain actions in plain language.</p>
            <p>Do not make unsupported accuracy claims or insert sign examples.</p>
          </div>

          {isEdit && (
            <div className="article-guidance-card responsibility">
              <h3>Content responsibility</h3>
              <p>
                This article explains recording techniques, not how to perform
                signs. PSL references require expert and community review.
              </p>
            </div>
          )}
        </aside>
      </form>
    </div>
  );
}

export default ArticleForm;
