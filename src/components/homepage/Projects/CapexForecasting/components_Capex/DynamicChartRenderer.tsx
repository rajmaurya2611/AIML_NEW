import React from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface ChartConfig {
  chartType: 'bar' | 'line';
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

const DynamicChartRenderer: React.FC<DynamicChartRendererProps> = ({ chartConfig, className = "" }) => {
  if (!chartConfig) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg text-center">
        <p className="text-gray-600">No chart configuration provided</p>
      </div>
    );
  }

  const { chartType, config, data, title, summary, barDataKeys, lineDataKeys } = chartConfig;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold text-gray-700">{label}</p>
          <p className={`font-medium ${chartType === 'line' ? 'text-green-600' : 'text-blue-600'}`}>
            {payload[0].payload.formattedValue || payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  const commonProps = {
    data,
    margin: config.margin || { top: 20, right: 30, left: 50, bottom: 5 }
  };

  const commonAxisProps = {
    xAxis: {
      dataKey: config.xAxis?.dataKey || "name",
      angle: config.xAxis?.angle || 0,
      textAnchor: config.xAxis?.angle ? "end" : "middle",
      height: config.xAxis?.height || 60,
      tick: { fontSize: config.xAxis?.tick?.fontSize || 12 }
    },
    yAxis: {
      label: config.yAxis?.label,
      tick: { fontSize: config.yAxis?.tick?.fontSize || 12 },
      tickFormatter: (value: number) => `€${(value / 1000).toFixed(0)}k`
    }
  };

  if (chartType === 'bar') {
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
                  €{(summary.totalValue / summary.dataPoints).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        )}
        <ResponsiveContainer width="100%" height={config.height || 400}>
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis {...commonAxisProps.xAxis} interval={0} />
            <YAxis {...commonAxisProps.yAxis} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign={config.legend?.verticalAlign || "top"} height={config.legend?.height || 36} />
            {(barDataKeys && barDataKeys.length > 0) ? (
              barDataKeys.map((key: string, i: number) => (
                <Bar 
                  key={key}
                  dataKey={key}
                  fill={colorForIndex(i)}
                  radius={config.bar?.radius || [0, 0, 0, 0]}
                  name="Investment (EUR)"
                />
              ))
            ) : (
              <Bar 
                dataKey={config.bar?.dataKey || "value"}
                fill={config.bar?.fill || "#3b82f6"}
                radius={config.bar?.radius || [0, 0, 0, 0]}
                name="Investment (EUR)"
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chartType === 'line') {
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
                  €{(summary.totalValue / summary.dataPoints).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        )}
        <ResponsiveContainer width="100%" height={config.height || 400}>
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis {...commonAxisProps.xAxis} interval={0} />
            <YAxis {...commonAxisProps.yAxis} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign={config.legend?.verticalAlign || "top"} height={config.legend?.height || 36} />
            {(lineDataKeys && lineDataKeys.length > 0) ? (
              lineDataKeys.map((key: string, i: number) => (
                <Line
                  key={key}
                  type={config.line?.type || "monotone"}
                  dataKey={key}
                  stroke={colorForIndex(i)}
                  strokeWidth={config.line?.strokeWidth || 2}
                  dot={config.line?.dot || { fill: colorForIndex(i), r: 4 }}
                  activeDot={config.line?.activeDot || { fill: colorForIndex(i), r: 6 }}
                  name="Investment (EUR)"
                />
              ))
            ) : (
              <Line 
                type={config.line?.type || "monotone"}
                dataKey={config.line?.dataKey || "value"}
                stroke={config.line?.stroke || "#10b981"}
                strokeWidth={config.line?.strokeWidth || 2}
                dot={config.line?.dot || { fill: '#10b981', r: 4 }}
                activeDot={config.line?.activeDot || { fill: '#059669', r: 6 }}
                name="Investment (EUR)"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-100 rounded-lg text-center">
      <p className="text-gray-600">Unsupported chart type: {chartType}</p>
    </div>
  );
};

export default DynamicChartRenderer;
