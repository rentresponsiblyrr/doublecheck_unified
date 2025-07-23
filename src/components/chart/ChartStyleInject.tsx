/**
 * Chart Style Injection Component
 * Extracted from chart.tsx
 */

import React from "react";
import { ChartConfig } from "@/components/ui/chart";

interface ChartStyleInjectProps {
  id: string;
  config: ChartConfig;
}

export const ChartStyleInject: React.FC<ChartStyleInjectProps> = ({
  id,
  config,
}) => {
  const THEMES = { light: "", dark: ".dark" } as const;

  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color,
  );

  if (!colorConfig.length) {
    return null;
  }

  const styleContent = Object.entries(THEMES)
    .map(
      ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
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

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: styleContent,
      }}
    />
  );
};
