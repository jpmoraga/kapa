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
    <div className="k21-card p-6">
      <div className="text-xs uppercase tracking-[0.22em] text-white/45">{eyebrow}</div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm text-white/60">{description}</p>
    </div>
  );
}
