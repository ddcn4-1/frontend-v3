'use client';

import * as React from 'react';
import * as RechartsPrimitive from 'recharts';
import type { TooltipProps } from 'recharts/types/component/Tooltip';
import type {
  NameType,
  Payload as TooltipPayload,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent';
import type { Props as LegendComponentProps } from 'recharts/types/component/Legend';
import { cn } from '../lib/utils';

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: '', dark: '.dark' } as const;

interface BaseChartConfigEntry {
  readonly label?: React.ReactNode;
  readonly icon?: React.ComponentType;
}

interface ChartConfigWithColor extends BaseChartConfigEntry {
  readonly color?: string;
  readonly theme?: never;
}

interface ChartConfigWithTheme extends BaseChartConfigEntry {
  readonly color?: never;
  readonly theme: Record<keyof typeof THEMES, string>;
}

type ChartConfigEntry = ChartConfigWithColor | ChartConfigWithTheme;

export type ChartConfig = Record<string, ChartConfigEntry>;

interface ChartContextProps {
  config: ChartConfig;
}

const ChartContext = React.createContext<ChartContextProps | null>(null);

type LegendPayloadItem = NonNullable<LegendComponentProps['payload']>[number];
type RechartsTooltipProps<TValue extends ValueType, TName extends NameType> = TooltipProps<
  TValue,
  TName
>;
type TooltipPayloadItem<TValue extends ValueType, TName extends NameType> = TooltipPayload<
  TValue,
  TName
>;

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }

  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children'];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`;
  const contextValue = React.useMemo(() => ({ config }), [config]);

  return (
    <ChartContext.Provider value={contextValue}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([, entry]) => entry.theme || entry.color);

  if (colorConfig.length === 0) {
    return null;
  }

  const themeEntries = Object.entries(THEMES) as [keyof typeof THEMES, string][];
  const cssByTheme = themeEntries
    .map(([themeKey, prefix]) => {
      const declarations = colorConfig
        .map(([key, entry]) => {
          const themeColor = getThemeColor(entry, themeKey);
          return themeColor ? `  --color-${key}: ${themeColor};` : '';
        })
        .filter(Boolean)
        .join('\n');

      if (!declarations) {
        return '';
      }

      return `${prefix} [data-chart=${id}] {\n${declarations}\n}`;
    })
    .filter(Boolean)
    .join('\n');

  if (!cssByTheme) {
    return null;
  }

  return <style dangerouslySetInnerHTML={{ __html: cssByTheme }} />;
};

const getThemeColor = (
  entry: ChartConfigEntry,
  themeKey: keyof typeof THEMES,
): string | undefined => {
  if (entry.theme) {
    const descriptor = Object.getOwnPropertyDescriptor(entry.theme, themeKey);
    if (descriptor && typeof descriptor.value === 'string') {
      return descriptor.value;
    }
  }
  return entry.color;
};

const ChartTooltip = RechartsPrimitive.Tooltip;

function ChartTooltipContent<
  TValue extends ValueType = ValueType,
  TName extends NameType = NameType,
>({
  active,
  payload,
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: RechartsTooltipProps<TValue, TName> &
  React.ComponentProps<'div'> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: 'line' | 'dot' | 'dashed';
    nameKey?: string;
    labelKey?: string;
  }) {
  const { config } = useChart();
  const tooltipPayloadItems = (payload ?? []) as TooltipPayloadItem<TValue, TName>[];

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || tooltipPayloadItems.length === 0) {
      return null;
    }

    const [firstItem] = tooltipPayloadItems;
    const dataKeyValue = extractDataKeyValue(firstItem.dataKey);
    const nameCandidate = resolveStringKey(firstItem.name);
    const fallbackKey = labelKey ?? dataKeyValue ?? nameCandidate ?? 'value';
    const itemConfig = getPayloadConfigFromPayload(
      config,
      firstItem as unknown as TooltipPayloadItem<ValueType, NameType>,
      fallbackKey,
    );
    const labelEntry =
      !labelKey && typeof label === 'string' ? getConfigEntry(config, label) : undefined;

    const resolvedLabel =
      !labelKey && typeof label === 'string' ? (labelEntry?.label ?? label) : itemConfig?.label;

    if (labelFormatter) {
      return (
        <div className={cn('font-medium', labelClassName)}>
          {labelFormatter(resolvedLabel, tooltipPayloadItems)}
        </div>
      );
    }

    if (!resolvedLabel) {
      return null;
    }

    return <div className={cn('font-medium', labelClassName)}>{resolvedLabel}</div>;
  }, [label, labelFormatter, tooltipPayloadItems, hideLabel, labelClassName, config, labelKey]);

  if (!active || tooltipPayloadItems.length === 0) {
    return null;
  }

  const nestLabel = tooltipPayloadItems.length === 1 && indicator !== 'dot';

  return (
    <div
      className={cn(
        'border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl',
        className,
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {tooltipPayloadItems.map((item, index) => {
          const dataKeyValue = extractDataKeyValue(item.dataKey);
          const nameCandidate = resolveStringKey(item.name);
          const fallbackKey = nameKey ?? dataKeyValue ?? nameCandidate ?? 'value';
          const itemConfig = getPayloadConfigFromPayload(
            config,
            item as unknown as TooltipPayloadItem<ValueType, NameType>,
            fallbackKey,
          );
          const indicatorColorValue =
            color ??
            getTooltipEntryFill(item) ??
            (typeof item.color === 'string' ? item.color : undefined);
          const indicatorVariables = indicatorColorValue
            ? ({
                '--color-bg': indicatorColorValue,
                '--color-border': indicatorColorValue,
              } as React.CSSProperties)
            : undefined;
          const stableKey = resolveTooltipItemKey(item, index);

          return (
            <div
              key={stableKey}
              className={cn(
                '[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5',
                indicator === 'dot' && 'items-center',
              )}
            >
              {formatter && hasTooltipFormatterArgs(item) ? (
                formatter(
                  item.value,
                  item.name,
                  item as TooltipPayloadItem<TValue, TName>,
                  index,
                  tooltipPayloadItems,
                )
              ) : (
                <>
                  {itemConfig?.icon ? (
                    <itemConfig.icon />
                  ) : (
                    !hideIndicator && (
                      <div
                        className={cn(
                          'shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)',
                          {
                            'h-2.5 w-2.5': indicator === 'dot',
                            'w-1': indicator === 'line',
                            'w-0 border-[1.5px] border-dashed bg-transparent':
                              indicator === 'dashed',
                            'my-0.5': nestLabel && indicator === 'dashed',
                          },
                        )}
                        style={indicatorVariables}
                      />
                    )
                  )}
                  <div
                    className={cn(
                      'flex flex-1 justify-between leading-none',
                      nestLabel ? 'items-end' : 'items-center',
                    )}
                  >
                    <div className="grid gap-1.5">
                      {nestLabel ? tooltipLabel : null}
                      <span className="text-muted-foreground">
                        {itemConfig?.label || item.name}
                      </span>
                    </div>
                    {item.value && (
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {item.value.toLocaleString()}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = 'bottom',
  nameKey,
}: React.ComponentProps<'div'> &
  Pick<RechartsPrimitive.LegendProps, 'payload' | 'verticalAlign'> & {
    hideIcon?: boolean;
    nameKey?: string;
  }) {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-4',
        verticalAlign === 'top' ? 'pb-3' : 'pt-3',
        className,
      )}
    >
      {payload.map((item, index) => {
        const dataKeyValue = extractDataKeyValue(item.dataKey);
        const valueCandidate = resolveStringKey(item.value);
        const fallbackKey = nameKey ?? dataKeyValue ?? valueCandidate ?? 'value';
        const itemConfig = getPayloadConfigFromPayload(config, item, fallbackKey);
        const legendKey = resolveLegendItemKey(item, index);

        return (
          <div
            key={legendKey}
            className={cn(
              '[&>svg]:text-muted-foreground flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3',
            )}
          >
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            {itemConfig?.label}
          </div>
        );
      })}
    </div>
  );
}

function hasTooltipFormatterArgs<TValue extends ValueType, TName extends NameType>(
  entry: TooltipPayloadItem<TValue, TName>,
): entry is TooltipPayloadItem<TValue, TName> & {
  value: TValue;
  name: TName;
} {
  return entry.value !== undefined && entry.name !== undefined;
}

function resolveTooltipItemKey<TValue extends ValueType, TName extends NameType>(
  item: TooltipPayloadItem<TValue, TName>,
  index: number,
): string {
  const dataKeyValue = extractDataKeyValue(item.dataKey);
  if (dataKeyValue) {
    return dataKeyValue;
  }
  const nameCandidate = 'name' in item ? resolveStringKey(item.name) : undefined;
  if (nameCandidate) {
    return nameCandidate;
  }
  const valueCandidate = resolveStringKey(item.value);
  if (valueCandidate) {
    return valueCandidate;
  }
  return `item-${index}`;
}

function resolveLegendItemKey(item: LegendPayloadItem, index: number): string {
  const dataKeyValue = extractDataKeyValue(item.dataKey);
  if (dataKeyValue) {
    return dataKeyValue;
  }
  const valueCandidate = resolveStringKey(item.value);
  if (valueCandidate) {
    return valueCandidate;
  }
  return `legend-${index}`;
}

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload<TValue extends ValueType, TName extends NameType>(
  config: ChartConfig,
  payload: TooltipPayloadItem<TValue, TName> | LegendPayloadItem | undefined,
  fallbackKey: string,
): ChartConfigEntry | undefined {
  const fallback = getConfigEntry(config, fallbackKey);

  if (!payload) {
    return fallback;
  }

  const dataKey = extractDataKeyValue(payload.dataKey);
  const dataKeyEntry = dataKey ? getConfigEntry(config, dataKey) : undefined;
  if (dataKeyEntry) {
    return dataKeyEntry;
  }

  const nameKeyValue = 'name' in payload ? resolveStringKey(payload.name) : undefined;
  const nameEntry = nameKeyValue ? getConfigEntry(config, nameKeyValue) : undefined;
  if (nameEntry) {
    return nameEntry;
  }

  if ('payload' in payload && isRecord(payload.payload)) {
    const nestedValue = getStringProperty(payload.payload, fallbackKey);
    const nestedEntry = nestedValue ? getConfigEntry(config, nestedValue) : undefined;
    if (nestedEntry) {
      return nestedEntry;
    }
  }

  return fallback;
}

function extractDataKeyValue(dataKey: unknown): string | undefined {
  if (typeof dataKey === 'string' || typeof dataKey === 'number') {
    return String(dataKey);
  }
  return undefined;
}

function getTooltipEntryFill<TValue extends ValueType, TName extends NameType>(
  entry: TooltipPayloadItem<TValue, TName>,
): string | undefined {
  if (isRecord(entry.payload)) {
    const fill = entry.payload.fill;
    if (typeof fill === 'string') {
      return fill;
    }
  }
  return undefined;
}

function getStringProperty(source: Record<string, unknown>, property: string): string | undefined {
  const descriptor = Object.getOwnPropertyDescriptor(source, property);
  if (!descriptor) {
    return undefined;
  }
  return typeof descriptor.value === 'string' ? descriptor.value : undefined;
}

function getConfigEntry(config: ChartConfig, key: string): ChartConfigEntry | undefined {
  const descriptor = Object.getOwnPropertyDescriptor(config, key);
  if (!descriptor) {
    return undefined;
  }
  return descriptor.value as ChartConfigEntry | undefined;
}

function resolveStringKey(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
