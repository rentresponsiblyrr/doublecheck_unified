
import React, { useState, useEffect } from "react";
import { PropertyFormFields } from "@/components/PropertyFormFields";
import { PropertyFormAlerts } from "@/components/PropertyFormAlerts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSimplePropertySubmission } from "@/hooks/useSimplePropertySubmission";
import { useMobileAuth } from "@/hooks/useMobileAuth";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import type { PropertyFormData } from "@/types/propertySubmission";

export const SimplePropertyForm = () => {
  const { user, isAuthenticated, loading: authLoading } = useMobileAuth();
  const isOnline = useNetworkStatus();
  const { isLoading, submitProperty, isEditing } = useSimplePropertySubmission();
  
  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    address: '',
    vrbo_url: '',
    airbnb_url: ''
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoadingProperty, setIsLoadingProperty] = useState(false);

  // Load property data for editing
  useEffect(() => {
    const loadPropertyForEdit = async () => {
      if (!isEditing) return;
      
      const urlParams = new URLSearchParams(window.location.search);
      const editId = urlParams.get('edit');
      
      if (!editId) return;

      console.log('📝 Loading property for edit:', editId);
      setIsLoadingProperty(true);

      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', editId)
          .single();

        if (error) {
          console.error('❌ Error loading property:', error);
          return;
        }

        if (data) {
          console.log('✅ Property loaded for edit:', data);
          setFormData({
            name: data.name || '',
            address: data.address || '',
            vrbo_url: data.vrbo_url || '',
            airbnb_url: data.airbnb_url || ''
          });
        }
      } catch (error) {
        console.error('💥 Unexpected error loading property:', error);
      } finally {
        setIsLoadingProperty(false);
      }
    };

    loadPropertyForEdit();
  }, [isEditing]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Form submitted with data:', formData);
    
    // Clear previous errors
    setFormErrors({});
    
    const success = await submitProperty(formData);
    if (!success) {
      console.log('❌ Submission failed');
    }
  };

  if (authLoading || isLoadingProperty) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">
            {authLoading ? "Loading..." : "Loading property..."}
          </p>
        </div>
      </div>
    );
  }

  const submitButtonText = isLoading 
    ? (isEditing ? "Updating..." : "Adding...")
    : (isEditing ? "Update Property" : "Add Property");

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              {isEditing ? "Edit Property" : "Add New Property"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PropertyFormAlerts isOnline={isOnline} user={user} />
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <PropertyFormFields
                formData={formData}
                formErrors={formErrors}
                onInputChange={handleInputChange}
              />
              
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading || !isAuthenticated || !isOnline}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {submitButtonText}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
