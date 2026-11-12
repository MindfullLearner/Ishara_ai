import FormField from "./FormField";

export default function PasswordField({
  id,
  label,
  name,
  value,
  onChange,
  showPassword,
  onToggleVisibility,
  autoComplete = "new-password",
  placeholder,
  disabled = false,
  required = true,
  maxLength = 128,
  error = "",
  errorId,
  requirements = [],
}) {
  const requirementsId = requirements.length ? `${id}-requirements` : undefined;
  const describedBy = [requirementsId, error ? errorId : undefined]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <FormField id={id} label={label} error={error} errorId={errorId}>
      <div className="ish-password-field">
        <input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        />
        <button
          type="button"
          className="ish-eye-button"
          onClick={onToggleVisibility}
          aria-label={`${showPassword ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={showPassword}
          disabled={disabled}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
      {requirements.length > 0 && (
        <ul className="ish-password-requirements" id={requirementsId}>
          {requirements.map((requirement) => (
            <li key={requirement}>{requirement}</li>
          ))}
        </ul>
      )}
    </FormField>
  );
}
