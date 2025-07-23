/**
 * Simple Bug Report Management - Admin Portal Integration
 *
 * Provides bug reporting and management functionality within the admin portal.
 * Allows admins to view, manage, and resolve bug reports from users.
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bug,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  MessageSquare,
  Filter,
  Search,
} from "lucide-react";
import { BugReportDialog } from "@/components/bug-report/BugReportDialog";

// Mock data for bug reports - in production this would come from database
const mockBugReports = [
  {
    id: "1",
    title: "Admin portal user management not loading",
    description: "Users section shows blank screen with 503 errors",
    severity: "high",
    status: "open",
    reporter: "john.doe@example.com",
    reportedAt: "2025-01-22T14:30:00Z",
    category: "admin",
    steps: "Navigate to /admin/users, page fails to load",
    environment: "Production",
  },
  {
    id: "2",
    title: "Inspection checklist not saving",
    description: "Checklist items lose data when navigating between pages",
    severity: "medium",
    status: "in-progress",
    reporter: "jane.smith@example.com",
    reportedAt: "2025-01-22T10:15:00Z",
    category: "inspection",
    steps: "Complete checklist items, navigate away, return to see lost data",
    environment: "Production",
  },
  {
    id: "3",
    title: "Performance budget filter error",
    description:
      "Console shows TypeError: budgetStatus.violations.filter is not a function",
    severity: "low",
    status: "resolved",
    reporter: "admin@example.com",
    reportedAt: "2025-01-22T09:00:00Z",
    category: "performance",
    steps: "Open admin portal, check console for errors",
    environment: "Production",
  },
];

interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "in-progress" | "resolved" | "closed";
  reporter: string;
  reportedAt: string;
  category: string;
  steps: string;
  environment: string;
}

export default function SimpleBugReportManagement() {
  const [bugReports, setBugReports] = useState<BugReport[]>(mockBugReports);
  const [showNewBugDialog, setShowNewBugDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReports = bugReports.filter((report) => {
    const matchesStatus =
      filterStatus === "all" || report.status === filterStatus;
    const matchesSeverity =
      filterSeverity === "all" || report.severity === filterSeverity;
    const matchesSearch =
      searchTerm === "" ||
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSeverity && matchesSearch;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertTriangle className="w-4 h-4" />;
      case "in-progress":
        return <Clock className="w-4 h-4" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4" />;
      case "closed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Bug className="w-4 h-4" />;
    }
  };

  const handleStatusChange = (reportId: string, newStatus: string) => {
    setBugReports((prev) =>
      prev.map((report) =>
        report.id === reportId
          ? { ...report, status: newStatus as BugReport["status"] }
          : report,
      ),
    );
  };

  return (
    <div id="bug-report-management-container" className="space-y-6">
      {/* Header */}
      <div id="bug-report-header" className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bug Report Management
          </h1>
          <p className="text-gray-600 mt-2">
            Track and manage bug reports from users across the platform
          </p>
        </div>
        <Button
          onClick={() => setShowNewBugDialog(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Bug className="w-4 h-4 mr-2" />
          Report New Bug
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Reports
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {bugReports.length}
                </p>
              </div>
              <Bug className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open</p>
                <p className="text-2xl font-bold text-red-600">
                  {bugReports.filter((r) => r.status === "open").length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {bugReports.filter((r) => r.status === "in-progress").length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {bugReports.filter((r) => r.status === "resolved").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Filters:
              </span>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bug Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {report.title}
                    </h3>
                    <Badge className={getSeverityColor(report.severity)}>
                      {report.severity.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(report.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(report.status)}
                        <span>
                          {report.status.replace("-", " ").toUpperCase()}
                        </span>
                      </div>
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-3">{report.description}</p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{report.reporter}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(report.reportedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{report.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {report.status === "open" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleStatusChange(report.id, "in-progress")
                      }
                    >
                      Start Work
                    </Button>
                  )}
                  {report.status === "in-progress" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      onClick={() => handleStatusChange(report.id, "resolved")}
                    >
                      Mark Resolved
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            {(report.steps || report.environment) && (
              <CardContent className="pt-0">
                <div className="bg-gray-50 rounded-md p-3 space-y-2">
                  {report.steps && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Reproduction Steps:
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        {report.steps}
                      </p>
                    </div>
                  )}
                  {report.environment && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Environment:
                      </span>
                      <span className="text-sm text-gray-600 ml-2">
                        {report.environment}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Bug className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Bug Reports Found
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== "all" || filterSeverity !== "all"
                ? "No reports match your current filters"
                : "No bug reports have been submitted yet"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Bug Report Dialog */}
      <BugReportDialog
        open={showNewBugDialog}
        onClose={() => setShowNewBugDialog(false)}
      />
    </div>
  );
}
