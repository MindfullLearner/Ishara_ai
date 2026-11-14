
import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { getKnowledgeArticleById } from "../../api/admin";
import ArticleForm from "./knowledge/ArticleForm";

function EditArticle() {
  const { articleId } = useParams();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchArticle() {
      try {
        setLoading(true);
        setError("");

        const data = await getKnowledgeArticleById(articleId);

        if (isMounted) {
          setArticle(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Unable to load this article.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchArticle();

    return () => {
      isMounted = false;
    };
  }, [articleId]);

  if (loading) {
    return <div className="article-form-page">Loading article...</div>;
  }

  if (error || !article) {
    return <Navigate to="/admin/knowledge-base" replace />;
  }

  return <ArticleForm key={articleId} mode="edit" article={article} />;
}

export default EditArticle;
