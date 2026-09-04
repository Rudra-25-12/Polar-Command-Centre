import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/landing/landing-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Polar Command Center — India's Polar Research Energy Command" },
      {
        name: "description",
        content:
          "Real-time SCADA energy telemetry, fuel runway forecasting and microgrid management for India's Antarctic and Arctic stations: Bharati, Maitri and Himadri.",
      },
      { property: "og:title", content: "Polar Command Center — India's Polar Research Stations" },
      {
        property: "og:description",
        content: "Explore Bharati, Maitri and Himadri polar research stations and live telemetry command center.",
      },
    ],
  }),
  component: LandingPage,
});
