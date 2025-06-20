
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Plus, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/components/AuthProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AddProperty = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const editId = searchParams.get('edit');
  const isEditing = !!editId;

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    vrbo_url: "",
    airbnb_url: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProperty, setIsLoadingProperty] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [debugInfo, setDebugInfo] = useState<any>({});

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network: Online');
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      console.log('🌐 Network: Offline');
      setIsOnline(false);
      toast({
        title: "Network Issue",
        description: "You appear to be offline. Please check your connection.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Enhanced authentication validation
  useEffect(() => {
    if (!user) {
      console.warn('⚠️ User not authenticated, redirecting to login');
      return;
    }

    console.log('👤 Auth Status:', {
      user: {
        id: user.id,
        email: user.email,
        role: userRole
      },
      timestamp: new Date().toISOString()
    });

    setDebugInfo(prev => ({
      ...prev,
      authStatus: {
        authenticated: !!user,
        userId: user?.id,
        userEmail: user?.email,
        userRole,
        timestamp: new Date().toISOString()
      }
    }));
  }, [user, userRole]);

  // Load property data if editing
  useEffect(() => {
    if (isEditing && editId && user) {
      setIsLoadingProperty(true);
      console.log('📝 Loading property for editing:', editId);
      
      const loadProperty = async () => {
        try {
          console.log('🔍 Fetching property data...');
          const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', editId)
            .single();

          if (error) {
            console.error('❌ Error loading property:', {
              error,
              propertyId: editId,
              userId: user.id
            });
            
            setDebugInfo(prev => ({
              ...prev,
              loadError: {
                error: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
                propertyId: editId,
                timestamp: new Date().toISOString()
              }
            }));

            toast({
              title: "Error Loading Property",
              description: `Failed to load property: ${error.message}`,
              variant: "destructive",
            });
            navigate('/properties');
            return;
          }

          console.log('✅ Property loaded successfully:', data);
          setFormData({
            name: data.name || "",
            address: data.address || "",
            vrbo_url: data.vrbo_url || "",
            airbnb_url: data.airbnb_url || ""
          });

          setDebugInfo(prev => ({
            ...prev,
            loadedProperty: {
              id: data.id,
              name: data.name,
              hasVrboUrl: !!data.vrbo_url,
              hasAirbnbUrl: !!data.airbnb_url,
              timestamp: new Date().toISOString()
            }
          }));
        } catch (error) {
          console.error('💥 Unexpected error loading property:', error);
          
          setDebugInfo(prev => ({
            ...prev,
            unexpectedLoadError: {
              error: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined,
              timestamp: new Date().toISOString()
            }
          }));

          toast({
            title: "Error",
            description: "An unexpected error occurred while loading the property.",
            variant: "destructive",
          });
          navigate('/properties');
        } finally {
          setIsLoadingProperty(false);
        }
      };

      loadProperty();
    }
  }, [isEditing, editId, navigate, toast, user]);

  // Client-side validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Property name is required";
    } else if (formData.name.length < 3) {
      errors.name = "Property name must be at least 3 characters";
    } else if (formData.name.length > 100) {
      errors.name = "Property name must be less than 100 characters";
    }

    if (!formData.address.trim()) {
      errors.address = "Address is required";
    } else if (formData.address.length < 10) {
      errors.address = "Please provide a complete address";
    } else if (formData.address.length > 200) {
      errors.address = "Address must be less than 200 characters";
    }

    if (formData.vrbo_url && !isValidUrl(formData.vrbo_url)) {
      errors.vrbo_url = "Please enter a valid Vrbo URL";
    }

    if (formData.airbnb_url && !isValidUrl(formData.airbnb_url)) {
      errors.airbnb_url = "Please enter a valid Airbnb URL";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Starting form submission process...');
    
    // Pre-submission validation
    if (!user) {
      console.error('❌ No authenticated user found');
      toast({
        title: "Authentication Required",
        description: "Please log in to add or edit properties.",
        variant: "destructive",
      });
      return;
    }

    if (!isOnline) {
      console.error('❌ No network connection');
      toast({
        title: "Network Error",
        description: "Please check your internet connection and try again.",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) {
      console.warn('⚠️ Form validation failed');
      toast({
        title: "Validation Error",
        description: "Please correct the errors in the form.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const submitStartTime = Date.now();
    const submitData = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      vrbo_url: formData.vrbo_url.trim() || null,
      airbnb_url: formData.airbnb_url.trim() || null,
    };

    console.log(`${isEditing ? '📝 Updating' : '➕ Creating'} property with data:`, {
      ...submitData,
      userId: user.id,
      userEmail: user.email,
      userRole,
      isEditing,
      editId,
      timestamp: new Date().toISOString()
    });

    try {
      let result;
      
      if (isEditing) {
        console.log('🔄 Executing UPDATE operation...');
        result = await supabase
          .from('properties')
          .update({
            ...submitData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editId)
          .select()
          .single();
      } else {
        console.log('🆕 Executing INSERT operation...');
        result = await supabase
          .from('properties')
          .insert({
            ...submitData,
            added_by: user.id,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
      }

      const { data, error } = result;
      const submitDuration = Date.now() - submitStartTime;

      if (error) {
        console.error(`❌ Database error during ${isEditing ? 'update' : 'insert'}:`, {
          error: {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          },
          operation: isEditing ? 'update' : 'insert',
          userId: user.id,
          duration: submitDuration,
          timestamp: new Date().toISOString()
        });

        setDebugInfo(prev => ({
          ...prev,
          submitError: {
            operation: isEditing ? 'update' : 'insert',
            error: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            duration: submitDuration,
            timestamp: new Date().toISOString()
          }
        }));

        // Enhanced error handling with specific messages
        let errorMessage = "An error occurred while saving the property.";
        
        if (error.code === '23505') {
          errorMessage = "A property with this information already exists.";
        } else if (error.code === '42501') {
          errorMessage = "You don't have permission to perform this action.";
        } else if (error.code === 'PGRST116') {
          errorMessage = "The property could not be found.";
        } else if (error.message.includes('JWT')) {
          errorMessage = "Your session has expired. Please log in again.";
        } else if (error.message.includes('violates row-level security')) {
          errorMessage = "You don't have permission to access this property.";
        }

        toast({
          title: `Error ${isEditing ? 'Updating' : 'Creating'} Property`,
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      console.log(`✅ Property ${isEditing ? 'updated' : 'created'} successfully:`, {
        data,
        duration: submitDuration,
        timestamp: new Date().toISOString()
      });

      setDebugInfo(prev => ({
        ...prev,
        submitSuccess: {
          operation: isEditing ? 'update' : 'insert',
          propertyId: data?.id,
          duration: submitDuration,
          timestamp: new Date().toISOString()
        }
      }));

      toast({
        title: `Property ${isEditing ? 'Updated' : 'Added'}`,
        description: `The property "${submitData.name}" has been ${isEditing ? 'updated' : 'added'} successfully.`,
      });

      // Small delay to ensure UI feedback is seen
      setTimeout(() => {
        navigate('/properties');
      }, 500);

    } catch (error) {
      const submitDuration = Date.now() - submitStartTime;
      console.error(`💥 Unexpected error during ${isEditing ? 'update' : 'create'}:`, {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error,
        duration: submitDuration,
        timestamp: new Date().toISOString()
      });

      setDebugInfo(prev => ({
        ...prev,
        unexpectedSubmitError: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          duration: submitDuration,
          timestamp: new Date().toISOString()
        }
      }));

      toast({
        title: "Unexpected Error",
        description: `An unexpected error occurred. Please try again or contact support if the problem persists.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field-specific error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  // Debug info display (only in development)
  const showDebugInfo = process.env.NODE_ENV === 'development' && Object.keys(debugInfo).length > 0;

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
        {/* Network status alert */}
        {!isOnline && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <WifiOff className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              You're currently offline. Please check your internet connection before submitting.
            </AlertDescription>
          </Alert>
        )}

        {/* Authentication status alert */}
        {!user && (
          <Alert className="mb-4 border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              You need to be logged in to add or edit properties.
            </AlertDescription>
          </Alert>
        )}

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isEditing ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {isEditing ? 'Update Property' : 'Property Information'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Property Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Cozy Mountain Cabin"
                  required
                  className={formErrors.name ? "border-red-500" : ""}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="e.g., 123 Main St, Mountain View, CA 94041"
                  required
                  className={formErrors.address ? "border-red-500" : ""}
                />
                {formErrors.address && (
                  <p className="text-sm text-red-600">{formErrors.address}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vrbo_url">Vrbo Listing URL</Label>
                <Input
                  id="vrbo_url"
                  type="url"
                  value={formData.vrbo_url}
                  onChange={(e) => handleInputChange('vrbo_url', e.target.value)}
                  placeholder="https://www.vrbo.com/..."
                  className={formErrors.vrbo_url ? "border-red-500" : ""}
                />
                {formErrors.vrbo_url && (
                  <p className="text-sm text-red-600">{formErrors.vrbo_url}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="airbnb_url">Airbnb Listing URL</Label>
                <Input
                  id="airbnb_url"
                  type="url"
                  value={formData.airbnb_url}
                  onChange={(e) => handleInputChange('airbnb_url', e.target.value)}
                  placeholder="https://www.airbnb.com/..."
                  className={formErrors.airbnb_url ? "border-red-500" : ""}
                />
                {formErrors.airbnb_url && (
                  <p className="text-sm text-red-600">{formErrors.airbnb_url}</p>
                )}
              </div>

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

            {/* Debug information panel */}
            {showDebugInfo && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <h3 className="text-sm font-semibold mb-2">Debug Information:</h3>
                <pre className="text-xs overflow-auto max-h-40">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddProperty;
