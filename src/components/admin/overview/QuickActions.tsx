import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Users,
  Settings,
  AlertCircle,
  Eye,
  Zap,
  Timer,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BusinessKPIs } from "./types";

interface QuickActionsProps {
  kpis: BusinessKPIs;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ kpis }) => {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Review Pending Audits",
      description: "Check inspections waiting for review",
      count: kpis.pendingAudits,
      icon: Eye,
      variant: "default" as const,
      action: () => navigate("/admin/audit"),
    },
    {
      title: "Flagged Inspections",
      description: "Review inspections that need attention",
      count: kpis.flaggedInspections,
      icon: AlertCircle,
      variant: "destructive" as const,
      action: () => navigate("/admin/inspections"),
    },
    {
      title: "Manage Users",
      description: "Add or modify inspector accounts",
      count: kpis.activeInspectors,
      icon: Users,
      variant: "outline" as const,
      action: () => navigate("/admin/users"),
    },
    {
      title: "System Performance",
      description: "Monitor AI accuracy and performance",
      count: Math.round(kpis.aiAccuracy),
      icon: Zap,
      variant: "secondary" as const,
      action: () => navigate("/admin/performance"),
    },
    {
      title: "Generate Reports",
      description: "Create business and performance reports",
      count: 0,
      icon: FileText,
      variant: "outline" as const,
      action: () => navigate("/admin/reports"),
    },
    {
      title: "System Settings",
      description: "Configure system parameters",
      count: 0,
      icon: Settings,
      variant: "outline" as const,
      action: () => navigate("/admin/settings"),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="w-5 h-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <div
              key={index}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={action.action}
            >
              <div className="flex items-start justify-between mb-2">
                <action.icon className="w-5 h-5 text-gray-600" />
                {action.count > 0 && (
                  <Badge variant={action.variant} className="text-xs">
                    {action.count}
                  </Badge>
                )}
              </div>

              <h3 className="font-medium text-sm mb-1">{action.title}</h3>
              <p className="text-xs text-gray-600 mb-3">{action.description}</p>

              <Button size="sm" variant={action.variant} className="w-full">
                Open
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
