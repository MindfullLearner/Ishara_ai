
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPSLSignById } from "../../api/admin";
import PSLSignForm from "./psl/PSLSignForm";

function EditPSLSign() {
  const { signId } = useParams();
  const navigate = useNavigate();

  const [sign, setSign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSign() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getPSLSignById(signId);

        if (isMounted) {
          setSign(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Unable to load this PSL sign.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSign();

    return () => {
      isMounted = false;
    };
  }, [signId]);

  if (isLoading) {
    return <div className="psl-form-page">Loading sign details...</div>;
  }

  if (error || !sign) {
    return (
      <div className="psl-form-page">
        <p className="psl-form-error" role="alert">
          {error || "PSL sign not found."}
        </p>

        <button
          type="button"
          className="psl-form-cancel"
          onClick={() => navigate("/admin/psl-dictionary")}
        >
          Back to PSL dictionary
        </button>
      </div>
    );
  }

  return (
    <PSLSignForm
      key={signId}
      mode="edit"
      sign={sign}
    />
  );
}

export default EditPSLSign;
