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
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#14b8a6",
  "#6366f1", "#a855f7",
];

const colorForIndex = (i: number) => colors[i % colors.length];

const NoDataPlaceholder = () => (
  <div className="flex items-center justify-center h-40 border border-gray-200 rounded bg-gray-50 text-gray-500">
    No data available to plot chart.
  </div>
);

// ✅ MULTI-LINE Y-AXIS TICK with automatic text wrapping
const CustomYAxisTick = ({ x, y, payload }: any) => {
  const text = payload.value || "";
  const maxCharsPerLine = 40; // Characters per line
  const lineHeight = 14; // Pixel height per line
  
  // Function to wrap text into multiple lines
  const wrapText = (text: string, maxChars: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      
      if (testLine.length <= maxChars) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  const lines = wrapText(text, maxCharsPerLine);
  const totalHeight = lines.length * lineHeight;
  const startY = -(totalHeight / 2) + (lineHeight / 2); // Center vertically

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, index) => (
        <text
          key={index}
          x={-5}
          y={startY + (index * lineHeight)}
          textAnchor="end"
          fill="#374151"
          fontSize={11}
          fontWeight={500}
        >
          {line}
        </text>
      ))}
    </g>
  );
};

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

  const keysToCheck =
    chartType === "bar"
      ? barDataKeys?.length
        ? barDataKeys
        : [config.bar?.dataKey || "value"]
      : lineDataKeys?.length
        ? lineDataKeys
        : [config.line?.dataKey || "value"];

  const cleanedData = Array.isArray(data) ? data : [];

  const hasValidValues = cleanedData.some((d) =>
    keysToCheck.some((key) => {
      const v = d[key];
      return typeof v === 'number' && !isNaN(v) && v !== 0;
    })
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg max-w-md">
          <p className="font-semibold text-gray-700 text-sm mb-1">{label}</p>
          <p
            className={`font-medium ${chartType === "line" ? "text-green-600" : "text-blue-600"}`}
          >
            {payload[0].payload.formattedValue || payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  // Bar Chart
  if (chartType === "bar") {
    // ✅ Calculate height based on data + estimated line wraps
    const estimateLineCount = (text: string): number => {
      const maxCharsPerLine = 40;
      const words = text.split(' ');
      let lines = 1;
      let currentLineLength = 0;
      
      words.forEach(word => {
        if (currentLineLength + word.length + 1 > maxCharsPerLine) {
          lines++;
          currentLineLength = word.length;
        } else {
          currentLineLength += word.length + 1;
        }
      });
      
      return lines;
    };

    // Calculate total height needed
    const avgLinesPerLabel = cleanedData.reduce((sum, item) => {
      const labelText = item[config.xAxis?.dataKey || "name"] || "";
      return sum + estimateLineCount(labelText);
    }, 0) / cleanedData.length;

    const MIN_HEIGHT_PER_BAR = Math.max(60, avgLinesPerLabel * 20); // Adaptive per label
    const CALCULATED_HEIGHT = Math.max(
      config.height || 400,
      cleanedData.length * MIN_HEIGHT_PER_BAR
    );

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
          <ResponsiveContainer width="100%" height={CALCULATED_HEIGHT}>
            <BarChart
              layout="vertical"
              data={cleanedData}
              margin={{ top: 20, right: 100, left: 20, bottom: 20 }}
              barCategoryGap="20%"  // ✅ Increased gap for multi-line labels
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              />
              
              <YAxis
                type="category"
                dataKey={config.xAxis?.dataKey || "name"}
                tick={<CustomYAxisTick />}  // ✅ Multi-line tick component
                width={320}  // ✅ Increased width for wrapped text
                interval={0}  // ✅ Show all labels
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
                  radius={[0, 4, 4, 0]}
                >
                  <LabelList
                    dataKey={key}
                    position="right"
                    formatter={(value: number) => {
                      const dataPoint = cleanedData.find(d => d[key] === value);
                      return dataPoint?.formattedValue || `€${(value / 1000).toFixed(0)}k`;
                    }}
                    style={{
                      fontSize: 11,
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

  // Line Chart (unchanged)
  if (chartType === "line") {
    const CALCULATED_HEIGHT = config.height || 400;

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
          <ResponsiveContainer width="100%" height={CALCULATED_HEIGHT}>
            <LineChart 
              data={cleanedData} 
              margin={config.margin || { top: 20, right: 30, left: 50, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              
              <XAxis
                dataKey={config.xAxis?.dataKey || "name"}
                angle={config.xAxis?.angle || -45}
                textAnchor="end"
                height={80}
                interval={0}
                tick={{ fontSize: 11 }}
              />
              
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              />
              
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

  return (
    <div className="p-8 bg-gray-100 rounded-lg text-center">
      <p className="text-gray-600">Unsupported chart type: {chartType}</p>
    </div>
  );
};

export default DynamicChartRenderer;
