
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PropertyHeader } from "@/components/PropertyHeader";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface PropertyFormData {
  name: string;
  address: string;
  vrbo_url?: string;
  airbnb_url?: string;
  notes?: string;
}

const AddProperty = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PropertyFormData>({
    defaultValues: {
      name: "",
      address: "",
      vrbo_url: "",
      airbnb_url: "",
      notes: ""
    }
  });

  const onSubmit = async (data: PropertyFormData) => {
    setIsSubmitting(true);
    
    try {
      console.log('Submitting property data:', data);
      
      // Insert new property
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert({
          name: data.name,
          address: data.address,
          vrbo_url: data.vrbo_url || null,
          airbnb_url: data.airbnb_url || null,
          status: 'active'
        })
        .select()
        .single();

      if (propertyError) {
        console.error('Error creating property:', propertyError);
        throw propertyError;
      }

      console.log('Property created:', property);

      // Create inspection for the new property
      const { data: inspection, error: inspectionError } = await supabase
        .from('inspections')
        .insert({
          property_id: property.id,
          status: 'available',
          completed: false
        })
        .select()
        .single();

      if (inspectionError) {
        console.error('Error creating inspection:', inspectionError);
        throw inspectionError;
      }

      console.log('Inspection created:', inspection);

      toast.success("Property added successfully!");
      
      // Navigate back to home screen
      navigate('/');
      
    } catch (error) {
      console.error('Failed to add property:', error);
      toast.error("Failed to add property. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PropertyHeader 
        title="Add New Property" 
        subtitle="Submit property for inspection" 
      />

      <div className="px-4 py-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="p-0 h-auto text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Property Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: "Property name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter property name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  rules={{ required: "Address is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter full address"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vrbo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vrbo URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://www.vrbo.com/..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="airbnb_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Airbnb URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://www.airbnb.com/..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional notes about this property..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Adding Property..." : "Add Property & Create Inspection"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddProperty;
