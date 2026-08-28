import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeartHandshake, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

export default function Landing() {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(user?.role === "family_member" ? "/appointments" : "/dashboard", {
        replace: true,
      });
    }
  }, [loading, isAuthenticated, user, navigate]);

  if (loading) return null;

  return (
    <div className="landing-root min-h-screen overflow-x-hidden bg-paper text-ink">
      <style>{`
        @keyframes landingFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes landingGlow {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(1.05); }
        }
        @keyframes landingScan {
          0% { transform: translateY(-20%); opacity: 0; }
          30% { opacity: 0.35; }
          100% { transform: translateY(120%); opacity: 0; }
        }
        .landing-fade { animation: landingFadeUp 0.8s ease-out both; }
        .landing-fade-delay { animation: landingFadeUp 0.9s ease-out 0.15s both; }
        .landing-fade-delay-2 { animation: landingFadeUp 0.9s ease-out 0.28s both; }
        .landing-glow { animation: landingGlow 6s ease-in-out infinite; }
        .landing-scan { animation: landingScan 7s linear infinite; }
      `}</style>

      <div className="relative isolate min-h-screen">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="landing-glow absolute -left-24 top-[-10%] h-[420px] w-[420px] rounded-full bg-primary/20 blur-[100px]" />
          <div className="landing-glow absolute -right-16 bottom-[-5%] h-[380px] w-[380px] rounded-full bg-accent/15 blur-[110px]" />
          <div className="landing-scan absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-primary/15 to-transparent" />
        </div>

        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-paper-card shadow-[0_0_24px_rgba(61,220,151,0.25)] dark:text-paper">
              <HeartHandshake size={18} strokeWidth={2.2} />
            </div>
            <span className="font-display text-lg font-semibold tracking-wide text-ink">
              Elder Ease
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="text-sm font-semibold text-ink-soft transition hover:text-primary"
            >
              Sign in
            </Link>
          </div>
        </header>

        <main className="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-6xl flex-col justify-center px-6 pb-20 pt-8 sm:px-10">
          <section className="landing-fade max-w-3xl">
            <p className="mb-5 font-mono text-xs font-medium tracking-[0.28em] text-primary uppercase">
              Elder Ease
            </p>
            <h1 className="font-display text-4xl leading-[1.08] font-semibold text-ink sm:text-6xl">
              Care that stays connected,
              <span className="block text-primary">every day.</span>
            </h1>
            <p className="landing-fade-delay mt-6 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
              Elder Ease helps caregivers and families coordinate elderly care in one place:
              from medication and wellbeing checks to visits, tasks, and everyday support.
            </p>
            <div className="landing-fade-delay-2 mt-9">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-paper-card shadow-[0_0_28px_rgba(61,220,151,0.25)] transition hover:bg-primary-light dark:text-paper"
              >
                Create account
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>

          <section className="landing-fade-delay-2 mt-20 grid gap-10 border-t border-border pt-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink">What we do</h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">
                We give care teams a clear daily workspace: manage elder profiles, track medication
                and mood, plan activities, coordinate doctor and family visits, handle emergencies,
                and keep everyone aligned without scattered calls and notebooks.
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink">Why Elder Ease</h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-soft sm:text-base">
                Built for real caregiving: calm to use, serious about safety, and designed so
                caregivers and families stay informed together. Better coordination means more
                dignity, fewer missed moments, and steadier support for the people who matter most.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
