import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

export type AlertType = 'success' | 'warning' | 'error' | 'info';

export interface PropertyFormAlert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  details?: string[];
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface PropertyFormAlertsProps {
  alerts: PropertyFormAlert[];
  onDismiss?: (alertId: string) => void;
  className?: string;
}

export const PropertyFormAlerts: React.FC<PropertyFormAlertsProps> = ({
  alerts,
  onDismiss,
  className
}) => {
  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
        return <XCircle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (type: AlertType): "default" | "destructive" => {
    return type === 'error' ? 'destructive' : 'default';
  };

  const getAlertStyles = (type: AlertType) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'info':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      default:
        return '';
    }
  };

  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <div id="property-form-alerts-container" className={`space-y-3 ${className || ''}`}>
      {alerts.map((alert) => (
        <Alert 
          key={alert.id}
          id={`property-alert-${alert.id}`}
          variant={getAlertVariant(alert.type)}
          className={`${getAlertStyles(alert.type)} relative`}
        >
          <div id={`alert-content-${alert.id}`} className="flex items-start gap-3">
            <div id={`alert-icon-${alert.id}`} className="mt-0.5">
              {getAlertIcon(alert.type)}
            </div>
            
            <div id={`alert-body-${alert.id}`} className="flex-1">
              <div id={`alert-header-${alert.id}`} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{alert.title}</h4>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      alert.type === 'success' ? 'border-green-300 text-green-700' :
                      alert.type === 'warning' ? 'border-yellow-300 text-yellow-700' :
                      alert.type === 'error' ? 'border-red-300 text-red-700' :
                      'border-blue-300 text-blue-700'
                    }`}
                  >
                    {alert.type.toUpperCase()}
                  </Badge>
                </div>
                
                {onDismiss && (
                  <button
                    onClick={() => onDismiss(alert.id)}
                    className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                    aria-label="Dismiss alert"
                  >
                    ×
                  </button>
                )}
              </div>
              
              <AlertDescription className="mt-1">
                {alert.message}
              </AlertDescription>
              
              {alert.details && alert.details.length > 0 && (
                <div id={`alert-details-${alert.id}`} className="mt-2">
                  <details>
                    <summary className="text-xs cursor-pointer opacity-80 hover:opacity-100">
                      Show Details
                    </summary>
                    <ul className="mt-1 text-xs space-y-1 pl-4">
                      {alert.details.map((detail, index) => (
                        <li key={index} className="opacity-80">
                          • {detail}
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              )}
              
              {alert.action && (
                <div id={`alert-action-${alert.id}`} className="mt-3">
                  <button
                    onClick={alert.action.onClick}
                    className="text-xs px-3 py-1 bg-opacity-20 bg-current rounded hover:bg-opacity-30 transition-colors"
                  >
                    {alert.action.label}
                  </button>
                </div>
              )}
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
};

// Utility functions for creating common alerts
export const createSuccessAlert = (
  id: string,
  title: string,
  message: string,
  details?: string[]
): PropertyFormAlert => ({
  id,
  type: 'success',
  title,
  message,
  details
});

export const createWarningAlert = (
  id: string,
  title: string,
  message: string,
  details?: string[]
): PropertyFormAlert => ({
  id,
  type: 'warning',
  title,
  message,
  details
});

export const createErrorAlert = (
  id: string,
  title: string,
  message: string,
  details?: string[]
): PropertyFormAlert => ({
  id,
  type: 'error',
  title,
  message,
  details
});

export const createInfoAlert = (
  id: string,
  title: string,
  message: string,
  details?: string[]
): PropertyFormAlert => ({
  id,
  type: 'info',
  title,
  message,
  details
});

export default PropertyFormAlerts;