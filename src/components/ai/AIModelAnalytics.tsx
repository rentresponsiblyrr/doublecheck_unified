/**
 * AI Model Analytics Component
 * Individual AI model performance comparison and detailed metrics
 */

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Cpu, Database, Zap, Clock, DollarSign, Target } from "lucide-react";

interface ModelMetrics {
  id: string;
  name: string;
  requests: number;
  cost: number;
  avgResponseTime: number;
  avgAccuracy: number;
  errorRate: number;
  utilization: number;
  efficiency: number;
}

interface UsageData {
  hourlyDistribution: Array<{ hour: number; requests: number; cost: number }>;
  userSegments: Array<{ segment: string; usage: number; cost: number }>;
  contentTypes: Array<{ type: string; percentage: number; avgCost: number }>;
  geographicDistribution: Array<{
    region: string;
    requests: number;
    cost: number;
  }>;
}

interface AIModelAnalyticsProps {
  models: ModelMetrics[];
  usage: UsageData;
  isLoading?: boolean;
}

export const AIModelAnalytics: React.FC<AIModelAnalyticsProps> = ({
  models,
  usage,
  isLoading = false,
}) => {
  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 80) return "text-green-600";
    if (efficiency >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getUtilizationBadge = (utilization: number) => {
    if (utilization >= 80) return "default";
    if (utilization >= 50) return "secondary";
    return "outline";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Model Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cpu className="w-5 h-5 mr-2" />
            Model Performance Comparison
          </CardTitle>
          <CardDescription>
            Individual AI model metrics and efficiency analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {models.map((model) => (
              <div key={model.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-lg">{model.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {model.requests.toLocaleString()} requests • $
                      {model.cost.toFixed(2)} cost
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getUtilizationBadge(model.utilization)}>
                      {model.utilization.toFixed(0)}% utilized
                    </Badge>
                    <Badge
                      variant="outline"
                      className={getEfficiencyColor(model.efficiency)}
                    >
                      {model.efficiency.toFixed(0)}% efficient
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Response Time</span>
                    </div>
                    <div className="text-lg font-bold">
                      {model.avgResponseTime.toFixed(0)}ms
                    </div>
                    <Progress
                      value={Math.min(100, (3000 - model.avgResponseTime) / 30)}
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Accuracy</span>
                    </div>
                    <div className="text-lg font-bold">
                      {model.avgAccuracy.toFixed(1)}%
                    </div>
                    <Progress value={model.avgAccuracy} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium">Cost/Request</span>
                    </div>
                    <div className="text-lg font-bold">
                      ${(model.cost / model.requests).toFixed(3)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {model.errorRate.toFixed(1)}% error rate
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium">Efficiency</span>
                    </div>
                    <div
                      className={`text-lg font-bold ${getEfficiencyColor(model.efficiency)}`}
                    >
                      {model.efficiency.toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Accuracy/Cost ratio
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Content Type Distribution
            </CardTitle>
            <CardDescription>
              AI usage by content type and average costs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usage.contentTypes.map((type) => (
                <div key={type.type} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{type.type}</span>
                    <div className="text-right">
                      <div className="text-sm font-bold">
                        {type.percentage}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ${type.avgCost.toFixed(3)}/req
                      </div>
                    </div>
                  </div>
                  <Progress value={type.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Segment Analysis</CardTitle>
            <CardDescription>
              AI usage and costs by user segment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usage.userSegments.map((segment) => (
                <div
                  key={segment.segment}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{segment.segment}</div>
                    <div className="text-sm text-muted-foreground">
                      {segment.usage}% of usage
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${segment.cost.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">
                      total cost
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Geographic Usage Distribution</CardTitle>
          <CardDescription>
            AI requests and costs by geographic region
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {usage.geographicDistribution.map((region) => (
              <div
                key={region.region}
                className="text-center p-4 border rounded-lg"
              >
                <div className="font-medium mb-2">{region.region}</div>
                <div className="text-2xl font-bold mb-1">
                  {region.requests.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">requests</div>
                <div className="text-lg font-bold text-green-600 mt-2">
                  ${region.cost.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">cost</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
