import { FiHeart } from "react-icons/fi";
import ThemeToggle from "../components/ThemeToggle";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-paper px-4 py-10">
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
            <FiHeart className="text-3xl text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-primary dark:text-ink">
            Elder Ease
          </h1>
        </div>

        <div className="rounded-3xl border border-border bg-paper-card p-8 shadow-lg">
          <h2 className="mb-2 text-center font-display text-2xl font-bold text-primary dark:text-ink">
            {title}
          </h2>
          {subtitle && (
            <p className="mb-6 text-center text-base text-ink-soft">{subtitle}</p>
          )}

          {children}
        </div>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Elder Ease: caring made simple
        </p>
      </div>
    </div>
  );
}
