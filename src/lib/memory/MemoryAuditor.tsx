/**
 * MEMORY AUDITOR - DEVELOPMENT DEBUGGING TOOL
 *
 * React component for real-time memory leak monitoring and debugging.
 * Provides visual dashboard for memory usage, leak detection, and
 * circular dependency analysis in development mode.
 *
 * @author STR Certified Engineering Team
 * @version 1.0 - Production Ready
 */

import React, { useState, useEffect } from "react";
import {
  memoryLeakDetector,
  MemoryStats,
  MemoryLeak,
} from "./MemoryLeakDetector";
import {
  circularDependencyDetector,
  CircularDependencyReport,
} from "./CircularDependencyDetector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Activity, Zap, Clock, RefreshCw } from "lucide-react";

interface MemoryAuditorProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

export const MemoryAuditor: React.FC<MemoryAuditorProps> = ({
  isVisible = false,
  onToggle,
}) => {
  const [memoryStats, setMemoryStats] = useState<MemoryStats>({
    currentUsage: 0,
    peakUsage: 0,
    averageUsage: 0,
    growthRate: 0,
    leaksDetected: [],
    totalSnapshots: 0,
    monitoringDuration: 0,
  });

  const [circularReport, setCircularReport] =
    useState<CircularDependencyReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Update memory stats periodically
  useEffect(() => {
    if (!isVisible) return;

    const updateStats = () => {
      setMemoryStats(memoryLeakDetector.getMemoryStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Run circular dependency analysis
  const runCircularAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const report = await circularDependencyDetector.analyzeDependencies();
      setCircularReport(report);
    } catch (error) {
      console.error("Circular dependency analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Emergency cleanup
  const handleEmergencyCleanup = () => {
    memoryLeakDetector.emergencyCleanup();
    setMemoryStats(memoryLeakDetector.getMemoryStats());
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Open Memory Auditor"
      >
        <Activity className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-4 z-50 bg-white border border-gray-300 rounded-lg shadow-2xl flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-bold text-gray-800">Memory Auditor</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEmergencyCleanup}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Emergency Cleanup
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            ×
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="overview" className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leaks">
              Memory Leaks
              {memoryStats.leaksDetected.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {memoryStats.leaksDetected.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="circular">
              Circular Deps
              {circularReport &&
                circularReport.totalCircularDependencies > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {circularReport.totalCircularDependencies}
                  </Badge>
                )}
            </TabsTrigger>
            <TabsTrigger value="detailed">Detailed</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Current Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {memoryStats.currentUsage.toFixed(1)} MB
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Peak Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {memoryStats.peakUsage.toFixed(1)} MB
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Growth Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      memoryStats.growthRate > 10
                        ? "text-red-600"
                        : memoryStats.growthRate > 5
                          ? "text-orange-600"
                          : "text-green-600"
                    }`}
                  >
                    {memoryStats.growthRate > 0 ? "+" : ""}
                    {memoryStats.growthRate.toFixed(1)} MB/min
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Monitoring Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-600">
                    <Clock className="w-5 h-5 inline mr-1" />
                    {Math.round(memoryStats.monitoringDuration)} min
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Memory Usage Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Memory Usage Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      Current: {memoryStats.currentUsage.toFixed(1)} MB
                    </span>
                    <span>Peak: {memoryStats.peakUsage.toFixed(1)} MB</span>
                  </div>
                  <Progress
                    value={
                      (memoryStats.currentUsage /
                        Math.max(memoryStats.peakUsage, 100)) *
                      100
                    }
                    className="w-full"
                  />
                </div>

                {memoryStats.growthRate > 5 && (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 text-orange-600 mr-2" />
                      <span className="text-sm text-orange-800">
                        High memory growth rate detected. Consider reviewing
                        recent changes.
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Memory Leaks Tab */}
          <TabsContent value="leaks" className="space-y-4">
            {memoryStats.leaksDetected.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-green-600">
                    <Zap className="w-12 h-12 mx-auto mb-2" />
                    <h3 className="text-lg font-medium">
                      No Memory Leaks Detected
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Your application appears to be managing memory well!
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {memoryStats.leaksDetected.map((leak) => (
                  <MemoryLeakCard key={leak.id} leak={leak} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Circular Dependencies Tab */}
          <TabsContent value="circular" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                Circular Dependency Analysis
              </h3>
              <Button
                onClick={runCircularAnalysis}
                disabled={isAnalyzing}
                size="sm"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Run Analysis"
                )}
              </Button>
            </div>

            {circularReport ? (
              <CircularDependencyReport report={circularReport} />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-2" />
                    <h3 className="text-lg font-medium">Analysis Not Run</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Click "Run Analysis" to check for circular dependencies
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Detailed Tab */}
          <TabsContent value="detailed" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Memory Snapshots</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {memoryStats.totalSnapshots}
                  </div>
                  <p className="text-sm text-gray-600">
                    Snapshots taken over{" "}
                    {Math.round(memoryStats.monitoringDuration)} minutes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Average Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {memoryStats.averageUsage.toFixed(1)} MB
                  </div>
                  <p className="text-sm text-gray-600">
                    Average memory consumption
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Development Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Development Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (window.gc) {
                        window.gc();
                        setMemoryStats(memoryLeakDetector.getMemoryStats());
                      } else {
                        alert(
                          'Garbage collection not available. Run Chrome with --js-flags="--expose-gc"',
                        );
                      }
                    }}
                  >
                    Force Garbage Collection
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const report = memoryLeakDetector.getMemoryStats();
                      console.log("Memory Report:", report);
                      alert("Memory report logged to console");
                    }}
                  >
                    Log Memory Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Memory Leak Card Component
const MemoryLeakCard: React.FC<{ leak: MemoryLeak }> = ({ leak }) => {
  const getSeverityColor = (severity: MemoryLeak["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 border-red-200 text-red-800";
      case "high":
        return "bg-orange-100 border-orange-200 text-orange-800";
      case "medium":
        return "bg-yellow-100 border-yellow-200 text-yellow-800";
      case "low":
        return "bg-blue-100 border-blue-200 text-blue-800";
    }
  };

  return (
    <Card className={`border-l-4 ${getSeverityColor(leak.severity)}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">
            {leak.type.replace("-", " ").toUpperCase()} Leak
          </CardTitle>
          <Badge variant="outline" className={getSeverityColor(leak.severity)}>
            {leak.severity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 mb-3">{leak.description}</p>

        {leak.suggestions.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-1">
              Suggestions:
            </h4>
            <ul className="text-xs text-gray-600 space-y-1">
              {leak.suggestions.slice(0, 2).map((suggestion, index) => (
                <li key={index}>• {suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-xs text-gray-500 mt-2">
          Detected: {new Date(leak.detectedAt).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
};

// Circular Dependency Report Component
const CircularDependencyReport: React.FC<{
  report: CircularDependencyReport;
}> = ({ report }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report.totalCircularDependencies}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {report.criticalCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">High</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {report.highCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Medium/Low</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {report.mediumCount + report.lowCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {report.dependencies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Detected Circular Dependencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {report.dependencies.slice(0, 10).map((dependency) => (
                <div
                  key={dependency.id}
                  className="p-2 bg-gray-50 rounded border-l-4 border-gray-300"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {dependency.type.toUpperCase()}
                    </span>
                    <Badge variant="outline">{dependency.severity}</Badge>
                  </div>
                  <div className="text-xs text-gray-600">
                    {dependency.cycle.join(" → ")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {report.recommendedActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              {report.recommendedActions.slice(0, 5).map((action, index) => (
                <li key={index} className="text-gray-700">
                  {action}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
