import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle } from "lucide-react";

interface QuickActionsProps {
  context: 'properties' | 'inspections' | 'audit';
  pendingInspections?: number;
}

/**
 * QuickActions component for displaying contextual quick action buttons
 * 
 * @param {QuickActionsProps} props - Component props
 * @param {string} props.context - Context for which actions to show
 * @param {number} [props.pendingInspections] - Number of pending inspections
 * @returns {JSX.Element} The QuickActions component
 */
export const QuickActions = ({ 
  context, 
  pendingInspections = 0 
}: QuickActionsProps) => {
  const renderPropertyActions = () => (
    <Card id="property-quick-actions-card">
      <CardContent className="p-4">
        <div id="property-actions-container" className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium">Pending Inspections</span>
            {pendingInspections > 0 && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                {pendingInspections}
              </Badge>
            )}
          </div>
          
          {pendingInspections > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              View Pending
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderInspectionActions = () => (
    <Card id="inspection-quick-actions-card">
      <CardContent className="p-4">
        <div id="inspection-actions-container" className="text-center">
          <p className="text-sm text-gray-600">Inspection quick actions</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderAuditActions = () => (
    <Card id="audit-quick-actions-card">
      <CardContent className="p-4">
        <div id="audit-actions-container" className="text-center">
          <p className="text-sm text-gray-600">Audit quick actions</p>
        </div>
      </CardContent>
    </Card>
  );

  switch (context) {
    case 'properties':
      return renderPropertyActions();
    case 'inspections':
      return renderInspectionActions();
    case 'audit':
      return renderAuditActions();
    default:
      return null;
  }
};