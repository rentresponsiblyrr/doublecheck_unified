import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Database, Server, Zap } from 'lucide-react';
import { productionDb } from '@/services/productionDatabaseService';
import { logger } from '@/lib/utils/logger';

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  responseTime?: number;
  details?: Record<string, any>;
}

interface ProductionHealthCheckProps {
  className?: string;
}

export const ProductionHealthCheck: React.FC<ProductionHealthCheckProps> = ({ className }) => {
  const [healthChecks, setHealthChecks] = useState<HealthCheckResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const runHealthChecks = async () => {
    setIsChecking(true);
    const checks: HealthCheckResult[] = [];

    try {
      // Database connectivity check
      const dbStart = Date.now();
      try {
        const { data: properties } = await productionDb.getProperties();
        const dbTime = Date.now() - dbStart;
        checks.push({
          service: 'Database Connection',
          status: 'healthy',
          message: `Connected successfully. Found ${properties?.length || 0} properties.`,
          responseTime: dbTime,
          details: { propertyCount: properties?.length }
        });
      } catch (error) {
        checks.push({
          service: 'Database Connection',
          status: 'error',
          message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: { error: error instanceof Error ? error.stack : error }
        });
      }

      // Authentication check
      try {
        const { data: { user } } = await productionDb.getCurrentUser();
        checks.push({
          service: 'Authentication',
          status: user ? 'healthy' : 'warning',
          message: user ? `Authenticated as ${user.email}` : 'No user authenticated',
          details: { userId: user?.id, email: user?.email }
        });
      } catch (error) {
        checks.push({
          service: 'Authentication',
          status: 'error',
          message: `Auth check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }

      // User permissions check
      try {
        const { data: users } = await productionDb.getUsers();
        checks.push({
          service: 'User Permissions',
          status: 'healthy',
          message: `Can access user data. Found ${users?.length || 0} users.`,
          details: { userCount: users?.length }
        });
      } catch (error) {
        checks.push({
          service: 'User Permissions',
          status: 'error',
          message: `User permission check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }

      // Static safety items check
      try {
        const { data: items } = await productionDb.getStaticSafetyItems();
        checks.push({
          service: 'Static Safety Items',
          status: 'healthy',
          message: `Found ${items?.length || 0} checklist items.`,
          details: { itemCount: items?.length }
        });
      } catch (error) {
        checks.push({
          service: 'Static Safety Items',
          status: 'error',
          message: `Safety items check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }

      setHealthChecks(checks);
      setLastCheck(new Date());
      logger.info('Health check completed', { checks });
    } catch (error) {
      logger.error('Health check failed', error);
      checks.push({
        service: 'System Health',
        status: 'error',
        message: `System health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      setHealthChecks(checks);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  const getStatusIcon = (status: HealthCheckResult['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: HealthCheckResult['status']) => {
    const variants = {
      healthy: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={variants[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const overallStatus = healthChecks.every(check => check.status === 'healthy') 
    ? 'healthy' 
    : healthChecks.some(check => check.status === 'error') 
    ? 'error' 
    : 'warning';

  return (
    <div id="production-health-check-container" className={className}>
      <Card id="health-check-card">
        <CardHeader id="health-check-header" className="pb-3">
          <div id="health-check-title-row" className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Production Health Check
            </CardTitle>
            <div id="health-check-actions" className="flex items-center gap-2">
              {getStatusBadge(overallStatus)}
              <Button
                onClick={runHealthChecks}
                disabled={isChecking}
                size="sm"
                variant="outline"
              >
                {isChecking ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {isChecking ? 'Checking...' : 'Refresh'}
              </Button>
            </div>
          </div>
          {lastCheck && (
            <p className="text-sm text-muted-foreground">
              Last checked: {lastCheck.toLocaleString()}
            </p>
          )}
        </CardHeader>
        <CardContent id="health-check-content">
          <div id="health-check-results" className="space-y-4">
            {healthChecks.map((check, index) => (
              <div key={index} id={`health-check-item-${index}`} className="flex items-start gap-3 p-3 border rounded-lg">
                <div id={`health-check-icon-${index}`} className="mt-0.5">
                  {getStatusIcon(check.status)}
                </div>
                <div id={`health-check-details-${index}`} className="flex-1">
                  <div id={`health-check-service-${index}`} className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{check.service}</h4>
                    {check.responseTime && (
                      <Badge variant="outline" className="text-xs">
                        {check.responseTime}ms
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{check.message}</p>
                  {check.details && Object.keys(check.details).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer">
                        Technical Details
                      </summary>
                      <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(check.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>

          {overallStatus === 'error' && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Critical system issues detected. Some functionality may be unavailable.
                Contact system administrator if issues persist.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionHealthCheck;