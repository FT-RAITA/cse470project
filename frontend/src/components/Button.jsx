export default function Button({
  children,
  type = "button",
  onClick,
  loading = false,
  variant = "primary",
  disabled = false,
}) {
  const base =
    "w-full py-4 rounded-2xl text-lg font-semibold transition-colors duration-200 " +
    "focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-[#4F8A8B] hover:bg-[#3B7D7F] text-white focus:ring-[#8FD3C7]",
    secondary:
      "bg-white border-2 border-[#4F8A8B] text-[#3B7D7F] hover:bg-[#F6F9F9] focus:ring-[#8FD3C7]",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]}`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Please wait...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
