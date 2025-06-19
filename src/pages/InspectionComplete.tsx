
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Home, Calendar, Clock, MapPin, FileText } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface InspectionDetails {
  id: string;
  property_id: string;
  start_time: string;
  end_time: string | null;
  completed: boolean;
  properties: {
    name: string;
    address: string;
    vrbo_url: string | null;
  };
}

interface ChecklistSummary {
  total: number;
  completed: number;
  categories: {
    safety: number;
    amenity: number;
    cleanliness: number;
    maintenance: number;
  };
}

const InspectionComplete = () => {
  const { inspectionId } = useParams<{ inspectionId: string }>();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ChecklistSummary | null>(null);

  const { data: inspection, isLoading } = useQuery({
    queryKey: ['inspection-details', inspectionId],
    queryFn: async () => {
      if (!inspectionId) throw new Error('No inspection ID provided');
      
      console.log('Fetching inspection details:', inspectionId);
      
      const { data, error } = await supabase
        .from('inspections')
        .select(`
          *,
          properties (
            name,
            address,
            vrbo_url
          )
        `)
        .eq('id', inspectionId)
        .single();
      
      if (error) {
        console.error('Error fetching inspection details:', error);
        throw error;
      }

      console.log('Fetched inspection details:', data);
      return data as InspectionDetails;
    },
    enabled: !!inspectionId,
  });

  useEffect(() => {
    if (!inspectionId) return;

    const fetchChecklistSummary = async () => {
      try {
        console.log('Fetching checklist summary for inspection:', inspectionId);
        
        const { data, error } = await supabase
          .from('checklist_items')
          .select('category, status')
          .eq('inspection_id', inspectionId);

        if (error) {
          console.error('Error fetching checklist items:', error);
          return;
        }

        const total = data.length;
        const completed = data.filter(item => item.status === 'completed').length;
        
        const categories = data.reduce((acc, item) => {
          const category = item.category as keyof typeof acc;
          if (category && acc[category] !== undefined) {
            acc[category]++;
          }
          return acc;
        }, {
          safety: 0,
          amenity: 0,
          cleanliness: 0,
          maintenance: 0
        });

        setSummary({ total, completed, categories });
        console.log('Checklist summary:', { total, completed, categories });
      } catch (error) {
        console.error('Failed to fetch checklist summary:', error);
      }
    };

    fetchChecklistSummary();
  }, [inspectionId]);

  const formatDuration = (startTime: string, endTime: string | null) => {
    if (!endTime) return 'Unknown';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins} minutes`;
    }
    
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!inspection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Inspection Not Found
          </h2>
          <Button onClick={() => navigate('/')}>
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">DoubleCheck</h1>
            <p className="text-sm text-gray-600 mt-1">Powered by Rent Responsibly</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      <div className="px-4 py-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Inspection Complete!
          </h2>
          <p className="text-gray-600">
            Your inspection has been successfully submitted for review
          </p>
        </div>

        {/* Property Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {inspection.properties.name}
            </CardTitle>
            <CardDescription>
              {inspection.properties.address}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="font-medium">Date</div>
                  <div className="text-gray-600">
                    {new Date(inspection.start_time).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="font-medium">Duration</div>
                  <div className="text-gray-600">
                    {formatDuration(inspection.start_time, inspection.end_time)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {summary && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Inspection Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Items Completed</span>
                  <Badge variant="secondary">
                    {summary.completed} of {summary.total}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">By Category</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Safety</span>
                      <span>{summary.categories.safety}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amenities</span>
                      <span>{summary.categories.amenity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cleanliness</span>
                      <span>{summary.categories.cleanliness}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maintenance</span>
                      <span>{summary.categories.maintenance}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-medium text-xs">1</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">AI Review</div>
                  <div>Your evidence will be analyzed by our AI system</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-medium text-xs">2</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Human Audit</div>
                  <div>Our team will verify the AI's findings</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-medium text-xs">3</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Certification</div>
                  <div>Property will receive verified badge if approved</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <Home className="w-4 h-4 mr-2" />
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InspectionComplete;
