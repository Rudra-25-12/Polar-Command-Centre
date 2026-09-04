import { useMemo } from "react";
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
import { environmentalSeries } from "@/lib/station-data";
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
  const { station, telemetry } = useStation();
  const data = useMemo(() => environmentalSeries(station), [station.id]);
  const isNight = station.polarPhase === "polar night";

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

      {/* Himadri NPDC Sensor Array Note */}
      {station.id === "himadri" && (
        <div className="mb-4 rounded-xl border border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-950/30 p-4 text-xs leading-relaxed text-sky-950 dark:text-sky-200 shadow-xs">
          ℹ️ <strong>NCPOR NPDC Sensor Alignment:</strong> Himadri physical station sensor array records Ambient Temperature (+4.8 °C summer avg), Humidity, Air Pressure, and Precipitation. Wind telemetry is imported from the Ny-Ålesund communal weather station mast.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Outside Ambient Temp" value={`${telemetry.tempC}`} unit="°C" source="AWS Weather Array">
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Thermometer className="size-3.5 text-sky-400" />
            <span>Base: {station.outsideTempC} °C</span>
          </div>
        </StatCard>

        <StatCard
          label="Wind Speed"
          value={`${telemetry.windSpeedMs}`}
          unit="m/s"
          source={station.id === "himadri" ? "Ny-Ålesund Feed" : "Anemometer Array"}
        >
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wind className="size-3.5 text-emerald-400" />
            <span>{station.id === "himadri" ? "Ny-Ålesund communal feed" : "Turbine Cut-In: 3.5 m/s"}</span>
          </div>
        </StatCard>

        <StatCard
          label="Solar Radiation Peak"
          value={String(Math.round(station.daylightHours * 18))}
          unit="W/m²"
          hint={isNight ? "Zero PV generation during 24h polar night" : "Usable for seasonal solar PV assist"}
          source="Pyranometer Sensor"
        />
      </div>

      <Panel
        className="mt-4"
        title="30-Day Environmental Telemetry Trend"
        description={
          isNight
            ? "Dark Shaded Overlay: Station is currently in Polar Night (24-hour darkness) — solar contribution is effectively 0 W/m²."
            : "Light Overlay: Station is in Polar Day (continuous daylight) — solar array output active."
        }
        source="NPDC Telemetry Archive"
      >
        <div className={`h-[380px] rounded-md ${isNight ? "bg-primary/5" : "bg-warning/5"} p-2 border border-border/50`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="var(--grid-line)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="t" {...axisProps} interval={3} />
              <YAxis {...axisProps} />
              <RTooltip {...chartTooltip} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="solar"
                name="Solar Radiation (W/m²)"
                stroke="var(--chart-3)"
                fill="var(--chart-3)"
                fillOpacity={0.18}
              />
              <Line type="monotone" dataKey="wind" name="Wind Speed (m/s)" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="temp" name="Temperature (°C)" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </>
  );
}

