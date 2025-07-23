/**
 * Chart Context Provider Component
 * Extracted from chart.tsx
 */

import React from "react";
import { ChartConfig } from "@/components/ui/chart";

type ChartContextProps = {
  config: ChartConfig;
};

export const ChartContext = React.createContext<ChartContextProps | null>(null);

export const useChart = () => {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
};

interface ChartContextProviderProps {
  config: ChartConfig;
  children: React.ReactNode;
}

export const ChartContextProvider: React.FC<ChartContextProviderProps> = ({
  config,
  children,
}) => {
  return (
    <ChartContext.Provider value={{ config }}>{children}</ChartContext.Provider>
  );
};
