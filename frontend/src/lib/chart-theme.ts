export const axisProps = {
  stroke: "var(--muted-foreground)",
  tick: { fill: "var(--muted-foreground)", fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: "var(--grid-line)" },
} as const;

export const chartTooltip = {
  cursor: { fill: "transparent", stroke: "var(--border)", strokeDasharray: "3 3" },
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "var(--popover-foreground)",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
  },
  labelStyle: { color: "var(--muted-foreground)", marginBottom: 4 },
  itemStyle: { color: "var(--popover-foreground)" },
} as const;

