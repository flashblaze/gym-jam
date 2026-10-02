import { LineChart } from "@mantine/charts";
import { SegmentedControl } from "@mantine/core";
import { useState } from "react";

import { formatDate } from "~/lib/calc";
import { METRIC_INFO, type MetricKey, type SessionPerformance } from "~/lib/progress";

interface ProgressChartProps {
  history: SessionPerformance[];
  metrics: MetricKey[];
}

const ProgressChart = ({ history, metrics }: ProgressChartProps) => {
  const [metric, setMetric] = useState(metrics[0]);
  const info = METRIC_INFO[metric];

  const data = history.flatMap((entry) => {
    const value = entry.metrics[metric];
    return value === undefined ? [] : [{ date: formatDate(entry.date), value }];
  });

  return (
    <section aria-labelledby="progress-heading" className="px-4 pt-2 pb-4">
      <h2
        id="progress-heading"
        className="mb-2 text-xs font-medium uppercase tracking-widest text-fg-faint"
      >
        Progress
      </h2>
      {metrics.length > 1 && (
        <SegmentedControl
          fullWidth
          size="xs"
          className="mb-3"
          data={metrics.map((m) => ({ value: m, label: METRIC_INFO[m].label }))}
          value={metric}
          onChange={(value) => setMetric(metrics.find((m) => m === value) ?? metrics[0])}
        />
      )}
      {data.length < 2 ? (
        <p className="rounded-xl border border-dashed border-line py-8 text-center text-sm text-fg-faint">
          Log this exercise in two workouts to see a trend.
        </p>
      ) : (
        <LineChart
          h={200}
          data={data}
          dataKey="date"
          series={[{ name: "value", label: info.label, color: "primary.5" }]}
          curveType="monotone"
          valueFormatter={info.format}
          gridAxis="y"
          tickLine="none"
          yAxisProps={{ width: 56, domain: ["auto", "auto"] }}
          lineChartProps={{ accessibilityLayer: true }}
        />
      )}
    </section>
  );
};

export default ProgressChart;
