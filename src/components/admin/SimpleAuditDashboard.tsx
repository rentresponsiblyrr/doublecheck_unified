/**
 * Simple Audit Dashboard - Production Ready
 * Allows reviewers to see and process completed inspections
 */

import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Search,
  Filter,
  Download,
  Eye,
  Clock
} from "lucide-react";

interface Inspection {
  id: string;
  status: string;
  created_at: string;
  completed_at?: string;
  properties: {
    name: string;
    address: string;
  };
  users: {
    name: string;
    email: string;
  };
  checklist_items: Array<{
    id: string;
    label: string;
    status: string;
    notes?: string;
    ai_status?: string;
    media?: Array<{
      url: string;
      type: string;
    }>;
  }>;
}

export const SimpleAuditDashboard: React.FC = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed">("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInspection, setSelectedInspection] = useState<string | null>(null);

  useEffect(() => {
    loadInspections();
  }, [filter]);

  const loadInspections = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("inspections")
        .select(`
          *,
          properties!inner (name, address),
          users!inspector_id (name, email),
          checklist_items (
            *,
            media (*)
          )
        `)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (filter === "pending") {
        query = query.is("reviewed_at", null);
      } else if (filter === "reviewed") {
        query = query.not("reviewed_at", "is", null);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Failed to load inspections:", error);
        return;
      }

      setInspections(data || []);
    } catch (error) {
      console.error("Error loading inspections:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsReviewed = async (inspectionId: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("inspections")
        .update({
          certification_status: status,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", inspectionId);

      if (error) {
        console.error("Failed to update inspection:", error);
        return;
      }

      // Reload inspections
      loadInspections();
    } catch (error) {
      console.error("Error updating inspection:", error);
    }
  };

  const exportReport = (inspection: Inspection) => {
    // Simple CSV export
    const csv = [
      ["Property", inspection.properties.name],
      ["Address", inspection.properties.address],
      ["Inspector", inspection.users.name],
      ["Date", new Date(inspection.created_at).toLocaleDateString()],
      [""],
      ["Item", "Status", "Notes", "AI Status"],
      ...inspection.checklist_items.map(item => [
        item.label,
        item.status || "pending",
        item.notes || "",
        item.ai_status || ""
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inspection-${inspection.properties.name}-${new Date().toISOString()}.csv`;
    a.click();
  };

  const filteredInspections = inspections.filter(i => 
    searchTerm === "" || 
    i.properties.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.properties.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusCounts = (items: any[]) => {
    const counts = { passed: 0, failed: 0, na: 0, pending: 0 };
    items.forEach(item => {
      if (item.status === "completed") counts.passed++;
      else if (item.status === "failed") counts.failed++;
      else if (item.status === "not_applicable") counts.na++;
      else counts.pending++;
    });
    return counts;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Inspection Audit Dashboard</CardTitle>
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === "pending" ? "default" : "outline"}
                onClick={() => setFilter("pending")}
              >
                Pending Review
              </Button>
              <Button
                variant={filter === "reviewed" ? "default" : "outline"}
                onClick={() => setFilter("reviewed")}
              >
                Reviewed
              </Button>
              <Button
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => setFilter("all")}
              >
                All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredInspections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No inspections found
              </div>
            ) : (
              filteredInspections.map((inspection) => {
                const counts = getStatusCounts(inspection.checklist_items);
                const isExpanded = selectedInspection === inspection.id;
                
                return (
                  <Card key={inspection.id} className="overflow-hidden">
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedInspection(
                        isExpanded ? null : inspection.id
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {inspection.properties.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {inspection.properties.address}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>Inspector: {inspection.users.name}</span>
                            <span>•</span>
                            <span>
                              <Clock className="inline h-3 w-3 mr-1" />
                              {new Date(inspection.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex gap-2">
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              ✓ {counts.passed}
                            </Badge>
                            <Badge variant="default" className="bg-red-100 text-red-800">
                              ✗ {counts.failed}
                            </Badge>
                            <Badge variant="default" className="bg-gray-100 text-gray-800">
                              N/A {counts.na}
                            </Badge>
                            {counts.pending > 0 && (
                              <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                                ? {counts.pending}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                exportReport(inspection);
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {!inspection.reviewed_at && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsReviewed(inspection.id, "approved");
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsReviewed(inspection.id, "rejected");
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {inspection.certification_status && (
                              <Badge 
                                variant={
                                  inspection.certification_status === "approved" 
                                    ? "default" 
                                    : "destructive"
                                }
                              >
                                {inspection.certification_status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="border-t p-4 bg-gray-50">
                        <h4 className="font-semibold mb-3">Checklist Items</h4>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {inspection.checklist_items.map((item) => (
                            <div 
                              key={item.id}
                              className="flex items-start gap-3 p-2 bg-white rounded"
                            >
                              <div className="mt-1">
                                {item.status === "completed" && (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                )}
                                {item.status === "failed" && (
                                  <XCircle className="h-5 w-5 text-red-600" />
                                )}
                                {item.status === "not_applicable" && (
                                  <AlertCircle className="h-5 w-5 text-gray-400" />
                                )}
                                {!item.status && (
                                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{item.label}</p>
                                {item.notes && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    Notes: {item.notes}
                                  </p>
                                )}
                                {item.ai_status && (
                                  <Badge 
                                    variant="outline" 
                                    className="mt-1 text-xs"
                                  >
                                    AI: {item.ai_status}
                                  </Badge>
                                )}
                              </div>
                              {item.media && item.media.length > 0 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.open(item.media[0].url, "_blank")}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};