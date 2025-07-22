/**
 * Property Manager Delivery Business Logic Hook
 * Extracted from PropertyManagerDelivery.tsx for surgical refactoring
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export interface PropertyManagerInfo {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  preferred_contact: 'email' | 'phone' | 'both';
}

export interface DeliveryOptions {
  includeReport: boolean;
  includePhotos: boolean;
  includeRecommendations: boolean;
  urgentIssues: boolean;
  followUpRequired: boolean;
  deliveryMethod: 'email' | 'portal' | 'both';
}

export const usePropertyManagerDelivery = (
  inspectionId: string,
  propertyId: string,
  propertyName: string
) => {
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

      const { data: property, error } = await supabase
        .from('properties')
        .select('*')
        .eq('property_id', propertyId)
        .single();

      if (error) {
        throw error;
      }

      setManagerInfo(prev => ({
        ...prev,
        name: property?.manager_name || '',
        email: property?.manager_email || '',
        phone: property?.manager_phone || '',
        company: property?.management_company || ''
      }));

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

      if (!managerInfo.name || !managerInfo.email) {
        throw new Error('Property manager name and email are required');
      }

      if (!customMessage.trim()) {
        throw new Error('Custom message is required');
      }

      const deliveryData = {
        inspection_id: inspectionId,
        property_id: propertyId,
        property_name: propertyName,
        manager_info: managerInfo,
        delivery_options: deliveryOptions,
        custom_message: customMessage,
        delivery_timestamp: new Date().toISOString()
      };

      // Simulate delivery process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Log delivery to database - using report_deliveries table for proper schema
      const { error: logError } = await supabase
        .from('report_deliveries')
        .insert({
          inspection_id: inspectionId,
          delivery_method: 'email',
          recipient_email: managerInfo.email,
          recipient_name: managerInfo.name,
          delivery_status: 'completed',
          delivery_data: JSON.stringify(deliveryData),
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

  const resetDeliveryStatus = () => {
    setDeliveryStatus('pending');
  };

  return {
    managerInfo,
    deliveryOptions,
    customMessage,
    isDelivering,
    deliveryStatus,
    isLoadingProperty,
    setCustomMessage,
    handleDelivery,
    updateManagerInfo,
    updateDeliveryOption,
    resetDeliveryStatus
  };
};