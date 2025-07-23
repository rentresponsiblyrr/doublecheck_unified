/**
 * Chart Configuration Business Logic Hook
 * Extracted from chart.tsx for surgical refactoring
 */

import React from "react";
import { ChartConfig } from "@/components/ui/chart";

interface UseChartConfigurationProps {
  config: ChartConfig;
  id?: string;
}

export const useChartConfiguration = ({
  config,
  id,
}: UseChartConfigurationProps) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  // Extract color configuration from chart config
  const colorConfig = React.useMemo(() => {
    return Object.entries(config).filter(
      ([_, config]) => config.theme || config.color,
    );
  }, [config]);

  // Generate CSS variables for themes
  const generateStyleContent = React.useCallback(() => {
    if (!colorConfig.length) {
      return null;
    }

    const THEMES = { light: "", dark: ".dark" } as const;

    return Object.entries(THEMES)
      .map(
        ([theme, prefix]) => `
${prefix} [data-chart=${chartId}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join("\n")}
}
`,
      )
      .join("\n");
  }, [chartId, colorConfig]);

  // Helper function to extract item config from payload
  const getPayloadConfigFromPayload = React.useCallback(
    (payload: unknown, key: string) => {
      if (typeof payload !== "object" || payload === null) {
        return undefined;
      }

      const payloadPayload =
        "payload" in payload &&
        typeof payload.payload === "object" &&
        payload.payload !== null
          ? payload.payload
          : undefined;

      let configLabelKey: string = key;

      if (
        key in payload &&
        typeof payload[key as keyof typeof payload] === "string"
      ) {
        configLabelKey = payload[key as keyof typeof payload] as string;
      } else if (
        payloadPayload &&
        key in payloadPayload &&
        typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
      ) {
        configLabelKey = payloadPayload[
          key as keyof typeof payloadPayload
        ] as string;
      }

      return configLabelKey in config
        ? config[configLabelKey]
        : config[key as keyof typeof config];
    },
    [config],
  );

  return {
    chartId,
    colorConfig,
    generateStyleContent,
    getPayloadConfigFromPayload,
  };
};
