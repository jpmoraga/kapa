export default function BackofficePageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="k21-card border-white/10 bg-white/[0.02] px-5 py-4">
      <div className="text-[11px] uppercase tracking-[0.22em] text-amber-200/70">{eyebrow}</div>
      <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-white">{title}</h1>
      <p className="mt-2 max-w-4xl text-sm leading-relaxed text-white/58">{description}</p>
    </div>
  );
}
