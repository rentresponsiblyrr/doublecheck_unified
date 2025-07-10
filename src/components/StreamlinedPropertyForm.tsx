import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useStreamlinedPropertyForm } from "@/hooks/useStreamlinedPropertyForm";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { 
  Loader2, 
  CheckCircle, 
  ArrowLeft, 
  Home, 
  ExternalLink,
  AlertTriangle 
} from "lucide-react";

export const StreamlinedPropertyForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    formData,
    formErrors,
    isLoading,
    isSuccess,
    updateField,
    submitProperty,
  } = useStreamlinedPropertyForm();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please sign in to add properties</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Property Added Successfully!</h2>
            <p className="text-gray-600 mb-4">
              Your property has been saved and is ready for inspection.
            </p>
            <div className="space-y-2">
              <Button onClick={() => navigate('/properties')} className="w-full">
                View Properties
              </Button>
              <Button 
                onClick={() => navigate('/inspector')} 
                variant="outline" 
                className="w-full"
              >
                Start Inspection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Property</h1>
          <p className="text-gray-600">
            Enter your property details below. We'll automatically import additional information from the listing URL.
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Property Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error Alert */}
            {(formErrors.submit || formErrors.urls) && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {formErrors.submit || formErrors.urls}
                </AlertDescription>
              </Alert>
            )}

            {/* Property Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Property Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Sunset Beach House, Downtown Loft"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={formErrors.name ? 'border-red-500' : ''}
              />
              {formErrors.name && (
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>

            {/* Property Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Property Address *</Label>
              <Textarea
                id="address"
                placeholder="e.g., 123 Ocean Drive, Miami Beach, FL 33139"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                className={formErrors.address ? 'border-red-500' : ''}
                rows={3}
              />
              {formErrors.address && (
                <p className="text-sm text-red-500">{formErrors.address}</p>
              )}
            </div>

            {/* Listing URLs Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Listing URLs</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Provide at least one listing URL. We'll automatically import details from the listing.
                </p>
              </div>

              {/* VRBO URL */}
              <div className="space-y-2">
                <Label htmlFor="vrbo_url" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  VRBO URL
                </Label>
                <Input
                  id="vrbo_url"
                  placeholder="https://www.vrbo.com/123456"
                  value={formData.vrbo_url}
                  onChange={(e) => updateField('vrbo_url', e.target.value)}
                  className={formErrors.vrbo_url ? 'border-red-500' : ''}
                />
                {formErrors.vrbo_url && (
                  <p className="text-sm text-red-500">{formErrors.vrbo_url}</p>
                )}
              </div>

              {/* Airbnb URL */}
              <div className="space-y-2">
                <Label htmlFor="airbnb_url" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Airbnb URL
                </Label>
                <Input
                  id="airbnb_url"
                  placeholder="https://www.airbnb.com/rooms/123456"
                  value={formData.airbnb_url}
                  onChange={(e) => updateField('airbnb_url', e.target.value)}
                  className={formErrors.airbnb_url ? 'border-red-500' : ''}
                />
                {formErrors.airbnb_url && (
                  <p className="text-sm text-red-500">{formErrors.airbnb_url}</p>
                )}
              </div>
            </div>

            {/* Info Box */}
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Automatic Import:</strong> When you add this property, we'll automatically 
                import additional details like amenities, photos, and descriptions from the listing URL 
                to help create a comprehensive inspection checklist.
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <Button
              onClick={submitProperty}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding Property & Importing Data...
                </>
              ) : (
                <>
                  <Home className="h-4 w-4 mr-2" />
                  Add Property
                </>
              )}
            </Button>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Having trouble? Make sure your listing URL is publicly accessible and properly formatted.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};