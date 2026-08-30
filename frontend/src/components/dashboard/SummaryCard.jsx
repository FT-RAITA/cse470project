export default function SummaryCard({ icon: Icon, title, children, footer }) {
  return (
    <section className="rounded-xl border border-border bg-paper-card p-5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon size={18} strokeWidth={2} />
        </div>
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
      {footer ? <div className="mt-4 border-t border-border pt-4">{footer}</div> : null}
    </section>
  );
}
