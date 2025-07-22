import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Database, 
  Cpu, 
  HardDrive, 
  Network, 
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';

interface SystemHealthMetrics {
  validationLatency: number;
  memoryUsage: number;
  errorRate: number;
  uptime: number;
  lastHealthCheck: Date;
  diskUsage?: number;
  cpuUsage?: number;
  networkLatency?: number;
  activeConnections?: number;
}

interface SecuritySystemHealthProps {
  systemHealth: SystemHealthMetrics;
  isLoading: boolean;
  showAdvancedMetrics?: boolean;
}

interface HealthMetricProps {
  label: string;
  value: string;
  percentage?: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  icon: React.ReactNode;
  description?: string;
}

const HealthMetricCard: React.FC<HealthMetricProps> = ({
  label,
  value,
  percentage,
  status,
  icon,
  description
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'good': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={`p-4 border rounded-lg ${getStatusColor(status)}`} id={`health-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon}
          <h4 className="font-medium text-sm">{label}</h4>
        </div>
        {getStatusIcon(status)}
      </div>
      
      <div className="space-y-2">
        <div className="text-lg font-bold">{value}</div>
        {percentage !== undefined && (
          <Progress value={percentage} className="h-2" />
        )}
        {description && (
          <p className="text-xs opacity-75">{description}</p>
        )}
      </div>
    </div>
  );
};

export const SecuritySystemHealth: React.FC<SecuritySystemHealthProps> = ({
  systemHealth,
  isLoading,
  showAdvancedMetrics = false
}) => {
  if (isLoading) {
    return (
      <Card id="system-health-loading">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading system health...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getLatencyStatus = (latency: number) => {
    if (latency < 50) return 'excellent';
    if (latency < 100) return 'good';
    if (latency < 200) return 'warning';
    return 'critical';
  };

  const getMemoryStatus = (usage: number) => {
    if (usage < 70) return 'excellent';
    if (usage < 85) return 'good';
    if (usage < 95) return 'warning';
    return 'critical';
  };

  const getErrorRateStatus = (rate: number) => {
    if (rate < 0.001) return 'excellent';
    if (rate < 0.01) return 'good';
    if (rate < 0.05) return 'warning';
    return 'critical';
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const coreMetrics = [
    {
      label: 'Validation Latency',
      value: `${systemHealth.validationLatency}ms`,
      percentage: Math.min((systemHealth.validationLatency / 200) * 100, 100),
      status: getLatencyStatus(systemHealth.validationLatency),
      icon: <Clock className="h-4 w-4" />,
      description: 'Average request processing time'
    },
    {
      label: 'Memory Usage',
      value: `${systemHealth.memoryUsage.toFixed(1)}MB`,
      percentage: systemHealth.memoryUsage,
      status: getMemoryStatus(systemHealth.memoryUsage),
      icon: <Database className="h-4 w-4" />,
      description: 'Security service memory consumption'
    },
    {
      label: 'Error Rate',
      value: `${(systemHealth.errorRate * 100).toFixed(3)}%`,
      percentage: systemHealth.errorRate * 100,
      status: getErrorRateStatus(systemHealth.errorRate),
      icon: <AlertTriangle className="h-4 w-4" />,
      description: 'Failed validation requests'
    },
    {
      label: 'System Uptime',
      value: formatUptime(systemHealth.uptime),
      status: systemHealth.uptime > 86400 ? 'excellent' : 'good',
      icon: <Activity className="h-4 w-4" />,
      description: 'Continuous operation time'
    }
  ];

  const advancedMetrics = showAdvancedMetrics ? [
    systemHealth.diskUsage !== undefined && {
      label: 'Disk Usage',
      value: `${systemHealth.diskUsage.toFixed(1)}%`,
      percentage: systemHealth.diskUsage,
      status: systemHealth.diskUsage < 80 ? 'good' : systemHealth.diskUsage < 90 ? 'warning' : 'critical',
      icon: <HardDrive className="h-4 w-4" />,
      description: 'Storage utilization'
    },
    systemHealth.cpuUsage !== undefined && {
      label: 'CPU Usage',
      value: `${systemHealth.cpuUsage.toFixed(1)}%`,
      percentage: systemHealth.cpuUsage,
      status: systemHealth.cpuUsage < 70 ? 'good' : systemHealth.cpuUsage < 85 ? 'warning' : 'critical',
      icon: <Cpu className="h-4 w-4" />,
      description: 'Processor utilization'
    },
    systemHealth.networkLatency !== undefined && {
      label: 'Network Latency',
      value: `${systemHealth.networkLatency}ms`,
      percentage: Math.min((systemHealth.networkLatency / 100) * 100, 100),
      status: getLatencyStatus(systemHealth.networkLatency),
      icon: <Network className="h-4 w-4" />,
      description: 'Network response time'
    }
  ].filter(Boolean) : [];

  const allMetrics = [...coreMetrics, ...advancedMetrics];

  return (
    <Card id="security-system-health">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>System Health</span>
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Last check: {systemHealth.lastHealthCheck.toLocaleTimeString()}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className={`grid gap-4 ${
          showAdvancedMetrics 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        }`}>
          {allMetrics.map((metric) => (
            <HealthMetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              percentage={metric.percentage}
              status={metric.status as 'excellent' | 'good' | 'warning' | 'critical'}
              icon={metric.icon}
              description={metric.description}
            />
          ))}
        </div>
        
        {systemHealth.activeConnections !== undefined && (
          <div className="mt-4 pt-4 border-t" id="active-connections-summary">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Connections</span>
              <Badge variant="secondary">
                {systemHealth.activeConnections} connections
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
