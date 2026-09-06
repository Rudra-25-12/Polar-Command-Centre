import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Moon, Sun, Wind, Thermometer, Compass } from "lucide-react";
import { useStation } from "@/components/station-context";
import { PageHeader, Panel, StatCard } from "@/components/telemetry";
import { axisProps, chartTooltip } from "@/lib/chart-theme";

export const Route = createFileRoute("/environmental")({
  head: () => ({
    meta: [
      { title: "Environmental — Polar Station Energy Command" },
      {
        name: "description",
        content: "Solar radiation, wind speed and temperature trends across polar day and polar night.",
      },
      { property: "og:title", content: "Environmental — Polar Station Energy Command" },
      { property: "og:description", content: "Solar, wind and temperature telemetry per polar station." },
    ],
  }),
  component: EnvironmentalPage,
});

function EnvironmentalPage() {
  const { station, telemetry, envHistory } = useStation();
  const isNight = station.polarPhase === "polar night";

  const latestSolarKw = envHistory.length > 0 ? envHistory[envHistory.length - 1].solar : 0;
  const latestWindKw = envHistory.length > 0 ? envHistory[envHistory.length - 1].wind : 0;

  return (
    <>
      <PageHeader
        title={`${station.name} — Environmental Telemetry`}
        subtitle="Ambient atmospheric conditions driving heating load and renewable generation potential"
      >
        <span
          className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium ${
            isNight ? "border-primary/40 bg-primary/10 text-primary" : "border-warning/40 bg-warning/10 text-warning"
          }`}
        >
          {isNight ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
          {station.polarPhase} · {station.daylightHours}h daylight window
        </span>
      </PageHeader>

      {station.id === "himadri" && (
        <div className="mb-4 rounded-xl border border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-950/30 p-4 text-xs leading-relaxed text-sky-950 dark:text-sky-200 shadow-xs">
          ℹ️ <strong>NCPOR NPDC Sensor Alignment:</strong> Himadri physical station sensor array records Ambient Temperature (+4.8 °C summer avg), Humidity, Air Pressure, and Precipitation. Wind telemetry is imported from the Ny-Ålesund communal weather station mast.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Outside Ambient Temp" value={`${telemetry.tempC}`} unit="°C" source="Real Calibrated Climate Data">
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Thermometer className="size-3.5 text-sky-400" />
            <span>Monthly average, NCPOR/NPDC sourced</span>
          </div>
        </StatCard>

        <StatCard
          label="Wind Power Output"
          value={`${latestWindKw.toFixed(1)}`}
          unit="kW"
          source={station.id === "himadri" ? "Ny-Ålesund Feed" : "Real Wind Data (NPDC)"}
        >
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wind className="size-3.5 text-emerald-400" />
            <span>Wind speed: {telemetry.windSpeedMs} m/s</span>
          </div>
        </StatCard>

        <StatCard
          label="Solar Power Output"
          value={`${latestSolarKw.toFixed(1)}`}
          unit="kW"
          hint={isNight ? "Zero PV generation during polar night" : "Real astronomical + calibrated solar data"}
          source="Astral + NPDC Radiation Data"
        />
      </div>

      <Panel
        className="mt-4"
        title="Renewable Generation & Climate Trend"
        description={
          isNight
            ? "Station is currently in Polar Night — solar contribution is calculated as 0 kW using real astronomical daylight data."
            : "Station is in Polar Day / transition — solar array output active based on real astronomical calculation."
        }
        source="Real backend data: astral polar-night calculation + NPDC-calibrated wind"
      >
        <div className={`h-[380px] rounded-md ${isNight ? "bg-primary/5" : "bg-warning/5"} p-2 border border-border/50`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={envHistory} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="var(--grid-line)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="t" {...axisProps} interval={5} />
              <YAxis {...axisProps} />
              <RTooltip {...chartTooltip} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="solar"
                name="Solar Output (kW)"
                stroke="var(--chart-3)"
                fill="var(--chart-3)"
                fillOpacity={0.18}
              />
              <Line type="monotone" dataKey="wind" name="Wind Output (kW)" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </>
  );
}