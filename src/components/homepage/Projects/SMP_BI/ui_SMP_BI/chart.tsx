import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "../lib_SMP_BI/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = { config: ChartConfig }
const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }
  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, cfg]) => cfg.theme || cfg.color
  )
  if (!colorConfig.length) return null

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : ``
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

/** Decoupled, stable shapes (don’t depend on Recharts’ internal TS types) */
type TooltipEntry = {
  color?: string
  dataKey?: string | number | ((o: unknown) => unknown)
  name?: string | number
  value?: string | number | readonly (string | number)[]
  payload?: Record<string, unknown> | null
}

type TooltipContentProps = React.HTMLAttributes<HTMLDivElement> & {
  active?: boolean
  payload?: readonly TooltipEntry[]
  label?: unknown
  formatter?: (
    value: string | number | (string | number)[],
    name: string | number,
    item: TooltipEntry,
    index: number,
    payload: readonly TooltipEntry[]
  ) => React.ReactNode
  labelFormatter?: (
    label: unknown,
    payload: readonly TooltipEntry[]
  ) => React.ReactNode

  // extras used by this component
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: "line" | "dot" | "dashed"
  nameKey?: string
  labelKey?: string
  labelClassName?: string
  color?: string
}

const ChartTooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
      ...divProps
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) return null

      const [item] = payload
      const keyField = `${labelKey || item.dataKey || item.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, keyField)
      const derived =
        !labelKey && typeof label === "string"
          ? config[label]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(derived ?? "", payload)}
          </div>
        )
      }
      if (!derived) return null
      return <div className={cn("font-medium", labelClassName)}>{derived}</div>
    }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey])

    if (!active || !payload?.length) return null
    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
        {...divProps}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor =
              color ||
              (item.payload && (item.payload as any).fill) ||
              item.color

            return (
              <div
                key={
                  typeof item.dataKey === "function"
                    ? String(item.name ?? index)
                    : String(item.dataKey ?? item.name ?? index)
                }
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item.value !== undefined && item.name !== undefined ? (
                  (() => {
                    // normalize readonly array → mutable array
                    const valueFixed: string | number | (string | number)[] =
                      Array.isArray(item.value)
                        ? [...item.value]
                        : (item.value as string | number)

                    const nameFixed = String(item.name)

                    return formatter(
                      valueFixed,
                      nameFixed,
                      item,
                      index,
                      payload
                    )
                  })()
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor as string | undefined,
                              "--color-border": indicatorColor as string | undefined,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label ?? String(item.name ?? "")}
                        </span>
                      </div>
                      {item.value !== undefined && item.value !== null && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {Array.isArray(item.value)
                            ? [...item.value].join(", ")
                            : (item.value as any)?.toLocaleString?.() ?? String(item.value)}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegend = RechartsPrimitive.Legend

type LegendEntry = {
  value?: unknown
  color?: string
  payload?: Record<string, unknown> | null
}

type LegendContentProps = React.HTMLAttributes<HTMLDivElement> & {
  payload?: readonly LegendEntry[]
  verticalAlign?: "top" | "bottom" | "middle" | string
  hideIcon?: boolean
  nameKey?: string
}

const ChartLegendContent = React.forwardRef<HTMLDivElement, LegendContentProps>(
  ({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey, ...divProps }, ref) => {
    const { config } = useChart()
    if (!payload?.length) return null

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
        {...divProps}
      >
        {payload.map((item, idx) => {
          const legendKey = `${nameKey || (item.value as string) || `legend-${idx}`}`
          const itemConfig = getPayloadConfigFromPayload(config, item as any, legendKey)

          return (
            <div
              key={`${String(item.value)}-${idx}`}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: item.color }}
                />
              )}
              {itemConfig?.label ?? String(item.value ?? "")}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegend"

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) return undefined

  const payloadPayload =
    "payload" in (payload as any) &&
    typeof (payload as any).payload === "object" &&
    (payload as any).payload !== null
      ? (payload as any).payload
      : undefined

  let cfgKey: string = key

  if (key in (payload as any) && typeof (payload as any)[key] === "string") {
    cfgKey = (payload as any)[key] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof (payloadPayload as any)[key] === "string"
  ) {
    cfgKey = (payloadPayload as any)[key] as string
  }

  return cfgKey in config ? config[cfgKey] : (config as any)[key]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
