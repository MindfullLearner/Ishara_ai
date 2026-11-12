import { useParams, Navigate } from "react-router-dom";
import PSLSignForm from "./psl/PSLSignForm";

function EditPSLSign() {
  const { signId } = useParams();

  const signs = JSON.parse(
    localStorage.getItem("isharaPSLSigns") || "[]"
  );

  const sign = signs.find(
    (item) => String(item.id) === String(signId)
  );

  if (!sign) {
    return <Navigate to="/admin/psl-dictionary" replace />;
  }

  return <PSLSignForm key={signId} mode="edit" sign={sign} />;
}

export default EditPSLSign;
