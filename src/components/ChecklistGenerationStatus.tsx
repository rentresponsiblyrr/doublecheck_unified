
import { RefreshCw, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ChecklistGenerationStatusProps {
  isGenerating: boolean;
  hasTimedOut: boolean;
  pollCount: number;
  maxPollAttempts: number;
  onRefresh: () => void;
  onGoBack: () => void;
}

export const ChecklistGenerationStatus = ({
  isGenerating,
  hasTimedOut,
  pollCount,
  maxPollAttempts,
  onRefresh,
  onGoBack
}: ChecklistGenerationStatusProps) => {
  if (hasTimedOut) {
    return (
      <div className="px-4 py-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <CardTitle className="text-yellow-800">Checklist Generation Taking Longer Than Expected</CardTitle>
            <CardDescription className="text-yellow-700">
              The checklist is still being generated from the property listing. This can take a few minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <Button 
                onClick={onRefresh}
                className="w-full"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Again
              </Button>
              <Button 
                onClick={onGoBack}
                variant="outline"
                className="w-full"
              >
                Return to Property Selection
              </Button>
            </div>
            <p className="text-sm text-yellow-600 text-center">
              If this continues, please contact support or try creating a new inspection.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isGenerating) {
    const progress = (pollCount / maxPollAttempts) * 100;
    const estimatedTimeRemaining = Math.max(0, (maxPollAttempts - pollCount) * 0.5); // 0.5 minutes per attempt
    
    return (
      <div className="px-4 py-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-blue-600 animate-pulse" />
            </div>
            <CardTitle className="text-blue-800">Generating Checklist</CardTitle>
            <CardDescription className="text-blue-700">
              Analyzing the property listing and creating inspection items...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-blue-600">
                <span>Progress</span>
                <span>{pollCount}/{maxPollAttempts} checks</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-blue-600">
                Estimated time remaining: ~{Math.ceil(estimatedTimeRemaining)} minutes
              </p>
              <p className="text-xs text-blue-500">
                This process analyzes the property listing to create a customized inspection checklist
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={onRefresh}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Now
              </Button>
              <Button 
                onClick={onGoBack}
                variant="ghost"
                className="w-full"
              >
                Return to Property Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};
