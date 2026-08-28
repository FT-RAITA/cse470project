export default function Button({
  children,
  type = "button",
  onClick,
  loading = false,
  variant = "primary",
  disabled = false,
  icon: Icon,
  size = "lg",       // "lg" = auth-page style, "md" = compact toolbar style
  fullWidth = true,  // preserves original always-full-width default
  className = "",
}) {
  const sizes = {
    lg: "py-4 text-lg rounded-2xl gap-2",
    md: "py-2.5 px-4 text-sm rounded-lg gap-2",
  };

  const base =
    `${fullWidth ? "w-full" : ""} inline-flex items-center justify-center font-semibold ` +
    "transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2 " +
    "disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]";

  const variants = {
    primary:
      "bg-primary hover:bg-primary-dark text-paper-card dark:text-paper focus:ring-accent-soft",
    secondary:
      "bg-paper-card border-2 border-primary text-primary hover:bg-paper focus:ring-accent-soft dark:text-ink",
    accent:
      "bg-accent hover:bg-accent-soft text-primary-dark focus:ring-accent-soft dark:text-paper",
    ghost:
      "bg-transparent border-2 border-border text-primary hover:bg-paper focus:ring-accent-soft dark:text-ink",
    danger:
      "bg-rose hover:bg-rose/90 text-paper-card dark:text-paper focus:ring-rose-soft",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {loading ? (
        <>
          <span
            className={`${size === "lg" ? "h-5 w-5" : "h-4 w-4"} border-2 border-current border-t-transparent rounded-full animate-spin`}
          />
          {size === "lg" ? "Please wait..." : children}
        </>
      ) : (
        <>
          {Icon && <Icon size={size === "lg" ? 20 : 16} strokeWidth={2} />}
          {children}
        </>
      )}
    </button>
  );
}