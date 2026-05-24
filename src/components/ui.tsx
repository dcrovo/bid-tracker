import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Badge({
  children,
  tone = "neutral"
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const tones = {
    neutral: "bg-stone-200 text-coal",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber/20 text-amber-900",
    danger: "bg-red-100 text-red-800",
    info: "bg-sky-100 text-sky-800"
  };

  return (
    <span className={cn("inline-flex items-center rounded px-2 py-1 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-lg border border-stone-200 bg-white p-5 shadow-soft", className)}>{children}</section>;
}

export function ScoreRing({ score }: { score: number }) {
  const color = score >= 72 ? "text-emerald-700" : score >= 45 ? "text-amber-700" : "text-red-700";
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-stone-200 bg-white">
      <span className={cn("text-sm font-bold", color)}>{score}</span>
    </div>
  );
}
