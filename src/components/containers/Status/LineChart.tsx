import Chart from "react-apexcharts";
import ChartIcon from "src/components/UI/RectIcon";
import Dropdown from "src/components/UI/Dropdown";
import capitalize from "src/utils/capitalize";
import Measurement from "src/domain/Measurement";
import { DateTime, Duration } from "luxon";
import { useState } from "react";
import TimeScope from "src/domain/TimeScope";
import { averageMeasurements } from "src/utils/averageMeasurements";

interface LineChartProps {
  measurements: Measurement[] | null;
  type: string;
  bgColor?: string;
  accentColor?: string;
  icon: JSX.Element;
  minThreshold?: number;
  maxThreshold?: number;
}

export default function LineChart({
  measurements,
  type,
  bgColor,
  accentColor,
  icon,
  minThreshold,
  maxThreshold,
}: LineChartProps) {
  const [max, setMax] = useState(true);
  const [min, setMin] = useState(true);
  const timeScopes = [
    new TimeScope("last hour", Duration.fromObject({ hours: 1 })),
    new TimeScope("6 hours", Duration.fromObject({ hours: 6 })),
    new TimeScope("12 hours", Duration.fromObject({ hours: 12 })),
    new TimeScope(
      "day",
      Duration.fromObject({ days: 1 }),
      Duration.fromObject({ hours: 1 })
    ),
    new TimeScope(
      "week",
      Duration.fromObject({ weeks: 1 }),
      Duration.fromObject({ hours: 6 })
    ),
    new TimeScope(
      "month",
      Duration.fromObject({ months: 1 }),
      Duration.fromObject({ days: 1 })
    ),
  ];

  const minAnnotation: YAxisAnnotations = {
    id: "min",
    y: minThreshold,
    y2: Number.MIN_SAFE_INTEGER,
    opacity: 0.15,
    fillColor: "#0000FF",
  };
  const maxAnnotation: YAxisAnnotations = {
    id: "max-1",
    y: maxThreshold,
    y2: 5000,
    opacity: 0.15,
    fillColor: "#FF0000",
  };

  const [timeScope, setTimeScope] = useState(timeScopes[0]);

  if (measurements == null) {
    measurements = [];
  }

  const lastReading = DateTime.fromMillis(
    measurements[measurements.length - 1]?.timestamp ??
      DateTime.now().toMillis()
  );

  const cutOffTimestamp = lastReading.minus(timeScope.scope).toMillis();
  measurements = measurements.filter(
    ({ timestamp }) => timestamp >= cutOffTimestamp
  );

  if (timeScope.averageTo !== undefined) {
    measurements = averageMeasurements(
      measurements,
      timeScope.averageTo.toMillis()
    );
  }
  const annotations = [min ? minAnnotation : {}, max ? maxAnnotation : {}];
  const series = [
    {
      name: capitalize(type),
      data: measurements.map(({ value }) => value),
    },
    ...(maxThreshold !== undefined
      ? [
          {
            name: "max",
            data: measurements.map(() => maxThreshold),
          },
        ]
      : []),
    ...(minThreshold !== undefined
      ? [
          {
            name: "min",
            data: measurements.map(() => minThreshold),
          },
        ]
      : []),
  ];
  const options: ApexCharts.ApexOptions = {
    chart: {
      fontFamily: "Sora",
      type: "line",
      zoom: {
        enabled: false,
      },
      events: {
        legendClick: function (chart, seriesIndex, config) {
          switch (seriesIndex) {
            case 1:
              setMax(!max);
              break;
            case 2:
              setMin(!min);
              break;
          }
        },
      },
    },

    annotations: {
      yaxis: annotations,
    },

    tooltip: {
      enabled: true,
      x: {
        show: true,
        format: "dd/MM, HH:mm ",
      },
    },
    colors: ["#555555", "#FF0000", "#0000FF"],

    theme: {
      mode: "light",
      palette: "palette9",
      monochrome: {
        enabled: false,
        color: "#255aee",
        shadeTo: "light",
        shadeIntensity: 0.65,
      },
    },

    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    labels: measurements.map(({ timestamp }) =>
      new Date(timestamp).toISOString()
    ),
    xaxis: {
      type: "datetime",
      labels: {
        datetimeUTC: false,
        datetimeFormatter: {
          year: "yyyy",
          month: "MMM 'yy",
          day: "dd MMM",
          hour: "HH:mm",
        },
      },
    },
    yaxis: {},
  };
  return (
    <div
      data-testid={`line-chart-${type}`}
      style={{ backgroundColor: bgColor }}
      className="bg-accent p-2 font-sora shadow-sm max-sm:w-auto rounded-xl"
    >
      <div className="flex items-center">
        <div>
          <ChartIcon bgColor={accentColor} icon={icon} />
        </div>
        <div className="flex-grow font-sora ml-2 text-xl font-semibold">
          {capitalize(type)}
        </div>
        <div>
          <Dropdown
            onSelect={(option) =>
              setTimeScope(
                timeScopes.find(({ name }) => name === option) ?? timeScopes[0]
              )
            }
            selected={timeScope.name}
            options={timeScopes.map(({ name }) => name)}
          />
        </div>
      </div>
      <div className="xs:h-40 md:h-80">
        <Chart options={options} series={series} height={"100%"} />
      </div>
    </div>
  );
}
