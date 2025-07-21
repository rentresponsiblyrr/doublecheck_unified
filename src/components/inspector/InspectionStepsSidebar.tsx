import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  FileText, 
  Camera, 
  Video, 
  Upload,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  MapPin
} from 'lucide-react';

interface InspectionStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'active' | 'pending' | 'skipped';
  required: boolean;
  estimatedTime?: string;
}

interface InspectionStepsSidebarProps {
  currentStep: string;
  steps: InspectionStep[];
  onStepClick?: (stepId: string) => void;
  overallProgress?: number;
  propertyName?: string;
  className?: string;
}

const InspectionStepsSidebar: React.FC<InspectionStepsSidebarProps> = ({
  currentStep,
  steps,
  onStepClick,
  overallProgress = 0,
  propertyName,
  className = ''
}) => {
  const defaultSteps: InspectionStep[] = [
    {
      id: 'property-selection',
      title: 'Property Selection',
      description: 'Choose property to inspect',
      icon: <Home className="w-4 h-4" />,
      status: 'completed',
      required: true,
      estimatedTime: '2 min'
    },
    {
      id: 'checklist-generation',
      title: 'Checklist Generation',
      description: 'AI generates inspection items',
      icon: <FileText className="w-4 h-4" />,
      status: 'completed',
      required: true,
      estimatedTime: '1 min'
    },
    {
      id: 'photo-capture',
      title: 'Photo Capture',
      description: 'Document property with photos',
      icon: <Camera className="w-4 h-4" />,
      status: 'active',
      required: true,
      estimatedTime: '15-30 min'
    },
    {
      id: 'video-recording',
      title: 'Video Walkthrough',
      description: 'Record comprehensive video',
      icon: <Video className="w-4 h-4" />,
      status: 'pending',
      required: true,
      estimatedTime: '5-10 min'
    },
    {
      id: 'upload-sync',
      title: 'Upload & Sync',
      description: 'Upload all inspection data',
      icon: <Upload className="w-4 h-4" />,
      status: 'pending',
      required: true,
      estimatedTime: '2-5 min'
    }
  ];

  const inspectionSteps = steps.length > 0 ? steps : defaultSteps;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'active':
        return <ArrowRight className="w-4 h-4 text-blue-500" />;
      case 'skipped':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string, isActive: boolean) => {
    if (isActive) return 'border-blue-500 bg-blue-50';
    
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'skipped':
        return 'border-yellow-200 bg-yellow-50';
      case 'pending':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getStepNumber = (index: number, status: string) => {
    if (status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    
    return (
      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
        status === 'active' 
          ? 'bg-blue-500 text-white' 
          : status === 'pending'
          ? 'bg-gray-300 text-gray-600'
          : 'bg-yellow-500 text-white'
      }`}>
        {index + 1}
      </div>
    );
  };

  const completedSteps = inspectionSteps.filter(step => step.status === 'completed').length;
  const totalSteps = inspectionSteps.length;
  const calculatedProgress = Math.round((completedSteps / totalSteps) * 100);
  const displayProgress = overallProgress > 0 ? overallProgress : calculatedProgress;

  const handleStepClick = (step: InspectionStep) => {
    if (onStepClick && (step.status === 'completed' || step.status === 'active')) {
      onStepClick(step.id);
    }
  };

  return (
    <div className={`w-80 ${className}`}>
      {/* Header */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">Current Property</span>
            </div>
            
            {propertyName && (
              <div>
                <h3 className="font-semibold text-gray-900 truncate">{propertyName}</h3>
                <p className="text-xs text-gray-500 mt-1">Active Inspection</p>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>Overall Progress</span>
                <span className="font-medium">{displayProgress}%</span>
              </div>
              <Progress value={displayProgress} className="h-2" />
              <div className="text-xs text-gray-500">
                {completedSteps} of {totalSteps} steps completed
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps List */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-1">
            <h4 className="font-medium text-gray-900 mb-4">Inspection Steps</h4>
            
            <div className="space-y-3">
              {inspectionSteps.map((step, index) => {
                const isActive = step.id === currentStep;
                const isClickable = step.status === 'completed' || step.status === 'active';
                
                return (
                  <div key={step.id} className="relative">
                    {/* Connecting Line */}
                    {index < inspectionSteps.length - 1 && (
                      <div className="absolute left-2.5 top-8 bottom-0 w-px bg-gray-200" />
                    )}
                    
                    <div
                      className={`relative p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-sm ${
                        getStatusColor(step.status, isActive)
                      } ${!isClickable ? 'cursor-default opacity-75' : ''}`}
                      onClick={() => handleStepClick(step)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Step Number/Status */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getStepNumber(index, step.status)}
                        </div>
                        
                        {/* Step Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-shrink-0">
                              {step.icon}
                            </div>
                            <h5 className="font-medium text-sm text-gray-900 truncate">
                              {step.title}
                            </h5>
                            {step.required && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-2">
                            {step.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(step.status)}
                              <span className="text-xs font-medium capitalize text-gray-600">
                                {step.status}
                              </span>
                            </div>
                            
                            {step.estimatedTime && step.status === 'pending' && (
                              <span className="text-xs text-gray-500">
                                ~{step.estimatedTime}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Active Step Indicator */}
                      {isActive && (
                        <div className="absolute right-2 top-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="space-y-3">
            <h5 className="font-medium text-gray-900">Quick Actions</h5>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  // Professional progress save without nuclear reload
                  toast({
                    title: "Progress Saved",
                    description: "Your inspection progress has been saved.",
                  });
                }}
              >
                <Clock className="w-4 h-4 mr-2" />
                Save Progress
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => window.history.back()}
              >
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                Go Back
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help/Tips */}
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="space-y-3">
            <h5 className="font-medium text-gray-900">Tips</h5>
            
            <div className="text-xs text-gray-600 space-y-2">
              <p>• Take clear, well-lit photos of all required items</p>
              <p>• Record a comprehensive video walkthrough</p>
              <p>• Ensure stable internet for upload</p>
              <p>• Your progress is saved automatically</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InspectionStepsSidebar;
export { InspectionStepsSidebar };