
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const AddProperty = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
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

  // Load property data if editing
  useEffect(() => {
    if (isEditing && editId) {
      setIsLoadingProperty(true);
      console.log('📝 Loading property for editing:', editId);
      
      const loadProperty = async () => {
        try {
          const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', editId)
            .single();

          if (error) {
            console.error('❌ Error loading property:', error);
            toast({
              title: "Error",
              description: "Failed to load property data.",
              variant: "destructive",
            });
            navigate('/properties');
            return;
          }

          console.log('✅ Property loaded:', data);
          setFormData({
            name: data.name || "",
            address: data.address || "",
            vrbo_url: data.vrbo_url || "",
            airbnb_url: data.airbnb_url || ""
          });
        } catch (error) {
          console.error('💥 Failed to load property:', error);
          toast({
            title: "Error",
            description: "An unexpected error occurred.",
            variant: "destructive",
          });
          navigate('/properties');
        } finally {
          setIsLoadingProperty(false);
        }
      };

      loadProperty();
    }
  }, [isEditing, editId, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log(`${isEditing ? '📝 Updating' : '➕ Creating'} property:`, formData);

      if (isEditing) {
        const { error } = await supabase
          .from('properties')
          .update({
            name: formData.name,
            address: formData.address,
            vrbo_url: formData.vrbo_url || null,
            airbnb_url: formData.airbnb_url || null,
          })
          .eq('id', editId);

        if (error) {
          console.error('❌ Error updating property:', error);
          throw error;
        }

        console.log('✅ Property updated successfully');
        toast({
          title: "Property Updated",
          description: "The property has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('properties')
          .insert({
            name: formData.name,
            address: formData.address,
            vrbo_url: formData.vrbo_url || null,
            airbnb_url: formData.airbnb_url || null,
          });

        if (error) {
          console.error('❌ Error creating property:', error);
          throw error;
        }

        console.log('✅ Property created successfully');
        toast({
          title: "Property Added",
          description: "The property has been added successfully.",
        });
      }

      navigate('/properties');
    } catch (error) {
      console.error(`💥 Failed to ${isEditing ? 'update' : 'create'} property:`, error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'add'} property. Please try again.`,
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
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Edit Property' : 'Add New Property'}
            </h1>
            <p className="text-sm text-gray-600">
              {isEditing ? 'Update property information' : 'Enter property details to add to your inspection list'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="e.g., 123 Main St, Mountain View, CA 94041"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vrbo_url">Vrbo Listing URL</Label>
                <Input
                  id="vrbo_url"
                  type="url"
                  value={formData.vrbo_url}
                  onChange={(e) => handleInputChange('vrbo_url', e.target.value)}
                  placeholder="https://www.vrbo.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="airbnb_url">Airbnb Listing URL</Label>
                <Input
                  id="airbnb_url"
                  type="url"
                  value={formData.airbnb_url}
                  onChange={(e) => handleInputChange('airbnb_url', e.target.value)}
                  placeholder="https://www.airbnb.com/..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/properties')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
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
