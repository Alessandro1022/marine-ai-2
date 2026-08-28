"use client";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold glow-text">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-mist">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}
