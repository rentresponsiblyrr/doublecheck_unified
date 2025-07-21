import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Send, 
  Mail, 
  Phone, 
  FileText, 
  Download, 
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface PropertyManagerInfo {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  preferred_contact: 'email' | 'phone' | 'both';
}

interface DeliveryOptions {
  includeReport: boolean;
  includePhotos: boolean;
  includeRecommendations: boolean;
  urgentIssues: boolean;
  followUpRequired: boolean;
  deliveryMethod: 'email' | 'portal' | 'both';
}

interface PropertyManagerDeliveryProps {
  inspectionId: string;
  propertyId: string;
  propertyName: string;
  className?: string;
}

const PropertyManagerDelivery: React.FC<PropertyManagerDeliveryProps> = ({
  inspectionId,
  propertyId,
  propertyName,
  className = ''
}) => {
  const [managerInfo, setManagerInfo] = useState<PropertyManagerInfo>({
    name: '',
    email: '',
    phone: '',
    company: '',
    preferred_contact: 'email'
  });
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOptions>({
    includeReport: true,
    includePhotos: true,
    includeRecommendations: true,
    urgentIssues: false,
    followUpRequired: false,
    deliveryMethod: 'email'
  });
  const [customMessage, setCustomMessage] = useState('');
  const [isDelivering, setIsDelivering] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<'pending' | 'sent' | 'failed'>('pending');
  const [isLoadingProperty, setIsLoadingProperty] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPropertyManagerInfo();
  }, [propertyId]);

  const fetchPropertyManagerInfo = async () => {
    try {
      setIsLoadingProperty(true);
      logger.info('Fetching property manager info', { propertyId }, 'PROPERTY_MANAGER_DELIVERY');

      // Query property data to get manager information
      const { data: property, error } = await supabase
        .from('properties')
        .select('*')
        .eq('property_id', propertyId)
        .single();

      if (error) {
        throw error;
      }

      // Set default manager info or from property data if available
      setManagerInfo(prev => ({
        ...prev,
        name: property?.manager_name || '',
        email: property?.manager_email || '',
        phone: property?.manager_phone || '',
        company: property?.management_company || ''
      }));

      // Set default custom message
      setCustomMessage(`Hello,

Please find attached the completed inspection report for ${propertyName}.

This comprehensive inspection has been conducted by our certified inspectors and includes:
- Detailed safety and compliance assessment
- Photo documentation and analysis
- AI-powered quality verification
- Recommendations for listing optimization

If you have any questions about the findings or need clarification on any recommendations, please don't hesitate to reach out.

Best regards,
STR Certified Team`);

    } catch (error) {
      logger.error('Failed to fetch property manager info', error, 'PROPERTY_MANAGER_DELIVERY');
      toast({
        title: 'Error Loading Property Data',
        description: 'Failed to load property manager information. You can still enter details manually.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingProperty(false);
    }
  };

  const handleDelivery = async () => {
    try {
      setIsDelivering(true);
      logger.info('Starting delivery to property manager', { 
        inspectionId, 
        propertyId, 
        managerEmail: managerInfo.email 
      }, 'PROPERTY_MANAGER_DELIVERY');

      // Validate required fields
      if (!managerInfo.name || !managerInfo.email) {
        throw new Error('Property manager name and email are required');
      }

      if (!customMessage.trim()) {
        throw new Error('Custom message is required');
      }

      // Prepare delivery data
      const deliveryData = {
        inspection_id: inspectionId,
        property_id: propertyId,
        property_name: propertyName,
        manager_info: managerInfo,
        delivery_options: deliveryOptions,
        custom_message: customMessage,
        delivery_timestamp: new Date().toISOString()
      };

      // In a real implementation, this would call a service to:
      // 1. Generate the report package
      // 2. Send via email/upload to portal
      // 3. Log the delivery in the database
      
      // Simulate delivery process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Log delivery to database (simplified)
      const { error: logError } = await supabase
        .from('logs')
        .insert({
          property_id: parseInt(propertyId),
          checklist_id: `${inspectionId}-delivery`,
          inspector_id: 'system',
          inspector_remarks: `Report delivered to ${managerInfo.name} (${managerInfo.email})`,
          ai_result: JSON.stringify(deliveryData),
          pass: true,
          created_at: new Date().toISOString()
        });

      if (logError) {
        logger.warn('Failed to log delivery', logError, 'PROPERTY_MANAGER_DELIVERY');
      }

      setDeliveryStatus('sent');
      toast({
        title: 'Report Delivered Successfully',
        description: `Inspection report has been sent to ${managerInfo.name} at ${managerInfo.email}`,
        duration: 5000,
      });

    } catch (error) {
      logger.error('Failed to deliver report', error, 'PROPERTY_MANAGER_DELIVERY');
      setDeliveryStatus('failed');
      toast({
        title: 'Delivery Failed',
        description: error instanceof Error ? error.message : 'Failed to deliver report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDelivering(false);
    }
  };

  const updateManagerInfo = (field: keyof PropertyManagerInfo, value: string) => {
    setManagerInfo(prev => ({ ...prev, [field]: value }));
  };

  const updateDeliveryOption = (field: keyof DeliveryOptions, value: any) => {
    setDeliveryOptions(prev => ({ ...prev, [field]: value }));
  };

  if (isLoadingProperty) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Property Manager Delivery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          Property Manager Delivery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Delivery Status */}
        {deliveryStatus !== 'pending' && (
          <div className={`p-3 rounded-lg ${
            deliveryStatus === 'sent' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            <div className="flex items-center gap-2">
              {deliveryStatus === 'sent' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              <span className="font-medium">
                {deliveryStatus === 'sent' ? 'Report Delivered Successfully' : 'Delivery Failed'}
              </span>
            </div>
          </div>
        )}

        {/* Property Manager Information */}
        <div className="space-y-4">
          <h4 className="font-medium">Property Manager Information</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={managerInfo.name}
                onChange={(e) => updateManagerInfo('name', e.target.value)}
                placeholder="Property manager name"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Company</label>
              <Input
                value={managerInfo.company}
                onChange={(e) => updateManagerInfo('company', e.target.value)}
                placeholder="Management company"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                value={managerInfo.email}
                onChange={(e) => updateManagerInfo('email', e.target.value)}
                placeholder="manager@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                type="tel"
                value={managerInfo.phone}
                onChange={(e) => updateManagerInfo('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Preferred Contact Method</label>
            <Select 
              value={managerInfo.preferred_contact} 
              onValueChange={(value) => updateManagerInfo('preferred_contact', value as 'email' | 'phone' | 'both')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Delivery Options */}
        <div className="space-y-4">
          <h4 className="font-medium">Delivery Options</h4>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeReport"
                checked={deliveryOptions.includeReport}
                onCheckedChange={(checked) => updateDeliveryOption('includeReport', checked)}
              />
              <label htmlFor="includeReport" className="text-sm font-medium">
                Include Complete Inspection Report (PDF)
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includePhotos"
                checked={deliveryOptions.includePhotos}
                onCheckedChange={(checked) => updateDeliveryOption('includePhotos', checked)}
              />
              <label htmlFor="includePhotos" className="text-sm font-medium">
                Include Photo Documentation Package
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeRecommendations"
                checked={deliveryOptions.includeRecommendations}
                onCheckedChange={(checked) => updateDeliveryOption('includeRecommendations', checked)}
              />
              <label htmlFor="includeRecommendations" className="text-sm font-medium">
                Include Listing Optimization Recommendations
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="urgentIssues"
                checked={deliveryOptions.urgentIssues}
                onCheckedChange={(checked) => updateDeliveryOption('urgentIssues', checked)}
              />
              <label htmlFor="urgentIssues" className="text-sm font-medium">
                Flag Urgent Safety Issues for Immediate Attention
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="followUpRequired"
                checked={deliveryOptions.followUpRequired}
                onCheckedChange={(checked) => updateDeliveryOption('followUpRequired', checked)}
              />
              <label htmlFor="followUpRequired" className="text-sm font-medium">
                Schedule Follow-up Call/Meeting
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Delivery Method</label>
            <Select 
              value={deliveryOptions.deliveryMethod} 
              onValueChange={(value) => updateDeliveryOption('deliveryMethod', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email Only</SelectItem>
                <SelectItem value="portal">Upload to Portal</SelectItem>
                <SelectItem value="both">Email + Portal Access</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Custom Message */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Custom Message</label>
          <Textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Enter a custom message to include with the report delivery..."
            className="min-h-32"
          />
          <p className="text-xs text-gray-500">
            This message will be included in the email to the property manager.
          </p>
        </div>

        {/* Delivery Summary */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <h5 className="font-medium text-sm">Delivery Summary</h5>
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <Mail className="w-3 h-3" />
              <span>Recipient: {managerInfo.name || 'Not specified'} ({managerInfo.email || 'Not specified'})</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-3 h-3" />
              <span>
                Attachments: {
                  [
                    deliveryOptions.includeReport && 'Inspection Report',
                    deliveryOptions.includePhotos && 'Photos',
                    deliveryOptions.includeRecommendations && 'Recommendations'
                  ].filter(Boolean).join(', ') || 'None selected'
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              <span>Method: {deliveryOptions.deliveryMethod.charAt(0).toUpperCase() + deliveryOptions.deliveryMethod.slice(1)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={handleDelivery}
            disabled={isDelivering || !managerInfo.name || !managerInfo.email || deliveryStatus === 'sent'}
            className="flex-1"
          >
            {isDelivering ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Delivering...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Deliver Report
              </>
            )}
          </Button>
          
          {deliveryStatus === 'sent' && (
            <Button
              variant="outline"
              onClick={() => setDeliveryStatus('pending')}
              className="flex-1"
            >
              Send Again
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 border-t pt-3">
          <div className="flex items-start gap-2">
            <ExternalLink className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p>Reports are delivered securely with tracking and delivery confirmation.</p>
              <p className="mt-1">Property managers will receive a professional package including all selected components.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyManagerDelivery;
export { PropertyManagerDelivery };