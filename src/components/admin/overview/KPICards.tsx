import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Activity,
  Brain,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { BusinessKPIs } from "./types";

interface KPICardsProps {
  kpis: BusinessKPIs;
}

export const KPICards: React.FC<KPICardsProps> = ({ kpis }) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (value: number, isPositive: boolean = true) => {
    const trending = isPositive ? value >= 0 : value < 0;
    return trending ? (
      <ArrowUpRight className="w-4 h-4 text-green-500" />
    ) : (
      <ArrowDownRight className="w-4 h-4 text-red-500" />
    );
  };

  return (
    <div
      id="kpi-cards-grid"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {/* Properties KPI */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Properties
          </CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {kpis.totalProperties.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Properties in system</p>
        </CardContent>
      </Card>

      {/* Inspections KPI */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inspections</CardTitle>
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {kpis.totalInspections.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {getTrendIcon(kpis.growthRate)}
            <span>{formatPercentage(kpis.growthRate)} vs last month</span>
          </div>
        </CardContent>
      </Card>

      {/* Revenue KPI */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(kpis.monthlyRevenue)}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {getTrendIcon(kpis.growthRate)}
            <span>+{formatPercentage(Math.abs(kpis.growthRate))} growth</span>
          </div>
        </CardContent>
      </Card>

      {/* Completion Rate KPI */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPercentage(kpis.completionRate)}
          </div>
          <p className="text-xs text-muted-foreground">Inspections completed</p>
        </CardContent>
      </Card>

      {/* AI Accuracy KPI */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
          <Brain className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPercentage(kpis.aiAccuracy)}
          </div>
          <Badge
            variant={kpis.aiAccuracy >= 90 ? "default" : "secondary"}
            className="text-xs"
          >
            {kpis.aiAccuracy >= 90 ? "Excellent" : "Good"}
          </Badge>
        </CardContent>
      </Card>

      {/* Customer Satisfaction KPI */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {kpis.customerSatisfaction.toFixed(1)}/5
          </div>
          <p className="text-xs text-muted-foreground">Average rating</p>
        </CardContent>
      </Card>

      {/* Active Inspectors KPI */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Active Inspectors
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.activeInspectors}</div>
          <p className="text-xs text-muted-foreground">Currently working</p>
        </CardContent>
      </Card>

      {/* Avg Inspection Time KPI */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.avgInspectionTime}min</div>
          <p className="text-xs text-muted-foreground">Per inspection</p>
        </CardContent>
      </Card>
    </div>
  );
};
