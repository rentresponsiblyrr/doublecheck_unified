/**
 * AI Cost Optimization Component
 * Cost analysis, optimization recommendations, and savings opportunities
 */

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DollarSign,
  TrendingDown,
  Lightbulb,
  Settings,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface OptimizationData {
  potentialSavings: number;
  implementedOptimizations: number;
  recommendedActions: string[];
  costReductionOpportunities: Array<{
    type: string;
    description: string;
    savings: number;
    effort: "low" | "medium" | "high";
  }>;
}

interface AICostOptimizationProps {
  optimization: OptimizationData;
  onImplementOptimization?: (type: string) => void;
  onAutoOptimizeToggle?: (enabled: boolean) => void;
  autoOptimizeEnabled?: boolean;
  isLoading?: boolean;
}

export const AICostOptimization: React.FC<AICostOptimizationProps> = ({
  optimization,
  onImplementOptimization,
  onAutoOptimizeToggle,
  autoOptimizeEnabled = false,
  isLoading = false,
}) => {
  const getEffortColor = (effort: "low" | "medium" | "high") => {
    switch (effort) {
      case "low":
        return "bg-green-100 text-green-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "high":
        return "bg-red-100 text-red-700";
    }
  };

  const getEffortIcon = (effort: "low" | "medium" | "high") => {
    switch (effort) {
      case "low":
        return <CheckCircle className="w-4 h-4" />;
      case "medium":
        return <Settings className="w-4 h-4" />;
      case "high":
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getSavingsLevel = (savings: number) => {
    if (savings > 50) return "High Impact";
    if (savings > 20) return "Medium Impact";
    return "Low Impact";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-20 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Optimization Summary */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Potential Savings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${optimization.potentialSavings.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly estimated savings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Implemented</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {optimization.implementedOptimizations}
            </div>
            <p className="text-xs text-muted-foreground">
              Active optimizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {optimization.costReductionOpportunities.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Available optimizations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Optimization Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Lightbulb className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="flex items-center justify-between">
            <span>
              Auto-optimization is{" "}
              {autoOptimizeEnabled ? "enabled" : "disabled"}.
              {autoOptimizeEnabled
                ? " The system will automatically implement low-effort optimizations."
                : " Enable to automatically apply cost-saving measures."}
            </span>
            <Button
              size="sm"
              variant={autoOptimizeEnabled ? "outline" : "default"}
              onClick={() => onAutoOptimizeToggle?.(!autoOptimizeEnabled)}
            >
              {autoOptimizeEnabled ? "Disable" : "Enable"} Auto-Optimize
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Recommended Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="w-5 h-5 mr-2" />
            Immediate Recommendations
          </CardTitle>
          <CardDescription>
            Quick actions to improve AI cost efficiency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {optimization.recommendedActions.map((action, index) => (
              <div
                key={index}
                className="flex items-center p-3 border rounded-lg"
              >
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-sm">{action}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cost Reduction Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingDown className="w-5 h-5 mr-2" />
            Cost Reduction Opportunities
          </CardTitle>
          <CardDescription>
            Specific optimizations ranked by impact and effort
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {optimization.costReductionOpportunities
              .sort((a, b) => b.savings - a.savings)
              .map((opportunity, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">
                          {opportunity.type.replace("-", " ").toUpperCase()}
                        </h4>
                        <Badge
                          variant="outline"
                          className={getEffortColor(opportunity.effort)}
                        >
                          {getEffortIcon(opportunity.effort)}
                          <span className="ml-1">
                            {opportunity.effort} effort
                          </span>
                        </Badge>
                        <Badge variant="secondary">
                          {getSavingsLevel(opportunity.savings)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {opportunity.description}
                      </p>
                      <div className="text-sm">
                        <span className="font-medium text-green-600">
                          Potential savings: ${opportunity.savings.toFixed(2)}
                          /month
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onImplementOptimization?.(opportunity.type)
                      }
                      className="ml-4"
                    >
                      Implement
                    </Button>
                  </div>

                  {/* Progress indicator for implementation */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.random() * 30}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Implementation progress
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Wins</CardTitle>
            <CardDescription>
              Low-effort optimizations you can implement now
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {optimization.costReductionOpportunities
                .filter((opp) => opp.effort === "low")
                .slice(0, 3)
                .map((opp, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-green-50 rounded"
                  >
                    <span className="text-sm">
                      {opp.type.replace("-", " ")}
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      ${opp.savings.toFixed(0)}/mo
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Long-term Projects</CardTitle>
            <CardDescription>
              High-impact optimizations requiring more effort
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {optimization.costReductionOpportunities
                .filter((opp) => opp.effort === "high")
                .slice(0, 3)
                .map((opp, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-orange-50 rounded"
                  >
                    <span className="text-sm">
                      {opp.type.replace("-", " ")}
                    </span>
                    <span className="text-sm font-medium text-orange-600">
                      ${opp.savings.toFixed(0)}/mo
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
