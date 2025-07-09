// Report Service - PDF generation and report management
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { auditorService } from './auditorService';
import { amenityComparisonEngine } from './amenityComparisonEngine';
import type { InspectionForReview } from './auditorService';
import type { ScrapedPropertyData } from '@/lib/scrapers/types';

// Report types and interfaces
export interface ReportData {
  inspection: InspectionForReview;
  generatedAt: string;
  reportId: string;
  version: string;
}

export interface ReportOptions {
  includePhotos?: boolean;
  includeAuditTrail?: boolean;
  includeSummary?: boolean;
  includeListingOptimization?: boolean;
  format?: 'pdf' | 'html';
  branding?: boolean;
  photoQuality?: 'high' | 'medium' | 'low';
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'summary' | 'photos' | 'audit' | 'checklist' | 'optimization' | 'header' | 'footer';
  content?: string;
  options?: Record<string, unknown>;
}

export interface PhotoComparisonData {
  referencePhoto: string;
  inspectionPhoto: string;
  aiAnalysis: {
    score: number;
    confidence: number;
    reasoning: string;
    issues: string[];
  };
  auditorFeedback?: string;
}

export interface AuditTrailEntry {
  timestamp: string;
  action: string;
  user: string;
  details: string;
  aiStatus?: string;
  auditorOverride?: boolean;
}

export class ReportService {
  private readonly REPORT_VERSION = '1.0.0';
  private readonly COMPANY_NAME = 'STR Certified';
  private readonly COMPANY_SUBTITLE = 'Powered by Rent Responsibly';

  /**
   * Generate comprehensive inspection report
   */
  async generateInspectionReport(
    inspectionId: string,
    options: ReportOptions = {}
  ): Promise<{ success: boolean; data?: Blob; error?: string }> {
    try {
      logger.info('Starting inspection report generation', { inspectionId, options }, 'REPORT_SERVICE');

      // Set default options
      const reportOptions: ReportOptions = {
        includePhotos: true,
        includeAuditTrail: true,
        includeSummary: true,
        includeListingOptimization: true,
        format: 'pdf',
        branding: true,
        photoQuality: 'medium',
        ...options
      };

      // Fetch inspection data
      const inspectionResult = await auditorService.getInspectionForReview(inspectionId);
      if (!inspectionResult.success || !inspectionResult.data) {
        throw new Error('Failed to fetch inspection data');
      }

      const inspection = inspectionResult.data;
      const reportData: ReportData = {
        inspection,
        generatedAt: new Date().toISOString(),
        reportId: `RPT-${inspectionId.slice(-8)}-${Date.now()}`,
        version: this.REPORT_VERSION
      };

      // Generate report based on format
      if (reportOptions.format === 'pdf') {
        const pdfBlob = await this.generatePDFReport(reportData, reportOptions);
        
        // Store report metadata
        await this.storeReportMetadata(reportData, reportOptions);
        
        return { success: true, data: pdfBlob };
      } else {
        const htmlContent = await this.generateHTMLReport(reportData, reportOptions);
        const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
        
        return { success: true, data: htmlBlob };
      }
    } catch (error) {
      logger.error('Failed to generate inspection report', error, 'REPORT_SERVICE');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Generate PDF report using jsPDF
   */
  private async generatePDFReport(reportData: ReportData, options: ReportOptions): Promise<Blob> {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Add header
    if (options.branding) {
      yPosition = this.addReportHeader(pdf, yPosition, reportData, pageWidth, margin);
    }

    // Add summary section
    if (options.includeSummary) {
      yPosition = await this.addSummarySection(pdf, yPosition, reportData, pageWidth, margin);
    }

    // Add property information
    yPosition = this.addPropertySection(pdf, yPosition, reportData, pageWidth, margin);

    // Add inspection details
    yPosition = await this.addInspectionDetailsSection(pdf, yPosition, reportData, pageWidth, margin, options);

    // Add checklist results
    yPosition = await this.addChecklistSection(pdf, yPosition, reportData, pageWidth, margin, pageHeight, options);

    // Add listing optimization suggestions
    if (options.includeListingOptimization) {
      yPosition = await this.addListingOptimizationSection(pdf, yPosition, reportData, pageWidth, margin, pageHeight);
    }

    // Add audit trail
    if (options.includeAuditTrail) {
      yPosition = await this.addAuditTrailSection(pdf, yPosition, reportData, pageWidth, margin, pageHeight);
    }

    // Add footer
    if (options.branding) {
      this.addReportFooter(pdf, reportData, pageWidth, pageHeight, margin);
    }

    return pdf.output('blob');
  }

  /**
   * Add report header with branding
   */
  private addReportHeader(pdf: jsPDF, yPosition: number, reportData: ReportData, pageWidth: number, margin: number): number {
    // Company name
    pdf.setFontSize(24);
    pdf.setTextColor(37, 99, 235); // Blue color
    pdf.text(this.COMPANY_NAME, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Subtitle
    pdf.setFontSize(12);
    pdf.setTextColor(107, 114, 128); // Gray color
    pdf.text(this.COMPANY_SUBTITLE, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Report title
    pdf.setFontSize(18);
    pdf.setTextColor(17, 24, 39); // Dark color
    pdf.text('Property Inspection Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Report metadata
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128);
    pdf.text(`Report ID: ${reportData.reportId}`, margin, yPosition);
    pdf.text(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`, pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 20;

    // Add horizontal line
    pdf.setDrawColor(229, 231, 235);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    return yPosition;
  }

  /**
   * Add summary section
   */
  private async addSummarySection(pdf: jsPDF, yPosition: number, reportData: ReportData, pageWidth: number, margin: number): Promise<number> {
    const inspection = reportData.inspection;
    const summary = inspection.ai_analysis_summary;

    // Section title
    pdf.setFontSize(14);
    pdf.setTextColor(17, 24, 39);
    pdf.text('Executive Summary', margin, yPosition);
    yPosition += 15;

    if (summary) {
      // Overall score
      pdf.setFontSize(12);
      pdf.setTextColor(37, 99, 235);
      pdf.text(`Overall Score: ${summary.overall_score}%`, margin, yPosition);
      yPosition += 10;

      // Statistics
      pdf.setFontSize(10);
      pdf.setTextColor(75, 85, 99);
      pdf.text(`Total Items: ${summary.total_items}`, margin, yPosition);
      pdf.text(`Completed: ${summary.completed_items}`, margin + 60, yPosition);
      pdf.text(`Photos: ${summary.photo_count}`, margin + 120, yPosition);
      pdf.text(`Issues: ${summary.issues_count}`, margin + 180, yPosition);
      yPosition += 15;

      // Confidence rating
      pdf.text(`Average AI Confidence: ${summary.confidence_average}%`, margin, yPosition);
      yPosition += 15;
    }

    return yPosition;
  }

  /**
   * Add property section
   */
  private addPropertySection(pdf: jsPDF, yPosition: number, reportData: ReportData, pageWidth: number, margin: number): number {
    const property = reportData.inspection.properties;
    const inspection = reportData.inspection;

    // Section title
    pdf.setFontSize(14);
    pdf.setTextColor(17, 24, 39);
    pdf.text('Property Information', margin, yPosition);
    yPosition += 15;

    // Property details
    pdf.setFontSize(10);
    pdf.setTextColor(75, 85, 99);
    pdf.text(`Property Name: ${property.name}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Address: ${property.address}`, margin, yPosition);
    yPosition += 8;
    
    if (property.vrbo_url) {
      pdf.text(`VRBO URL: ${property.vrbo_url}`, margin, yPosition);
      yPosition += 8;
    }
    
    if (property.airbnb_url) {
      pdf.text(`Airbnb URL: ${property.airbnb_url}`, margin, yPosition);
      yPosition += 8;
    }

    // Inspection details
    pdf.text(`Inspector: ${inspection.users.name} (${inspection.users.email})`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Inspection Date: ${new Date(inspection.start_time).toLocaleDateString()}`, margin, yPosition);
    yPosition += 8;
    
    if (inspection.end_time) {
      const duration = Math.round((new Date(inspection.end_time).getTime() - new Date(inspection.start_time).getTime()) / (1000 * 60));
      pdf.text(`Duration: ${duration} minutes`, margin, yPosition);
      yPosition += 8;
    }

    pdf.text(`Status: ${inspection.status}`, margin, yPosition);
    yPosition += 20;

    return yPosition;
  }

  /**
   * Add inspection details section
   */
  private async addInspectionDetailsSection(
    pdf: jsPDF,
    yPosition: number,
    reportData: ReportData,
    pageWidth: number,
    margin: number,
    options: ReportOptions
  ): Promise<number> {
    // Section title
    pdf.setFontSize(14);
    pdf.setTextColor(17, 24, 39);
    pdf.text('Inspection Details', margin, yPosition);
    yPosition += 15;

    // Checklist summary by category
    const items = reportData.inspection.checklist_items;
    const categories = ['safety', 'amenity', 'cleanliness', 'maintenance'];
    
    pdf.setFontSize(12);
    pdf.setTextColor(75, 85, 99);
    pdf.text('Results by Category:', margin, yPosition);
    yPosition += 10;

    categories.forEach(category => {
      const categoryItems = items.filter(item => item.category === category);
      const completed = categoryItems.filter(item => item.status === 'completed').length;
      const passed = categoryItems.filter(item => item.ai_status === 'pass').length;
      const failed = categoryItems.filter(item => item.ai_status === 'fail').length;

      pdf.setFontSize(10);
      pdf.text(`${category.charAt(0).toUpperCase() + category.slice(1)}:`, margin, yPosition);
      pdf.text(`${completed}/${categoryItems.length} completed`, margin + 60, yPosition);
      pdf.text(`${passed} passed`, margin + 120, yPosition);
      pdf.text(`${failed} failed`, margin + 160, yPosition);
      yPosition += 8;
    });

    yPosition += 10;
    return yPosition;
  }

  /**
   * Add checklist section with detailed results
   */
  private async addChecklistSection(
    pdf: jsPDF,
    yPosition: number,
    reportData: ReportData,
    pageWidth: number,
    margin: number,
    pageHeight: number,
    options: ReportOptions
  ): Promise<number> {
    const items = reportData.inspection.checklist_items;

    // Section title
    pdf.setFontSize(14);
    pdf.setTextColor(17, 24, 39);
    pdf.text('Detailed Checklist Results', margin, yPosition);
    yPosition += 15;

    for (const item of items) {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = margin;
      }

      // Item title
      pdf.setFontSize(11);
      pdf.setTextColor(17, 24, 39);
      pdf.text(item.title, margin, yPosition);
      yPosition += 8;

      // Status and AI analysis
      pdf.setFontSize(9);
      pdf.setTextColor(75, 85, 99);
      pdf.text(`Status: ${item.status}`, margin, yPosition);
      pdf.text(`AI Status: ${item.ai_status}`, margin + 70, yPosition);
      pdf.text(`Confidence: ${item.ai_confidence}%`, margin + 140, yPosition);
      yPosition += 8;

      // AI reasoning
      if (item.ai_reasoning) {
        pdf.setFontSize(9);
        pdf.setTextColor(107, 114, 128);
        const reasoningLines = pdf.splitTextToSize(item.ai_reasoning, pageWidth - 2 * margin);
        pdf.text(reasoningLines, margin, yPosition);
        yPosition += reasoningLines.length * 5;
      }

      // Notes
      if (item.notes) {
        pdf.setFontSize(9);
        pdf.setTextColor(107, 114, 128);
        pdf.text('Notes:', margin, yPosition);
        yPosition += 6;
        const notesLines = pdf.splitTextToSize(item.notes, pageWidth - 2 * margin);
        pdf.text(notesLines, margin, yPosition);
        yPosition += notesLines.length * 5;
      }

      // Photo count
      if (item.media_files && item.media_files.length > 0) {
        pdf.setFontSize(9);
        pdf.setTextColor(107, 114, 128);
        const photoCount = item.media_files.filter(m => m.type === 'photo').length;
        const videoCount = item.media_files.filter(m => m.type === 'video').length;
        pdf.text(`Media: ${photoCount} photos, ${videoCount} videos`, margin, yPosition);
        yPosition += 8;
      }

      yPosition += 5; // Space between items
    }

    return yPosition;
  }

  /**
   * Add audit trail section
   */
  private async addAuditTrailSection(
    pdf: jsPDF,
    yPosition: number,
    reportData: ReportData,
    pageWidth: number,
    margin: number,
    pageHeight: number
  ): Promise<number> {
    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      pdf.addPage();
      yPosition = margin;
    }

    // Section title
    pdf.setFontSize(14);
    pdf.setTextColor(17, 24, 39);
    pdf.text('Audit Trail', margin, yPosition);
    yPosition += 15;

    // Create audit trail entries
    const auditEntries: AuditTrailEntry[] = [];
    
    // Add inspection creation
    auditEntries.push({
      timestamp: reportData.inspection.created_at,
      action: 'Inspection Created',
      user: reportData.inspection.users.name,
      details: 'Initial inspection created'
    });

    // Add checklist item completions
    reportData.inspection.checklist_items.forEach(item => {
      if (item.status === 'completed') {
        auditEntries.push({
          timestamp: item.created_at,
          action: 'Item Completed',
          user: reportData.inspection.users.name,
          details: `Completed: ${item.title}`,
          aiStatus: item.ai_status,
          auditorOverride: item.user_override
        });
      }
    });

    // Sort by timestamp
    auditEntries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Render audit entries
    auditEntries.forEach(entry => {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(10);
      pdf.setTextColor(75, 85, 99);
      pdf.text(new Date(entry.timestamp).toLocaleString(), margin, yPosition);
      pdf.text(entry.action, margin + 80, yPosition);
      pdf.text(entry.user, margin + 140, yPosition);
      yPosition += 6;

      pdf.setFontSize(9);
      pdf.setTextColor(107, 114, 128);
      pdf.text(entry.details, margin + 10, yPosition);
      yPosition += 8;
    });

    return yPosition;
  }

  /**
   * Add report footer
   */
  private addReportFooter(pdf: jsPDF, reportData: ReportData, pageWidth: number, pageHeight: number, margin: number): void {
    pdf.setFontSize(8);
    pdf.setTextColor(107, 114, 128);
    pdf.text(
      `Generated by ${this.COMPANY_NAME} - Report ${reportData.reportId}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  /**
   * Generate HTML report (for preview or alternative format)
   */
  private async generateHTMLReport(reportData: ReportData, options: ReportOptions): Promise<string> {
    const inspection = reportData.inspection;
    const summary = inspection.ai_analysis_summary;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inspection Report - ${inspection.properties.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-name { color: #2563eb; font-size: 24px; font-weight: bold; }
          .subtitle { color: #6b7280; font-size: 12px; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 16px; font-weight: bold; color: #111827; margin-bottom: 10px; }
          .property-info { background: #f9fafb; padding: 15px; border-radius: 8px; }
          .checklist-item { border: 1px solid #e5e7eb; padding: 10px; margin-bottom: 10px; border-radius: 6px; }
          .status-pass { color: #059669; }
          .status-fail { color: #dc2626; }
          .status-review { color: #d97706; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${this.COMPANY_NAME}</div>
          <div class="subtitle">${this.COMPANY_SUBTITLE}</div>
          <h1>Property Inspection Report</h1>
          <p>Report ID: ${reportData.reportId} | Generated: ${new Date(reportData.generatedAt).toLocaleString()}</p>
        </div>

        <div class="section">
          <div class="section-title">Executive Summary</div>
          ${summary ? `
            <p><strong>Overall Score:</strong> ${summary.overall_score}%</p>
            <p><strong>Completion:</strong> ${summary.completed_items}/${summary.total_items} items</p>
            <p><strong>Media:</strong> ${summary.photo_count} photos, ${summary.video_count} videos</p>
            <p><strong>Issues:</strong> ${summary.issues_count}</p>
            <p><strong>AI Confidence:</strong> ${summary.confidence_average}%</p>
          ` : '<p>No summary available</p>'}
        </div>

        <div class="section">
          <div class="section-title">Property Information</div>
          <div class="property-info">
            <p><strong>Name:</strong> ${inspection.properties.name}</p>
            <p><strong>Address:</strong> ${inspection.properties.address}</p>
            <p><strong>Inspector:</strong> ${inspection.users.name} (${inspection.users.email})</p>
            <p><strong>Date:</strong> ${new Date(inspection.start_time).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${inspection.status}</p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Checklist Results</div>
          ${inspection.checklist_items.map(item => `
            <div class="checklist-item">
              <h4>${item.title}</h4>
              <p><strong>Status:</strong> ${item.status}</p>
              <p><strong>AI Status:</strong> <span class="status-${item.ai_status}">${item.ai_status}</span></p>
              <p><strong>Confidence:</strong> ${item.ai_confidence}%</p>
              ${item.ai_reasoning ? `<p><strong>AI Analysis:</strong> ${item.ai_reasoning}</p>` : ''}
              ${item.notes ? `<p><strong>Notes:</strong> ${item.notes}</p>` : ''}
            </div>
          `).join('')}
        </div>

        <div class="section">
          <div class="section-title">Report Details</div>
          <p>This report was generated automatically by ${this.COMPANY_NAME} AI-powered inspection system.</p>
          <p>Report Version: ${reportData.version}</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Store report metadata in database
   */
  private async storeReportMetadata(reportData: ReportData, options: ReportOptions): Promise<void> {
    try {
      const { error } = await supabase
        .from('inspection_reports')
        .insert({
          id: reportData.reportId,
          inspection_id: reportData.inspection.id,
          generated_at: reportData.generatedAt,
          version: reportData.version,
          options: options,
          file_size: 0, // Will be updated when file is stored
          created_at: new Date().toISOString()
        });

      if (error) {
        logger.warn('Failed to store report metadata', error, 'REPORT_SERVICE');
      }
    } catch (error) {
      logger.warn('Failed to store report metadata', error, 'REPORT_SERVICE');
    }
  }

  /**
   * Generate photo comparison report
   */
  async generatePhotoComparisonReport(
    inspectionId: string,
    comparisons: PhotoComparisonData[]
  ): Promise<{ success: boolean; data?: Blob; error?: string }> {
    try {
      logger.info('Generating photo comparison report', { inspectionId, comparisons: comparisons.length }, 'REPORT_SERVICE');

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Add header
      pdf.setFontSize(18);
      pdf.setTextColor(17, 24, 39);
      pdf.text('Photo Comparison Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 30;

      // Add comparisons
      for (const comparison of comparisons) {
        if (yPosition > pageHeight - 100) {
          pdf.addPage();
          yPosition = margin;
        }

        // AI Analysis results
        pdf.setFontSize(12);
        pdf.setTextColor(75, 85, 99);
        pdf.text(`AI Score: ${comparison.aiAnalysis.score}% (Confidence: ${comparison.aiAnalysis.confidence}%)`, margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.text(`Analysis: ${comparison.aiAnalysis.reasoning}`, margin, yPosition);
        yPosition += 8;

        if (comparison.aiAnalysis.issues.length > 0) {
          pdf.text(`Issues: ${comparison.aiAnalysis.issues.join(', ')}`, margin, yPosition);
          yPosition += 8;
        }

        if (comparison.auditorFeedback) {
          pdf.text(`Auditor Feedback: ${comparison.auditorFeedback}`, margin, yPosition);
          yPosition += 8;
        }

        yPosition += 15;
      }

      return { success: true, data: pdf.output('blob') };
    } catch (error) {
      logger.error('Failed to generate photo comparison report', error, 'REPORT_SERVICE');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get available report templates
   */
  getReportTemplates(): ReportTemplate[] {
    return [
      {
        id: 'standard',
        name: 'Standard Inspection Report',
        description: 'Complete inspection report with all sections',
        sections: [
          { id: 'header', title: 'Header', type: 'header' },
          { id: 'summary', title: 'Executive Summary', type: 'summary' },
          { id: 'property', title: 'Property Information', type: 'summary' },
          { id: 'checklist', title: 'Checklist Results', type: 'checklist' },
          { id: 'optimization', title: 'Listing Optimization', type: 'optimization' },
          { id: 'photos', title: 'Photo Analysis', type: 'photos' },
          { id: 'audit', title: 'Audit Trail', type: 'audit' },
          { id: 'footer', title: 'Footer', type: 'footer' }
        ]
      },
      {
        id: 'summary',
        name: 'Summary Report',
        description: 'Brief summary report without detailed analysis',
        sections: [
          { id: 'header', title: 'Header', type: 'header' },
          { id: 'summary', title: 'Executive Summary', type: 'summary' },
          { id: 'property', title: 'Property Information', type: 'summary' },
          { id: 'footer', title: 'Footer', type: 'footer' }
        ]
      },
      {
        id: 'photos',
        name: 'Photo Analysis Report',
        description: 'Detailed photo comparison and analysis report',
        sections: [
          { id: 'header', title: 'Header', type: 'header' },
          { id: 'photos', title: 'Photo Analysis', type: 'photos' },
          { id: 'footer', title: 'Footer', type: 'footer' }
        ]
      },
      {
        id: 'optimization',
        name: 'Listing Optimization Report',
        description: 'Focused report on listing improvement opportunities',
        sections: [
          { id: 'header', title: 'Header', type: 'header' },
          { id: 'summary', title: 'Executive Summary', type: 'summary' },
          { id: 'optimization', title: 'Listing Optimization', type: 'optimization' },
          { id: 'footer', title: 'Footer', type: 'footer' }
        ]
      }
    ];
  }

  /**
   * Add listing optimization section
   */
  private async addListingOptimizationSection(
    pdf: jsPDF,
    yPosition: number,
    reportData: ReportData,
    pageWidth: number,
    margin: number,
    pageHeight: number
  ): Promise<number> {
    try {
      // Check if we need a new page
      if (yPosition > pageHeight - 150) {
        pdf.addPage();
        yPosition = margin;
      }

      // Section title
      pdf.setFontSize(16);
      pdf.setTextColor(37, 99, 235); // Blue color
      pdf.text('Listing Optimization Suggestions', margin, yPosition);
      yPosition += 20;

      // Get scraped property data (mock for now - would need to be passed or retrieved)
      const mockScrapedData = {
        description: reportData.inspection.properties.name + ' property description',
        amenities: [],
        photos: [],
        rooms: [],
        specifications: { propertyType: 'house' as const, bedrooms: 3, bathrooms: 2, maxGuests: 6 },
        location: { city: 'Unknown', state: 'Unknown', country: 'US' },
        lastUpdated: new Date(),
        sourceUrl: reportData.inspection.properties.vrbo_url || '',
        title: reportData.inspection.properties.name
      };

      // Generate optimization report
      const optimizationReport = await amenityComparisonEngine.generateOptimizationReport(
        reportData.inspection,
        mockScrapedData
      );

      // Add summary
      pdf.setFontSize(12);
      pdf.setTextColor(17, 24, 39);
      pdf.text('Summary', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(75, 85, 99);
      pdf.text(`Total opportunities identified: ${optimizationReport.summary.totalOpportunities}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`High priority actions: ${optimizationReport.summary.highPriorityActions}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Impact: ${optimizationReport.summary.estimatedImpact}`, margin, yPosition);
      yPosition += 15;

      // Add critical missing amenities
      if (optimizationReport.discoveredOpportunities.criticalMissing.length > 0) {
        pdf.setFontSize(12);
        pdf.setTextColor(220, 38, 38); // Red color
        pdf.text('Critical Missing Amenities', margin, yPosition);
        yPosition += 10;

        optimizationReport.discoveredOpportunities.criticalMissing.forEach(missing => {
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.setFontSize(10);
          pdf.setTextColor(75, 85, 99);
          pdf.text(`• ${missing.amenity}`, margin, yPosition);
          yPosition += 6;
          
          const suggestionLines = pdf.splitTextToSize(missing.suggestion, pageWidth - 2 * margin - 10);
          pdf.setFontSize(9);
          pdf.setTextColor(107, 114, 128);
          pdf.text(suggestionLines, margin + 10, yPosition);
          yPosition += suggestionLines.length * 4 + 3;
        });
        yPosition += 10;
      }

      // Add amenity checkbox recommendations
      if (optimizationReport.recommendations.amenityCheckboxes.length > 0) {
        pdf.setFontSize(12);
        pdf.setTextColor(17, 24, 39);
        pdf.text('Amenity Checklist Recommendations', margin, yPosition);
        yPosition += 10;

        optimizationReport.recommendations.amenityCheckboxes.slice(0, 5).forEach(checkbox => {
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.setFontSize(10);
          pdf.setTextColor(75, 85, 99);
          pdf.text(`☐ ${checkbox.amenity}`, margin, yPosition);
          yPosition += 6;
          
          pdf.setFontSize(9);
          pdf.setTextColor(107, 114, 128);
          pdf.text(checkbox.reason, margin + 10, yPosition);
          yPosition += 8;
        });
        yPosition += 10;
      }

      // Add description update suggestions
      if (optimizationReport.recommendations.descriptionUpdates.length > 0) {
        pdf.setFontSize(12);
        pdf.setTextColor(17, 24, 39);
        pdf.text('Description Enhancement Suggestions', margin, yPosition);
        yPosition += 10;

        optimizationReport.recommendations.descriptionUpdates.slice(0, 3).forEach(update => {
          if (yPosition > pageHeight - 60) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.setFontSize(10);
          pdf.setTextColor(75, 85, 99);
          pdf.text(`• ${update.suggestedAddition}`, margin, yPosition);
          yPosition += 6;
          
          pdf.setFontSize(9);
          pdf.setTextColor(107, 114, 128);
          const rationaleLines = pdf.splitTextToSize(update.rationale, pageWidth - 2 * margin - 10);
          pdf.text(rationaleLines, margin + 10, yPosition);
          yPosition += rationaleLines.length * 4 + 5;
        });
        yPosition += 10;
      }

      // Add key findings
      if (optimizationReport.summary.keyFindings.length > 0) {
        pdf.setFontSize(12);
        pdf.setTextColor(17, 24, 39);
        pdf.text('Key Findings', margin, yPosition);
        yPosition += 10;

        optimizationReport.summary.keyFindings.forEach(finding => {
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.setFontSize(10);
          pdf.setTextColor(75, 85, 99);
          pdf.text(`• ${finding}`, margin, yPosition);
          yPosition += 8;
        });
        yPosition += 10;
      }

      // Add disclaimer
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      const disclaimer = 'These suggestions are based on our inspection findings compared to your current listing. Implementing these changes may help improve your listing\'s appeal and discoverability.';
      const disclaimerLines = pdf.splitTextToSize(disclaimer, pageWidth - 2 * margin);
      pdf.text(disclaimerLines, margin, yPosition);
      yPosition += disclaimerLines.length * 4 + 15;

      return yPosition;
    } catch (error) {
      logger.error('Failed to add listing optimization section', error, 'REPORT_SERVICE');
      
      // Add error message to PDF
      pdf.setFontSize(12);
      pdf.setTextColor(220, 38, 38);
      pdf.text('Listing Optimization Analysis', margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Analysis temporarily unavailable. Please contact support.', margin, yPosition);
      yPosition += 20;
      
      return yPosition;
    }
  }

  /**
   * Download report as file
   */
  async downloadReport(blob: Blob, fileName: string): Promise<void> {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const reportService = new ReportService();