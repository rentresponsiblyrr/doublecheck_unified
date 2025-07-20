/**
 * ELITE PERFORMANCE OPTIMIZATION - LAZY LOADED CHARTS
 * 
 * This module lazy loads chart components to eliminate the 348KB charts chunk
 * from the critical path. Charts are only loaded when admin features are accessed.
 */

import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load all chart components
const LazyLineChart = React.lazy(() => 
  import('recharts').then(module => ({ default: module.LineChart }))
);

const LazyLine = React.lazy(() => 
  import('recharts').then(module => ({ default: module.Line }))
);

const LazyAreaChart = React.lazy(() => 
  import('recharts').then(module => ({ default: module.AreaChart }))
);

const LazyArea = React.lazy(() => 
  import('recharts').then(module => ({ default: module.Area }))
);

const LazyBarChart = React.lazy(() => 
  import('recharts').then(module => ({ default: module.BarChart }))
);

const LazyBar = React.lazy(() => 
  import('recharts').then(module => ({ default: module.Bar }))
);

const LazyPieChart = React.lazy(() => 
  import('recharts').then(module => ({ default: module.PieChart }))
);

const LazyPie = React.lazy(() => 
  import('recharts').then(module => ({ default: module.Pie }))
);

const LazyCell = React.lazy(() => 
  import('recharts').then(module => ({ default: module.Cell }))
);

const LazyXAxis = React.lazy(() => 
  import('recharts').then(module => ({ default: module.XAxis }))
);

const LazyYAxis = React.lazy(() => 
  import('recharts').then(module => ({ default: module.YAxis }))
);

const LazyCartesianGrid = React.lazy(() => 
  import('recharts').then(module => ({ default: module.CartesianGrid }))
);

const LazyTooltip = React.lazy(() => 
  import('recharts').then(module => ({ default: module.Tooltip }))
);

const LazyLegend = React.lazy(() => 
  import('recharts').then(module => ({ default: module.Legend }))
);

const LazyResponsiveContainer = React.lazy(() => 
  import('recharts').then(module => ({ default: module.ResponsiveContainer }))
);

// Chart loading fallback
function ChartLoadingFallback() {
  return (
    <div className="w-full h-64 p-4">
      <Skeleton className="w-full h-full rounded-lg" />
    </div>
  );
}

// Wrapper components with Suspense
export function LineChart(props: any) {
  return (
    <Suspense fallback={<ChartLoadingFallback />}>
      <LazyLineChart {...props} />
    </Suspense>
  );
}

export function Line(props: any) {
  return (
    <Suspense fallback={null}>
      <LazyLine {...props} />
    </Suspense>
  );
}

export function AreaChart(props: any) {
  return (
    <Suspense fallback={<ChartLoadingFallback />}>
      <LazyAreaChart {...props} />
    </Suspense>
  );
}

export function Area(props: any) {
  return (
    <Suspense fallback={null}>
      <LazyArea {...props} />
    </Suspense>
  );
}

export function BarChart(props: any) {
  return (
    <Suspense fallback={<ChartLoadingFallback />}>
      <LazyBarChart {...props} />
    </Suspense>
  );
}

export function Bar(props: any) {
  return (
    <Suspense fallback={null}>
      <LazyBar {...props} />
    </Suspense>
  );
}

export function PieChart(props: any) {
  return (
    <Suspense fallback={<ChartLoadingFallback />}>
      <LazyPieChart {...props} />
    </Suspense>
  );
}

export function Pie(props: any) {
  return (
    <Suspense fallback={null}>
      <LazyPie {...props} />
    </Suspense>
  );
}

export function Cell(props: any) {
  return (
    <Suspense fallback={null}>
      <LazyCell {...props} />
    </Suspense>
  );
}

export function XAxis(props: any) {
  return (
    <Suspense fallback={null}>
      <LazyXAxis {...props} />
    </Suspense>
  );
}

export function YAxis(props: any) {
  return (
    <Suspense fallback={null}>
      <LazyYAxis {...props} />
    </Suspense>
  );
}

export function CartesianGrid(props: any) {
  return (
    <Suspense fallback={null}>
      <LazyCartesianGrid {...props} />
    </Suspense>
  );
}

export function Tooltip(props: any) {
  return (
    <Suspense fallback={null}>
      <LazyTooltip {...props} />
    </Suspense>
  );
}

export function Legend(props: any) {
  return (
    <Suspense fallback={null}>
      <LazyLegend {...props} />
    </Suspense>
  );
}

export function ResponsiveContainer(props: any) {
  return (
    <Suspense fallback={<ChartLoadingFallback />}>
      <LazyResponsiveContainer {...props} />
    </Suspense>
  );
}