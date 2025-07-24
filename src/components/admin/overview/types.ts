export interface BusinessKPIs {
  totalProperties: number;
  totalInspections: number;
  activeInspectors: number;
  completionRate: number;
  avgInspectionTime: number;
  customerSatisfaction: number;
  monthlyRevenue: number;
  growthRate: number;
  pendingAudits: number;
  flaggedInspections: number;
  avgPhotosPerInspection: number;
  aiAccuracy: number;
}

export interface TrendData {
  date: string;
  inspections: number;
  revenue: number;
  satisfaction: number;
}

export interface RegionalData {
  region: string;
  inspections: number;
  revenue: number;
  growth: number;
}

export interface AdminOverviewProps {
  className?: string;
}

export type TimeRange = "7d" | "30d" | "90d" | "1y";

export interface DashboardData {
  kpis: BusinessKPIs;
  trends: TrendData[];
  regions: RegionalData[];
  isLoading: boolean;
}
