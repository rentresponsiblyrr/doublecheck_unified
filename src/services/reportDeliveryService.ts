// Report Delivery Service - Handle report distribution to property managers
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { reportService } from './reportService';

export interface PropertyManagerContact {
  name: string;
  email: string;
  phone?: string;
  role: string;
  propertyId: string;
}

export interface ReportDelivery {
  id: string;
  inspectionId: string;
  reportId: string;
  recipientEmail: string;
  recipientName: string;
  deliveryMethod: 'email' | 'portal' | 'manual';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
  metadata: {
    reportType: string;
    propertyName: string;
    emailSubject: string;
    emailTemplate: string;
  };
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
}

export class ReportDeliveryService {
  private readonly EMAIL_TEMPLATES: EmailTemplate[] = [
    {
      id: 'standard_inspection_report',
      name: 'Standard Inspection Report',
      subject: 'Inspection Report Ready - {{propertyName}}',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">STR Certified</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Powered by Rent Responsibly</p>
          </div>
          
          <div style="padding: 30px 20px;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Inspection Report Complete</h2>
            
            <p>Dear {{recipientName}},</p>
            
            <p>Your property inspection for <strong>{{propertyName}}</strong> has been completed and reviewed. The comprehensive inspection report is now available for download.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Report Summary</h3>
              <ul style="color: #6b7280; margin: 10px 0;">
                <li>Inspection Date: {{inspectionDate}}</li>
                <li>Inspector: {{inspectorName}}</li>
                <li>Total Items Checked: {{totalItems}}</li>
                <li>Items Passed: {{passedItems}}</li>
                <li>Overall Score: {{overallScore}}%</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{reportDownloadUrl}}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Download Report
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              This report contains detailed analysis of your property's compliance with vacation rental standards. 
              If you have any questions about the inspection results, please contact our team.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #9ca3af; font-size: 12px;">
                © 2024 STR Certified. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
      textContent: `
STR Certified - Inspection Report Complete

Dear {{recipientName}},

Your property inspection for {{propertyName}} has been completed and reviewed. The comprehensive inspection report is now available for download.

Report Summary:
- Inspection Date: {{inspectionDate}}
- Inspector: {{inspectorName}}
- Total Items Checked: {{totalItems}}
- Items Passed: {{passedItems}}
- Overall Score: {{overallScore}}%

Download your report: {{reportDownloadUrl}}

This report contains detailed analysis of your property's compliance with vacation rental standards. If you have any questions about the inspection results, please contact our team.

© 2024 STR Certified. All rights reserved.
      `,
      variables: [
        'recipientName',
        'propertyName',
        'inspectionDate',
        'inspectorName',
        'totalItems',
        'passedItems',
        'overallScore',
        'reportDownloadUrl'
      ]
    },
    {
      id: 'urgent_issues_report',
      name: 'Urgent Issues Report',
      subject: 'URGENT: Safety Issues Found - {{propertyName}}',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">⚠️ URGENT REPORT</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">STR Certified</p>
          </div>
          
          <div style="padding: 30px 20px;">
            <h2 style="color: #dc2626; margin-bottom: 20px;">Safety Issues Require Immediate Attention</h2>
            
            <p>Dear {{recipientName}},</p>
            
            <p><strong>Critical safety issues have been identified at {{propertyName}} that require immediate attention before guests can safely occupy the property.</strong></p>
            
            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
              <h3 style="color: #dc2626; margin-top: 0;">Issues Found:</h3>
              <p style="color: #991b1b; margin: 10px 0;">
                {{urgentIssues}}
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{reportDownloadUrl}}" style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Download Full Report
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              Please address these issues immediately and schedule a re-inspection once resolved.
            </p>
          </div>
        </div>
      `,
      textContent: `
⚠️ URGENT REPORT - STR Certified

Dear {{recipientName}},

Critical safety issues have been identified at {{propertyName}} that require immediate attention before guests can safely occupy the property.

Issues Found:
{{urgentIssues}}

Download Full Report: {{reportDownloadUrl}}

Please address these issues immediately and schedule a re-inspection once resolved.

© 2024 STR Certified. All rights reserved.
      `,
      variables: [
        'recipientName',
        'propertyName',
        'urgentIssues',
        'reportDownloadUrl'
      ]
    }
  ];

  /**
   * Send report to property manager via email
   */
  async sendReportByEmail(
    inspectionId: string,
    recipientEmail: string,
    recipientName: string,
    templateId: string = 'standard_inspection_report'
  ): Promise<{ success: boolean; deliveryId?: string; error?: string }> {
    try {
      logger.info('Sending report via email', { inspectionId, recipientEmail, templateId }, 'REPORT_DELIVERY');

      // Generate the report first
      const reportResult = await reportService.generateInspectionReport(inspectionId);
      if (!reportResult.success || !reportResult.data) {
        throw new Error('Failed to generate report');
      }

      // Get inspection details for email template
      const inspection = await this.getInspectionDetails(inspectionId);
      if (!inspection) {
        throw new Error('Inspection not found');
      }

      // Upload report to storage for access
      const reportFileName = `reports/${inspectionId}/inspection_report_${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('inspection-media')
        .upload(reportFileName, reportResult.data, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Failed to upload report: ${uploadError.message}`);
      }

      // Get public URL for download
      const { data: { publicUrl } } = supabase.storage
        .from('inspection-media')
        .getPublicUrl(reportFileName);

      // Prepare email content
      const template = this.EMAIL_TEMPLATES.find(t => t.id === templateId);
      if (!template) {
        throw new Error('Email template not found');
      }

      const emailVariables = {
        recipientName,
        propertyName: inspection.properties.name,
        inspectionDate: new Date(inspection.start_time).toLocaleDateString(),
        inspectorName: inspection.users.name,
        totalItems: inspection.checklist_items.length,
        passedItems: inspection.checklist_items.filter(item => item.ai_status === 'pass').length,
        overallScore: inspection.ai_analysis_summary?.overall_score || 0,
        reportDownloadUrl: publicUrl,
        urgentIssues: inspection.checklist_items
          .filter(item => item.ai_status === 'fail' && item.category === 'safety')
          .map(item => item.title)
          .join(', ')
      };

      const emailSubject = this.processTemplate(template.subject, emailVariables);
      const emailHtml = this.processTemplate(template.htmlContent, emailVariables);
      const emailText = this.processTemplate(template.textContent, emailVariables);

      // Create delivery record
      const deliveryId = `delivery_${inspectionId}_${Date.now()}`;
      const delivery: ReportDelivery = {
        id: deliveryId,
        inspectionId,
        reportId: `RPT-${inspectionId.slice(-8)}-${Date.now()}`,
        recipientEmail,
        recipientName,
        deliveryMethod: 'email',
        status: 'pending',
        metadata: {
          reportType: templateId,
          propertyName: inspection.properties.name,
          emailSubject,
          emailTemplate: templateId
        }
      };

      await this.storeDeliveryRecord(delivery);

      // Send email using Supabase Edge Functions (would need to be implemented)
      // For now, we'll simulate successful email sending
      const emailSent = await this.sendEmailViaProvider(recipientEmail, emailSubject, emailHtml, emailText);

      if (emailSent) {
        await this.updateDeliveryStatus(deliveryId, 'sent');
        logger.info('Report email sent successfully', { deliveryId, recipientEmail }, 'REPORT_DELIVERY');
        return { success: true, deliveryId };
      } else {
        await this.updateDeliveryStatus(deliveryId, 'failed', 'Email sending failed');
        throw new Error('Email sending failed');
      }

    } catch (error) {
      logger.error('Failed to send report via email', error, 'REPORT_DELIVERY');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get available property managers for a property
   */
  async getPropertyManagers(propertyId: string): Promise<PropertyManagerContact[]> {
    try {
      // This would typically fetch from a property_managers table
      // For now, we'll return mock data
      return [
        {
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '+1-555-0123',
          role: 'Property Manager',
          propertyId
        },
        {
          name: 'Sarah Johnson',
          email: 'sarah.johnson@example.com',
          phone: '+1-555-0456',
          role: 'Owner',
          propertyId
        }
      ];
    } catch (error) {
      logger.error('Failed to get property managers', error, 'REPORT_DELIVERY');
      return [];
    }
  }

  /**
   * Get delivery history for an inspection
   */
  async getDeliveryHistory(inspectionId: string): Promise<ReportDelivery[]> {
    try {
      const { data, error } = await supabase
        .from('report_deliveries')
        .select('*')
        .eq('inspection_id', inspectionId)
        .order('sent_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch delivery history: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get delivery history', error, 'REPORT_DELIVERY');
      return [];
    }
  }

  /**
   * Get available email templates
   */
  getEmailTemplates(): EmailTemplate[] {
    return this.EMAIL_TEMPLATES;
  }

  /**
   * Process template variables
   */
  private processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, String(value));
    });
    
    return processed;
  }

  /**
   * Get inspection details for email template
   */
  private async getInspectionDetails(inspectionId: string) {
    const { data, error } = await supabase
      .from('inspections_fixed')
      .select(`
        *,
        properties (name, address),
        users (name, email),
        checklist_items (
          id, title, category, ai_status, ai_confidence, ai_reasoning
        )
      `)
      .eq('id', inspectionId)
      .single();

    if (error) {
      logger.error('Failed to fetch inspection details', error, 'REPORT_DELIVERY');
      return null;
    }

    return data;
  }

  /**
   * Store delivery record in database
   */
  private async storeDeliveryRecord(delivery: ReportDelivery): Promise<void> {
    const { error } = await supabase
      .from('report_deliveries')
      .insert({
        id: delivery.id,
        inspection_id: delivery.inspectionId,
        report_id: delivery.reportId,
        recipient_email: delivery.recipientEmail,
        recipient_name: delivery.recipientName,
        delivery_method: delivery.deliveryMethod,
        status: delivery.status,
        metadata: delivery.metadata,
        created_at: new Date().toISOString()
      });

    if (error) {
      logger.error('Failed to store delivery record', error, 'REPORT_DELIVERY');
    }
  }

  /**
   * Update delivery status
   */
  private async updateDeliveryStatus(deliveryId: string, status: string, errorMessage?: string): Promise<void> {
    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'sent') {
      updates.sent_at = new Date().toISOString();
    } else if (status === 'delivered') {
      updates.delivered_at = new Date().toISOString();
    } else if (status === 'failed') {
      updates.error_message = errorMessage;
    }

    const { error } = await supabase
      .from('report_deliveries')
      .update(updates)
      .eq('id', deliveryId);

    if (error) {
      logger.error('Failed to update delivery status', error, 'REPORT_DELIVERY');
    }
  }

  /**
   * Send email via external provider (placeholder)
   */
  private async sendEmailViaProvider(
    to: string,
    subject: string,
    html: string,
    text: string
  ): Promise<boolean> {
    // This would integrate with an actual email service like SendGrid, Amazon SES, etc.
    // For now, we'll simulate successful sending
    logger.info('Simulating email send', { to, subject }, 'REPORT_DELIVERY');
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true; // Simulate successful send
  }
}

// Export singleton instance
export const reportDeliveryService = new ReportDeliveryService();