/**
 * Active Inspection Panel Component
 * Extracted from ProductionInspectionWorkflow.tsx
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Building,
  MapPin,
  Calendar,
  FileText,
  CheckCircle,
  Camera,
  Video,
  RefreshCw,
} from "lucide-react";
import {
  ProductionProperty,
  ProductionSafetyItem,
} from "@/services/productionDatabaseService";

interface ActiveInspectionPanelProps {
  selectedProperty: ProductionProperty;
  inspectionId: string;
  checklistItems: ProductionSafetyItem[];
  completedItems: string[];
  completionPercentage: number;
  loading: boolean;
  onItemCompletion: (itemId: string, completed: boolean) => void;
  onSubmitInspection: () => void;
}

export const ActiveInspectionPanel: React.FC<ActiveInspectionPanelProps> = ({
  selectedProperty,
  inspectionId,
  checklistItems,
  completedItems,
  completionPercentage,
  loading,
  onItemCompletion,
  onSubmitInspection,
}) => {
  const getEvidenceIcon = (evidenceType: string) => {
    switch (evidenceType) {
      case "photo":
        return Camera;
      case "video":
        return Video;
      case "documentation":
        return FileText;
      default:
        return CheckCircle;
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Property Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="w-5 h-5 mr-2" />
            Inspecting: {selectedProperty.property_name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-gray-600" />
              <span>{selectedProperty.property_address}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-gray-600" />
              <span>Started: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-2 text-gray-600" />
              <span>ID: {inspectionId.substring(0, 8)}...</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Checklist Progress</span>
              <span className="text-sm text-gray-600">
                {completedItems.length} of {checklistItems.length} completed
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Checklist Items */}
      <Card>
        <CardHeader>
          <CardTitle>Inspection Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {checklistItems.map((item) => {
              const isCompleted = completedItems.includes(item.id);
              const EvidenceIcon = getEvidenceIcon(item.evidence_type);

              return (
                <div
                  key={item.id}
                  className={`p-4 border rounded-lg ${
                    isCompleted
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <EvidenceIcon className="w-5 h-5 text-gray-600" />
                        <h4 className="font-medium">{item.label}</h4>
                        <Badge className="bg-blue-100 text-blue-800">
                          {item.category}
                        </Badge>
                        {item.required && (
                          <Badge className="bg-red-100 text-red-800">
                            Required
                          </Badge>
                        )}
                      </div>

                      {item.notes && (
                        <p className="text-gray-600 text-sm mb-2">
                          {item.notes}
                        </p>
                      )}

                      <div className="text-xs text-gray-500">
                        Evidence Required: {item.evidence_type}
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      {!isCompleted ? (
                        <Button
                          size="sm"
                          onClick={() => onItemCompletion(item.id, true)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onItemCompletion(item.id, false)}
                          className="text-green-600"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Completed
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {checklistItems.length > 0 && (
            <div className="mt-6 flex justify-end">
              <Button
                onClick={onSubmitInspection}
                disabled={completedItems.length === 0 || loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Submit Inspection
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
