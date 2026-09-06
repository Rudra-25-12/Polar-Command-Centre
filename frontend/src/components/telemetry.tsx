import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Severity, SourceLabel } from "@/lib/station-data";

export function SourceTag({ source, className }: { source: SourceLabel | string; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1 shrink-0 whitespace-nowrap rounded-full border border-border/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground",
            className,
          )}
        >
          <Info className="size-2.5 shrink-0" />
          {source}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        Data source: {source} (Verified Encrypted SCADA Feed)
      </TooltipContent>
    </Tooltip>
  );
}

const severityStyles: Record<Severity, string> = {
  nominal: "border-nominal/40 bg-nominal/10 text-nominal",
  warning: "border-warning/40 bg-warning/10 text-warning",
  critical: "border-critical/45 bg-critical/12 text-critical",
};

export function SeverityBadge({ severity, label }: { severity: Severity; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider",
        severityStyles[severity],
      )}
    >
      <span className="size-1.5 rounded-full bg-current live-dot" />
      {label ?? severity}
    </span>
  );
}

export function Panel({
  title,
  description,
  source,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  description?: string;
  source?: string;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("panel flex flex-col", className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
          <div>
            {title && (
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground/90">
                {title}
              </h2>
            )}
            {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {source && <SourceTag source={source} />}
            {action}
          </div>
        </header>
      )}
      <div className={cn("flex-1 p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  unit,
  hint,
  source,
  severity,
  icon: Icon,
  children,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  source?: string;
  severity?: Severity;
  icon?: any;
  children?: ReactNode;
}) {
  const accentBorder =
    severity === "critical"
      ? "border-l-4 border-l-critical"
      : severity === "warning"
        ? "border-l-4 border-l-warning"
        : severity === "nominal"
          ? "border-l-4 border-l-nominal"
          : "";

  return (
    <div className={cn("panel relative overflow-hidden p-4 transition-all hover:border-border/90", accentBorder)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {Icon && <Icon className="size-3.5 shrink-0 text-primary" />}
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground truncate">
            {label}
          </p>
        </div>
        {severity && <SeverityBadge severity={severity} />}
      </div>
      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span
          className={cn(
            "data-num text-3xl font-bold tracking-tight",
            severity === "critical"
              ? "text-critical"
              : severity === "warning"
                ? "text-warning"
                : "text-foreground",
          )}
        >
          {value}
        </span>
        {unit && <span className="text-xs font-medium text-muted-foreground">{unit}</span>}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{hint}</p>}
      {children}
      {source && (
        <div className="mt-3 flex justify-end">
          <SourceTag source={source} />
        </div>
      )}
    </div>
  );
}

export function RadialGauge({
  value,
  label,
  sublabel,
  severity = "nominal",
  size = 200,
}: {
  value: number;
  label: string;
  sublabel?: string;
  severity?: Severity;
  size?: number;
}) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const color =
    severity === "critical"
      ? "var(--critical)"
      : severity === "warning"
        ? "var(--warning)"
        : "var(--nominal)";

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--grid-line)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * circ} ${circ}`}
            style={{ transition: "stroke-dasharray 700ms ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          <span className="data-num text-3xl font-semibold" style={{ color }}>
            {pct.toFixed(1)}%
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </span>
          {sublabel && <span className="mt-1 text-xs text-muted-foreground line-clamp-1">{sublabel}</span>}
        </div>
      </div>
    </div>
  );
}

export function BulletGauge({
  value,
  min,
  typical,
  max,
  label,
  unit,
}: {
  value: number;
  min: number;
  typical: [number, number];
  max: number;
  label: string;
  unit?: string;
}) {
  const safeMax = max > min ? max : min + 1;
  const pct = (n: number) => `${Math.max(0, Math.min(100, ((n - min) / (safeMax - min)) * 100)).toFixed(2)}%`;
  const over = value > typical[1];

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="data-num text-lg font-semibold">
          {value}
          {unit && <span className="ml-1 text-xs text-muted-foreground">{unit}</span>}
        </span>
      </div>
      <div className="relative mt-2 h-6 overflow-hidden rounded-md border border-border/70 bg-muted/40">
        <div
          className="absolute inset-y-0 rounded-sm bg-primary/12"
          style={{ left: pct(typical[0]), width: `calc(${pct(typical[1])} - ${pct(typical[0])})` }}
        />
        <div
          className={cn(
            "absolute inset-y-1.5 left-0 rounded-sm",
            over ? "bg-warning" : "bg-nominal",
          )}
          style={{ width: pct(value), transition: "width 600ms ease" }}
        />
        <div className="absolute inset-y-0 right-0 w-0.5 bg-critical" />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{min}</span>
        <span>
          typical {typical[0]}–{typical[1]}
        </span>
        <span>max {max}</span>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function StubNotice({ note }: { note: string }) {
  return (
    <div className="rounded-md border border-dashed border-border/80 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
      {note}
    </div>
  );
}
