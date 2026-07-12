import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function InputField({
  label,
  type = "text",
  name,
  value,
  onChange,
  error,
  placeholder = "",
  icon: Icon,
  as = "input",        // "input" | "select" | "textarea"
  options = [],         // used when as="select"
  rows = 3,              // used when as="textarea"
  required = false,
  mono = false,           // monospace, for data-like values (blood group, phone, dates)
  size = "lg",             // "lg" = original auth-page style, "md" = compact form style
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  const isLg = size === "lg";

  const wrapperClass = isLg ? "mb-5" : "flex flex-col gap-1.5";
  const labelClass = isLg
    ? "block text-base font-semibold text-primary mb-2"
    : "block text-xs font-semibold uppercase tracking-wider text-ink-soft";

  const fieldBase = `w-full bg-paper-card transition-colors focus:outline-none
    ${isLg ? "py-4 text-lg rounded-2xl border-2 focus:ring-4 focus:ring-accent-soft" : "py-2.5 text-sm rounded-lg border focus:ring-2 focus:ring-primary/15"}
    ${error ? "border-rose" : `border-border ${isLg ? "focus:border-primary" : "focus:border-primary"}`}
    ${mono ? "font-mono" : ""}`;

  const paddingClass = as === "input"
    ? `${Icon ? (isLg ? "pl-12" : "pl-9") : (isLg ? "pl-4" : "pl-3.5")} ${isPassword ? (isLg ? "pr-12" : "pr-9") : (isLg ? "pr-4" : "pr-3.5")}`
    : (isLg ? "px-4" : "px-3.5");

  return (
    <div className={wrapperClass}>
      {label && (
        <label htmlFor={name} className={labelClass}>
          {label} {required && <span className="text-rose">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && as === "input" && (
          <Icon
            className={`absolute left-4 top-1/2 -translate-y-1/2 text-primary ${isLg ? "text-xl" : "text-base"}`}
          />
        )}

        {as === "select" ? (
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            className={`${fieldBase} ${paddingClass}`}
          >
            <option value="">Select {label?.toLowerCase()}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : as === "textarea" ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            rows={rows}
            className={`${fieldBase} ${paddingClass}`}
          />
        ) : (
          <input
            id={name}
            name={name}
            type={inputType}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className={`${fieldBase} ${paddingClass}`}
          />
        )}

        {isPassword && as === "input" && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className={`absolute right-4 top-1/2 -translate-y-1/2 text-primary ${isLg ? "text-xl" : "text-base"}`}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        )}
      </div>

      {error && (
        <p className={`${isLg ? "mt-2 text-sm" : "mt-1 text-xs"} font-medium text-rose`}>
          {error}
        </p>
      )}
    </div>
  );
}