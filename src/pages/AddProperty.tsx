
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Plus, Wifi, WifiOff } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/components/FastAuthProvider";
import { PropertyFormFields } from "@/components/PropertyFormFields";
import { PropertyFormAlerts } from "@/components/PropertyFormAlerts";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { usePropertyForm } from "@/hooks/usePropertyForm";
import { useReliablePropertySubmission } from "@/hooks/useReliablePropertySubmission";
import { usePropertyLoader } from "@/hooks/usePropertyLoader";

const AddProperty = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOnline = useNetworkStatus();
  
  const {
    isLoading,
    submitProperty,
    isEditing
  } = useReliablePropertySubmission(user);

  const { isLoadingProperty, loadProperty } = usePropertyLoader(user);

  const {
    formData,
    formErrors,
    validateForm,
    handleInputChange,
    setFormData
  } = usePropertyForm();

  // Load property data if editing
  useEffect(() => {
    if (isEditing) {
      const loadData = async () => {
        try {
          const propertyData = await loadProperty();
          if (propertyData) {
            setFormData(propertyData);
          }
        } catch (error) {
          console.error('Failed to load property:', error);
        }
      };
      loadData();
    }
  }, [isEditing, loadProperty, setFormData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🎯 Form submission triggered', { formData });
    
    if (!validateForm()) {
      console.warn('⚠️ Form validation failed');
      return;
    }

    await submitProperty(formData, isOnline);
  };

  if (isLoadingProperty) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 py-6">
          <LoadingSpinner message="Loading property data..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/properties')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Edit Property' : 'Add New Property'}
              </h1>
              {!isOnline && <WifiOff className="w-4 h-4 text-red-500" />}
              {isOnline && <Wifi className="w-4 h-4 text-green-500" />}
            </div>
            <p className="text-sm text-gray-600">
              {isEditing ? 'Update property information' : 'Enter property details to add to your inspection list'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <PropertyFormAlerts isOnline={isOnline} user={user} />

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isEditing ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {isEditing ? 'Update Property' : 'Property Information'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <PropertyFormFields
                formData={formData}
                formErrors={formErrors}
                onInputChange={handleInputChange}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/properties')}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !user || !isOnline}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {isEditing ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                      {isEditing ? 'Update Property' : 'Add Property'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddProperty;
