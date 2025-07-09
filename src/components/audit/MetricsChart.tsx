import React from 'react';

interface MetricData {
  name: string;
  value: number;
  change?: number;
  color?: string;
}

interface MetricsChartProps {
  data: MetricData[];
  title?: string;
  type?: 'line' | 'bar' | 'pie';
}

export const MetricsChart: React.FC<MetricsChartProps> = ({ 
  data, 
  title = 'Metrics', 
  type = 'bar' 
}) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="metrics-chart border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <div className="space-y-3">
        {data.map((metric, index) => (
          <div key={index} className="metric-item">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{metric.name}</span>
              <div className="text-right">
                <span className="text-lg font-semibold">{metric.value}</span>
                {metric.change !== undefined && (
                  <span className={`text-xs ml-2 ${
                    metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.change >= 0 ? '+' : ''}{metric.change}%
                  </span>
                )}
              </div>
            </div>
            
            {type === 'bar' && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    metric.color || 'bg-blue-500'
                  }`}
                  style={{ width: `${(metric.value / maxValue) * 100}%` }}
                ></div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No metrics data available
        </div>
      )}
    </div>
  );
};

export default MetricsChart;