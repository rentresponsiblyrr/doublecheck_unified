import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3, PieChart, Activity } from "lucide-react";
import { TrendData, RegionalData } from "./types";

interface TrendChartsProps {
  trendData: TrendData[];
  regionalData: RegionalData[];
}

export const TrendCharts: React.FC<TrendChartsProps> = ({
  trendData,
  regionalData,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance Trends
          </CardTitle>
          <CardDescription>
            Monthly performance metrics over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trendData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-sm text-gray-500">
                      {item.inspections} inspections
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.inspections / 100}%` }}
                    />
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-sm font-semibold">
                    ${(item.revenue / 1000).toFixed(1)}k
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.satisfaction.toFixed(1)}/5 ⭐
                  </div>
                </div>
              </div>
            ))}
          </div>

          {trendData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No trend data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regional Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Regional Performance
          </CardTitle>
          <CardDescription>Performance breakdown by region</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {regionalData.map((region, index) => {
              const colors = [
                "bg-blue-500",
                "bg-green-500",
                "bg-yellow-500",
                "bg-red-500",
                "bg-purple-500",
              ];
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}
                    />
                    <div>
                      <div className="font-medium">{region.region}</div>
                      <div className="text-sm text-gray-500">
                        {region.inspections} inspections
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ${(region.revenue / 1000).toFixed(1)}k
                    </div>
                    <div
                      className={`text-sm ${region.growth >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {region.growth >= 0 ? "+" : ""}
                      {region.growth.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {regionalData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No regional data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
