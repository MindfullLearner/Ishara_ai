export default function FormField({
  id,
  label,
  error,
  errorId,
  className = "",
  children,
}) {
  return (
    <div className={`ish-form-field ${className}`.trim()}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <small className="ish-field-error" id={errorId} role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
