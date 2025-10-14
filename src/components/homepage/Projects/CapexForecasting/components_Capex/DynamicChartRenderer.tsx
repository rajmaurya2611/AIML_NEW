import React from "react";
import { LabelList } from "recharts";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartConfig {
  chartType: "bar" | "line";
  config: any;
  data: any[];
  title?: string;
  summary?: {
    dataPoints: number;
    formattedTotal: string;
    totalValue: number;
  };
  barDataKeys?: string[];
  lineDataKeys?: string[];
}

interface DynamicChartRendererProps {
  chartConfig: ChartConfig;
  className?: string;
}

const colors = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
  "#f97316", // orange
  "#14b8a6", // teal
  "#6366f1", // indigo
  "#a855f7", // purple
];

const colorForIndex = (i: number) => colors[i % colors.length];

// 🧭 Reusable placeholder
const NoDataPlaceholder = () => (
  <div className="flex items-center justify-center h-40 border border-gray-200 rounded bg-gray-50 text-gray-500">
    No data available to plot chart.
  </div>
);

const DynamicChartRenderer: React.FC<DynamicChartRendererProps> = ({
  chartConfig,
  className = "",
}) => {
  if (!chartConfig) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg text-center">
        <p className="text-gray-600">No chart configuration provided</p>
      </div>
    );
  }

  const { chartType, config, data = [], title, summary, barDataKeys, lineDataKeys } = chartConfig;

  // 🧠 Determine which keys to validate
  const keysToCheck =
    chartType === "bar"
      ? barDataKeys?.length
        ? barDataKeys
        : [config.bar?.dataKey || "value"]
      : lineDataKeys?.length
      ? lineDataKeys
      : [config.line?.dataKey || "value"];

  // 🧹 Clean data: keep only rows with at least one valid number
  const cleanedData = Array.isArray(data) ? data : [];

const hasValidValues = cleanedData.some((d) =>
    keysToCheck.some((key) => {
        const v = d[key];
        return typeof v === 'number' && !isNaN(v) && v !== 0;  // 👈 important
    })
);


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold text-gray-700">{label}</p>
          <p
            className={`font-medium ${
              chartType === "line" ? "text-green-600" : "text-blue-600"
            }`}
          >
            {payload[0].payload.formattedValue || payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  const commonAxisProps = {
    xAxis: {
      dataKey: config.xAxis?.dataKey || "name",
      angle: config.xAxis?.angle || 0,
      textAnchor: config.xAxis?.angle ? "end" : "middle",
      height: config.xAxis?.height || 60,
      tick: { fontSize: config.xAxis?.tick?.fontSize || 12 },
    },
    yAxis: {
      label: config.yAxis?.label,
      tick: { fontSize: config.yAxis?.tick?.fontSize || 12 },
      tickFormatter: (value: number) => `€${(value / 1000).toFixed(0)}k`,
    },
  };

  // =========================
  // BAR CHART
  // =========================
  if (chartType === "bar") {
    return (
      <div className={`w-full bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {title || "Bar Chart"}
        </h2>

        {summary && (
          <div className="mb-6 p-4 rounded-lg border bg-blue-50 border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-blue-700">Data Points</p>
                <p className="text-lg font-bold text-blue-800">
                  {summary.dataPoints}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Total</p>
                <p className="text-lg font-bold text-blue-800">
                  {summary.formattedTotal}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Average</p>
                <p className="text-lg font-bold text-blue-800">
                  €
                  {(
                    summary.totalValue / summary.dataPoints
                  ).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        )}

        {hasValidValues ? (
          <ResponsiveContainer width="100%" height={config.height || 400}>
            <BarChart
              layout="vertical"
              data={cleanedData}
              margin={{ top: 20, right: 80, left: 0, bottom: 5 }}
              barCategoryGap={8}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey={commonAxisProps.xAxis.dataKey}
                tick={{ fontSize: 12 }}
                width={200}
                interval={0}
              />
              <Tooltip content={<CustomTooltip />} />
              {(barDataKeys?.length
                ? barDataKeys
                : [config.bar?.dataKey || "value"]
              ).map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colorForIndex(i)}
                  radius={config.bar?.radius || [0, 0, 0, 0]}
                >
                  <LabelList
                    dataKey={key}
                    position="right"
                    style={{
                      fontSize: 12,
                      fill: "#374151",
                      fontWeight: 600,
                    }}
                  />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <NoDataPlaceholder />
        )}
      </div>
    );
  }

  // =========================
  // LINE CHART
  // =========================
  if (chartType === "line") {
    return (
      <div className={`w-full bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {title || "Line Chart"}
        </h2>

        {summary && (
          <div className="mb-6 p-4 rounded-lg border bg-green-50 border-green-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-green-700">Data Points</p>
                <p className="text-lg font-bold text-green-800">
                  {summary.dataPoints}
                </p>
              </div>
              <div>
                <p className="text-sm text-green-700">Total</p>
                <p className="text-lg font-bold text-green-800">
                  {summary.formattedTotal}
                </p>
              </div>
              <div>
                <p className="text-sm text-green-700">Average</p>
                <p className="text-lg font-bold text-green-800">
                  €
                  {(
                    summary.totalValue / summary.dataPoints
                  ).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        )}

        {hasValidValues ? (
          <ResponsiveContainer width="100%" height={config.height || 400}>
            <LineChart data={cleanedData} margin={config.margin || { top: 20, right: 30, left: 50, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis {...commonAxisProps.xAxis} interval={0} />
              <YAxis {...commonAxisProps.yAxis} />
              <Tooltip content={<CustomTooltip />} />
              {(lineDataKeys?.length
                ? lineDataKeys
                : [config.line?.dataKey || "value"]
              ).map((key, i) => (
                <Line
                  key={key}
                  type={config.line?.type || "monotone"}
                  dataKey={key}
                  stroke={colorForIndex(i)}
                  strokeWidth={config.line?.strokeWidth || 2}
                  dot={config.line?.dot || { fill: colorForIndex(i), r: 4 }}
                  activeDot={
                    config.line?.activeDot || { fill: colorForIndex(i), r: 6 }
                  }
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <NoDataPlaceholder />
        )}
      </div>
    );
  }

  // =========================
  //  UNSUPPORTED CHART
  // =========================
  return (
    <div className="p-8 bg-gray-100 rounded-lg text-center">
      <p className="text-gray-600">Unsupported chart type: {chartType}</p>
    </div>
  );
};

export default DynamicChartRenderer;
