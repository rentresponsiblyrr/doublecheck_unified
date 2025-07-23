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
  ClipboardList,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  FileText,
} from "lucide-react";
import { ChecklistStats, SystemHealth } from "./types";

interface ChecklistStatsPanelProps {
  stats: ChecklistStats;
  systemHealth: SystemHealth;
  isLoading: boolean;
}

export const ChecklistStatsPanel: React.FC<ChecklistStatsPanelProps> = ({
  stats,
  systemHealth,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div id="stats-loading" className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div id="checklist-stats-panel" className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card id="total-items-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All checklist items</p>
          </CardContent>
        </Card>

        <Card id="active-items-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Items</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
            <p className="text-xs text-muted-foreground">Currently in use</p>
          </CardContent>
        </Card>

        <Card id="required-items-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Required Items
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.required}
            </div>
            <p className="text-xs text-muted-foreground">Must be completed</p>
          </CardContent>
        </Card>

        <Card id="deleted-items-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deleted Items</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.deleted}
            </div>
            <p className="text-xs text-muted-foreground">Soft deleted</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card id="categories-breakdown-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>By Category</span>
            </CardTitle>
            <CardDescription>Items grouped by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.byCategory).map(([category, count]) => (
                <div
                  key={category}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm capitalize">{category}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
              {Object.keys(stats.byCategory).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No categories found
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card id="evidence-types-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>By Evidence Type</span>
            </CardTitle>
            <CardDescription>
              Items grouped by evidence requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.byEvidenceType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{type}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
              {Object.keys(stats.byEvidenceType).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No evidence types found
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {systemHealth && (
        <Card id="system-health-card">
          <CardHeader>
            <CardTitle className="text-sm">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                {systemHealth.tableExists ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span>Table</span>
              </div>
              <div className="flex items-center space-x-1">
                {systemHealth.hasPermissions ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span>Permissions</span>
              </div>
              <div className="flex items-center space-x-1">
                {systemHealth.hasData ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span>Data</span>
              </div>
              <span className="text-muted-foreground">
                Last checked: {systemHealth.lastChecked.toLocaleTimeString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
