// Report Generator Component - UI for generating and downloading reports
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  Download,
  FileText,
  Eye,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  reportService,
  type ReportOptions,
  type ReportTemplate,
} from "@/services/reportService";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

interface ReportGeneratorProps {
  inspectionId: string;
  propertyName: string;
  onReportGenerated?: (reportId: string) => void;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  inspectionId,
  propertyName,
  onReportGenerated,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<Blob | null>(null);
  const [reportOptions, setReportOptions] = useState<ReportOptions>({
    includePhotos: true,
    includeAuditTrail: true,
    includeSummary: true,
    includeListingOptimization: true,
    format: "pdf",
    branding: true,
    photoQuality: "medium",
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>("standard");
  const { toast } = useToast();

  const templates = reportService.getReportTemplates();

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      logger.info(
        "Starting report generation",
        { inspectionId, options: reportOptions },
        "REPORT_GENERATOR",
      );

      const result = await reportService.generateInspectionReport(
        inspectionId,
        reportOptions,
      );

      if (result.success && result.data) {
        setGeneratedReport(result.data);
        toast({
          title: "Report Generated Successfully",
          description: "Your inspection report is ready for download.",
          duration: 5000,
        });

        // Auto-download the report
        await handleDownloadReport(result.data);

        if (onReportGenerated) {
          onReportGenerated(`RPT-${inspectionId.slice(-8)}-${Date.now()}`);
        }
      } else {
        throw new Error(result.error || "Failed to generate report");
      }
    } catch (error) {
      logger.error("Report generation failed", error, "REPORT_GENERATOR");
      toast({
        title: "Report Generation Failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = async (reportBlob?: Blob) => {
    try {
      const blob = reportBlob || generatedReport;
      if (!blob) return;

      const fileName = `${propertyName.replace(/[^a-zA-Z0-9]/g, "_")}_Inspection_Report_${new Date().toISOString().split("T")[0]}.pdf`;
      await reportService.downloadReport(blob, fileName);

      toast({
        title: "Report Downloaded",
        description: `Report saved as ${fileName}`,
        duration: 3000,
      });
    } catch (error) {
      logger.error("Report download failed", error, "REPORT_GENERATOR");
      toast({
        title: "Download Failed",
        description: "Failed to download the report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateReportOption = (key: keyof ReportOptions, value: any) => {
    setReportOptions((prev) => ({ ...prev, [key]: value }));
  };

  const selectedTemplateData = templates.find((t) => t.id === selectedTemplate);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Generate Inspection Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Report Template</label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-gray-500">
                      {template.description}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedTemplateData && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 mb-2">Included sections:</p>
              <div className="flex flex-wrap gap-1">
                {selectedTemplateData.sections.map((section) => (
                  <Badge
                    key={section.id}
                    variant="secondary"
                    className="text-xs"
                  >
                    {section.title}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Report Options */}
        <div className="space-y-4">
          <h4 className="font-medium">Report Options</h4>

          {/* Content Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeSummary"
                checked={reportOptions.includeSummary}
                onCheckedChange={(checked) =>
                  updateReportOption("includeSummary", checked)
                }
              />
              <label htmlFor="includeSummary" className="text-sm font-medium">
                Include Executive Summary
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includePhotos"
                checked={reportOptions.includePhotos}
                onCheckedChange={(checked) =>
                  updateReportOption("includePhotos", checked)
                }
              />
              <label htmlFor="includePhotos" className="text-sm font-medium">
                Include Photo Analysis
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeAuditTrail"
                checked={reportOptions.includeAuditTrail}
                onCheckedChange={(checked) =>
                  updateReportOption("includeAuditTrail", checked)
                }
              />
              <label
                htmlFor="includeAuditTrail"
                className="text-sm font-medium"
              >
                Include Audit Trail
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeListingOptimization"
                checked={reportOptions.includeListingOptimization}
                onCheckedChange={(checked) =>
                  updateReportOption("includeListingOptimization", checked)
                }
              />
              <label
                htmlFor="includeListingOptimization"
                className="text-sm font-medium"
              >
                Include Listing Optimization Suggestions
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="branding"
                checked={reportOptions.branding}
                onCheckedChange={(checked) =>
                  updateReportOption("branding", checked)
                }
              />
              <label htmlFor="branding" className="text-sm font-medium">
                Include STR Certified Branding
              </label>
            </div>
          </div>

          {/* Format Options */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Format</label>
            <Select
              value={reportOptions.format}
              onValueChange={(value) => updateReportOption("format", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Photo Quality */}
          {reportOptions.includePhotos && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Photo Quality</label>
              <Select
                value={reportOptions.photoQuality}
                onValueChange={(value) =>
                  updateReportOption("photoQuality", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High (Larger file size)</SelectItem>
                  <SelectItem value="medium">Medium (Balanced)</SelectItem>
                  <SelectItem value="low">Low (Smaller file size)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Generation Status */}
        {isGenerating && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <LoadingSpinner className="w-4 h-4" />
            <span className="text-sm text-blue-700">
              Generating report... This may take a few moments.
            </span>
          </div>
        )}

        {generatedReport && !isGenerating && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">
              Report generated successfully!
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>

          {generatedReport && (
            <Button
              variant="outline"
              onClick={() => handleDownloadReport()}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Again
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 border-t pt-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p>
                Reports include all inspection data, AI analysis results, and
                audit information.
              </p>
              <p className="mt-1">
                PDF format recommended for sharing with property managers.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportGenerator;
