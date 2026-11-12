import { useParams, Navigate } from "react-router-dom";
import ArticleForm from "./knowledge/ArticleForm";

function EditArticle() {
  const { articleId } = useParams();

  const articles = JSON.parse(
    localStorage.getItem("isharaKnowledgeArticles") || "[]"
  );

  const article = articles.find(
    (item) => String(item.id) === String(articleId)
  );

  if (!article) {
    return <Navigate to="/admin/knowledge-base" replace />;
  }

  return <ArticleForm key={articleId} mode="edit" article={article} />;
}

export default EditArticle;
