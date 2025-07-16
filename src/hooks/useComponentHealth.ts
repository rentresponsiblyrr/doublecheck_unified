import { useState, useEffect, useCallback } from 'react';

interface ComponentHealthCheck {
  name: string;
  path: string;
  isHealthy: boolean;
  lastChecked: Date;
  error?: string;
  renderTime?: number;
}

interface ComponentHealthData {
  components: ComponentHealthCheck[];
  overallHealth: 'healthy' | 'degraded' | 'critical';
  lastUpdated: Date;
}

export const useComponentHealth = () => {
  const [healthData, setHealthData] = useState<ComponentHealthData>({
    components: [],
    overallHealth: 'healthy',
    lastUpdated: new Date()
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkComponentHealth = useCallback(async (componentName: string, componentPath: string) => {
    const startTime = performance.now();
    
    try {
      // Simple component availability check
      const response = await fetch(componentPath, { 
        method: 'HEAD',
        mode: 'no-cors' // Prevent CORS issues
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      return {
        name: componentName,
        path: componentPath,
        isHealthy: true,
        lastChecked: new Date(),
        renderTime
      };
    } catch (error) {
      const endTime = performance.now();
      
      return {
        name: componentName,
        path: componentPath,
        isHealthy: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Component check failed',
        renderTime: endTime - startTime
      };
    }
  }, []);

  const runHealthCheck = useCallback(async () => {
    setIsChecking(true);
    
    const criticalComponents = [
      { name: 'User Management', path: '/admin/users' },
      { name: 'Audit Center', path: '/admin/audit' },
      { name: 'Checklist Management', path: '/admin/checklists' },
      { name: 'Inspection Management', path: '/admin/inspections' },
      { name: 'Property Management', path: '/admin/properties' }
    ];

    const healthChecks = await Promise.all(
      criticalComponents.map(comp => 
        checkComponentHealth(comp.name, comp.path)
      )
    );

    const unhealthyCount = healthChecks.filter(check => !check.isHealthy).length;
    const criticalUnhealthy = healthChecks.filter(check => 
      !check.isHealthy && ['User Management', 'Audit Center', 'Checklist Management'].includes(check.name)
    ).length;

    let overallHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (criticalUnhealthy > 0) {
      overallHealth = 'critical';
    } else if (unhealthyCount > 0) {
      overallHealth = 'degraded';
    }

    setHealthData({
      components: healthChecks,
      overallHealth,
      lastUpdated: new Date()
    });

    setIsChecking(false);
  }, [checkComponentHealth]);

  // Automated health checks every 30 seconds
  useEffect(() => {
    // Initial check
    runHealthCheck();

    // Set up interval for ongoing monitoring
    const interval = setInterval(runHealthCheck, 30000);
    
    return () => clearInterval(interval);
  }, [runHealthCheck]);

  // Component error reporting
  const reportComponentError = useCallback((componentName: string, error: Error) => {
    setHealthData(prev => ({
      ...prev,
      components: prev.components.map(comp => 
        comp.name === componentName 
          ? { 
              ...comp, 
              isHealthy: false, 
              error: error.message, 
              lastChecked: new Date() 
            }
          : comp
      ),
      overallHealth: prev.components.some(c => 
        ['User Management', 'Audit Center', 'Checklist Management'].includes(c.name) && !c.isHealthy
      ) ? 'critical' : 'degraded',
      lastUpdated: new Date()
    }));
  }, []);

  // Manual component recovery
  const markComponentHealthy = useCallback((componentName: string) => {
    setHealthData(prev => ({
      ...prev,
      components: prev.components.map(comp => 
        comp.name === componentName 
          ? { 
              ...comp, 
              isHealthy: true, 
              error: undefined, 
              lastChecked: new Date() 
            }
          : comp
      ),
      lastUpdated: new Date()
    }));
  }, []);

  return {
    healthData,
    isChecking,
    runHealthCheck,
    reportComponentError,
    markComponentHealthy
  };
};