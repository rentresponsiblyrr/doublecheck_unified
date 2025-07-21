/**
 * Compliance Reporting Panel Component
 * Generates and manages compliance reports for various standards
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, BarChart3, TrendingUp, Settings } from 'lucide-react';

interface ComplianceReport {
  id: string;
  standard: 'soc2' | 'gdpr' | 'hipaa' | 'pci-dss';
  reportType: 'audit' | 'assessment' | 'gap-analysis' | 'remediation';
  status: 'draft' | 'in-progress' | 'completed' | 'approved';
  createdAt: string;
  completedAt?: string;
  score: number;
  findings: {
    passed: number;
    failed: number;
    warnings: number;
  };
  downloadUrl?: string;
}

interface ComplianceReportingPanelProps {
  reports: ComplianceReport[];
  onGenerateReport: (standard: string, type: string) => void;
  onDownloadReport: (reportId: string) => void;
  isGenerating?: boolean;
}

export const ComplianceReportingPanel: React.FC<ComplianceReportingPanelProps> = ({
  reports,
  onGenerateReport,
  onDownloadReport,
  isGenerating = false
}) => {
  const [selectedStandard, setSelectedStandard] = useState<string>('soc2');

  const getStatusBadge = (status: ComplianceReport['status']) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'approved':
        return 'default';
      case 'in-progress':
        return 'secondary';
      case 'draft':
        return 'outline';
    }
  };

  const getStandardName = (standard: string) => {
    switch (standard) {
      case 'soc2':
        return 'SOC 2 Type II';
      case 'gdpr':
        return 'GDPR';
      case 'hipaa':
        return 'HIPAA';
      case 'pci-dss':
        return 'PCI DSS';
      default:
        return standard.toUpperCase();
    }
  };

  const filteredReports = reports.filter(report => report.standard === selectedStandard);

  const reportTypes = [
    { value: 'audit', label: 'Full Audit Report' },
    { value: 'assessment', label: 'Risk Assessment' },
    { value: 'gap-analysis', label: 'Gap Analysis' },
    { value: 'remediation', label: 'Remediation Plan' }
  ];

  return (
    <div className="space-y-6">
      {/* Generate Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Compliance Report Generation
          </CardTitle>
          <CardDescription>
            Generate comprehensive compliance reports for audit and regulatory requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedStandard} onValueChange={setSelectedStandard}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="soc2">SOC 2</TabsTrigger>
              <TabsTrigger value="gdpr">GDPR</TabsTrigger>
              <TabsTrigger value="hipaa">HIPAA</TabsTrigger>
              <TabsTrigger value="pci-dss">PCI DSS</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedStandard} className="mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                {reportTypes.map((type) => (
                  <Card key={type.value} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{type.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => onGenerateReport(selectedStandard, type.value)}
                        disabled={isGenerating}
                        className="w-full"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Reports ({filteredReports.length})</CardTitle>
              <CardDescription>
                {getStandardName(selectedStandard)} compliance reports and assessments
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No reports generated yet</p>
              <p className="text-sm">Generate your first {getStandardName(selectedStandard)} report above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div key={report.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">
                          {getStandardName(report.standard)} {report.reportType.replace('-', ' ')}
                        </h4>
                        <Badge variant={getStatusBadge(report.status)}>
                          {report.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Score:</span>
                          <span className="ml-2 font-medium">{report.score}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Passed:</span>
                          <span className="ml-2 text-green-600">{report.findings.passed}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Failed:</span>
                          <span className="ml-2 text-red-600">{report.findings.failed}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Created: {new Date(report.createdAt).toLocaleDateString()}</span>
                        {report.completedAt && (
                          <span>Completed: {new Date(report.completedAt).toLocaleDateString()}</span>
                        )}
                        <span>Warnings: {report.findings.warnings}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {report.status === 'completed' && report.downloadUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDownloadReport(report.id)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};