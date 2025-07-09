// Property Manager Delivery Component - Send reports to property managers
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Mail, Send, User, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { reportDeliveryService, type PropertyManagerContact, type ReportDelivery, type EmailTemplate } from '@/services/reportDeliveryService';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface PropertyManagerDeliveryProps {
  inspectionId: string;
  propertyId: string;
  propertyName: string;
}

export const PropertyManagerDelivery: React.FC<PropertyManagerDeliveryProps> = ({
  inspectionId,
  propertyId,
  propertyName
}) => {
  const [isSending, setIsSending] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [propertyManagers, setPropertyManagers] = useState<PropertyManagerContact[]>([]);
  const [deliveryHistory, setDeliveryHistory] = useState<ReportDelivery[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('standard_inspection_report');
  const [customRecipient, setCustomRecipient] = useState({ name: '', email: '' });
  const [showCustomRecipient, setShowCustomRecipient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [inspectionId, propertyId]);

  const loadData = async () => {
    try {
      setIsLoadingContacts(true);
      
      // Load property managers
      const managers = await reportDeliveryService.getPropertyManagers(propertyId);
      setPropertyManagers(managers);

      // Load delivery history
      const history = await reportDeliveryService.getDeliveryHistory(inspectionId);
      setDeliveryHistory(history);

      // Load email templates
      const templates = reportDeliveryService.getEmailTemplates();
      setEmailTemplates(templates);

    } catch (error) {
      logger.error('Failed to load delivery data', error, 'PROPERTY_MANAGER_DELIVERY');
      toast({
        title: 'Failed to Load Data',
        description: 'Could not load property manager contacts',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleSendReport = async (recipientEmail: string, recipientName: string) => {
    try {
      setIsSending(true);
      logger.info('Sending report to property manager', { inspectionId, recipientEmail, selectedTemplate }, 'PROPERTY_MANAGER_DELIVERY');

      const result = await reportDeliveryService.sendReportByEmail(
        inspectionId,
        recipientEmail,
        recipientName,
        selectedTemplate
      );

      if (result.success) {
        toast({
          title: 'Report Sent Successfully',
          description: `Report has been sent to ${recipientName} (${recipientEmail})`,
          duration: 5000,
        });

        // Refresh delivery history
        const updatedHistory = await reportDeliveryService.getDeliveryHistory(inspectionId);
        setDeliveryHistory(updatedHistory);
      } else {
        throw new Error(result.error || 'Failed to send report');
      }
    } catch (error) {
      logger.error('Failed to send report', error, 'PROPERTY_MANAGER_DELIVERY');
      toast({
        title: 'Report Send Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendToCustomRecipient = async () => {
    if (!customRecipient.name || !customRecipient.email) {
      toast({
        title: 'Invalid Recipient',
        description: 'Please provide both name and email for the custom recipient',
        variant: 'destructive',
      });
      return;
    }

    await handleSendReport(customRecipient.email, customRecipient.name);
    setCustomRecipient({ name: '', email: '' });
    setShowCustomRecipient(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedTemplateData = emailTemplates.find(t => t.id === selectedTemplate);

  if (isLoadingContacts) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send Report to Property Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner className="w-6 h-6 mr-2" />
            <span>Loading property manager contacts...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Send Report to Property Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Template Selection */}
        <div className="space-y-2">
          <Label htmlFor="email-template">Email Template</Label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Select an email template" />
            </SelectTrigger>
            <SelectContent>
              {emailTemplates.map(template => (
                <SelectItem key={template.id} value={template.id}>
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-gray-500">{template.subject}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedTemplateData && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              <p><strong>Subject:</strong> {selectedTemplateData.subject}</p>
              <p className="mt-1"><strong>Variables:</strong> {selectedTemplateData.variables.join(', ')}</p>
            </div>
          )}
        </div>

        {/* Property Manager Contacts */}
        <div className="space-y-4">
          <h4 className="font-medium">Property Manager Contacts</h4>
          
          {propertyManagers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No property manager contacts found</p>
              <p className="text-sm">Add a custom recipient below</p>
            </div>
          ) : (
            <div className="space-y-3">
              {propertyManagers.map(manager => (
                <div key={manager.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="font-medium">{manager.name}</div>
                      <div className="text-sm text-gray-600">{manager.email}</div>
                      <div className="text-xs text-gray-500">{manager.role}</div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleSendReport(manager.email, manager.name)}
                    disabled={isSending}
                    size="sm"
                  >
                    {isSending ? (
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send Report
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Recipient */}
        <div className="space-y-4">
          {!showCustomRecipient ? (
            <Button
              variant="outline"
              onClick={() => setShowCustomRecipient(true)}
              className="w-full"
            >
              <User className="w-4 h-4 mr-2" />
              Add Custom Recipient
            </Button>
          ) : (
            <div className="space-y-3 p-4 border rounded-lg">
              <h5 className="font-medium">Custom Recipient</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="custom-name">Name</Label>
                  <Input
                    id="custom-name"
                    value={customRecipient.name}
                    onChange={(e) => setCustomRecipient(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter recipient name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="custom-email">Email</Label>
                  <Input
                    id="custom-email"
                    type="email"
                    value={customRecipient.email}
                    onChange={(e) => setCustomRecipient(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter recipient email"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleSendToCustomRecipient}
                  disabled={isSending || !customRecipient.name || !customRecipient.email}
                  size="sm"
                >
                  {isSending ? (
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Report
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCustomRecipient(false);
                    setCustomRecipient({ name: '', email: '' });
                  }}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Delivery History */}
        {deliveryHistory.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Delivery History</h4>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {deliveryHistory.map(delivery => (
                <div key={delivery.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(delivery.status)}
                    <div>
                      <div className="font-medium text-sm">{delivery.recipientName}</div>
                      <div className="text-xs text-gray-600">{delivery.recipientEmail}</div>
                      <div className="text-xs text-gray-500">
                        {delivery.sentAt ? new Date(delivery.sentAt).toLocaleString() : 'Not sent'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getStatusColor(delivery.status)}`}>
                      {delivery.status}
                    </Badge>
                    
                    {delivery.status === 'failed' && delivery.errorMessage && (
                      <div className="text-xs text-red-500 max-w-32 truncate" title={delivery.errorMessage}>
                        {delivery.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 border-t pt-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p>Reports are automatically generated and sent via email with download links.</p>
              <p className="mt-1">Recipients will receive a professional email with the inspection report attached.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyManagerDelivery;