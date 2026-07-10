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
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="mb-5">
      <label
        htmlFor={name}
        className="block text-base font-semibold text-[#3B7D7F] mb-2"
      >
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4F8A8B] text-xl" />
        )}

        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full ${Icon ? "pl-12" : "pl-4"} ${
            isPassword ? "pr-12" : "pr-4"
          } py-4 text-lg rounded-2xl border-2 bg-white
          focus:outline-none focus:ring-4 focus:ring-[#8FD3C7]
          ${error ? "border-[#E76F51]" : "border-[#8FD3C7] focus:border-[#4F8A8B]"}
          `}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4F8A8B] text-xl"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm font-medium text-[#E76F51]">{error}</p>
      )}
    </div>
  );
}
