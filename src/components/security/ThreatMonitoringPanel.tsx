/**
 * Threat Monitoring Panel Component
 * Real-time threat detection and incident management
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Eye, RefreshCw, Bell, Activity } from 'lucide-react';

interface ThreatEvent {
  id: string;
  type: 'malware' | 'phishing' | 'brute_force' | 'data_breach' | 'ddos';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  source: string;
  description: string;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  affectedSystems: string[];
}

interface ThreatMonitoringPanelProps {
  threats: ThreatEvent[];
  onRefresh: () => void;
  onInvestigate: (threatId: string) => void;
  onResolve: (threatId: string) => void;
  isLoading?: boolean;
}

export const ThreatMonitoringPanel: React.FC<ThreatMonitoringPanelProps> = ({
  threats,
  onRefresh,
  onInvestigate,
  onResolve,
  isLoading = false
}) => {
  const [selectedThreat, setSelectedThreat] = useState<ThreatEvent | null>(null);

  const getSeverityColor = (severity: ThreatEvent['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
    }
  };

  const getSeverityBadge = (severity: ThreatEvent['severity']) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
    }
  };

  const getStatusBadge = (status: ThreatEvent['status']) => {
    switch (status) {
      case 'active':
        return 'destructive';
      case 'investigating':
        return 'secondary';
      case 'resolved':
        return 'default';
      case 'false_positive':
        return 'outline';
    }
  };

  const activeCriticalThreats = threats.filter(
    t => t.status === 'active' && t.severity === 'critical'
  );

  return (
    <div className="space-y-6">
      {/* Active Critical Threats Alert */}
      {activeCriticalThreats.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{activeCriticalThreats.length} critical threats</strong> require immediate attention.
            Security team has been automatically notified.
          </AlertDescription>
        </Alert>
      )}

      {/* Threat Monitoring Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real-time Threat Monitoring
              </CardTitle>
              <CardDescription>
                Live security event detection and incident management
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Alerts
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Threats List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Security Events ({threats.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {threats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No security threats detected</p>
              <p className="text-sm">System is secure</p>
            </div>
          ) : (
            <div className="space-y-4">
              {threats.map((threat) => (
                <div
                  key={threat.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedThreat(threat)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${getSeverityColor(threat.severity)}`} />
                        <h4 className="font-medium">{threat.type.replace('_', ' ').toUpperCase()}</h4>
                        <Badge variant={getSeverityBadge(threat.severity)}>
                          {threat.severity}
                        </Badge>
                        <Badge variant={getStatusBadge(threat.status)}>
                          {threat.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{threat.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Source: {threat.source}</span>
                        <span>Time: {new Date(threat.timestamp).toLocaleString()}</span>
                        <span>Systems: {threat.affectedSystems.length}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {threat.status === 'active' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onInvestigate(threat.id);
                            }}
                          >
                            Investigate
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onResolve(threat.id);
                            }}
                          >
                            Resolve
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Threat Details Modal/Panel would go here */}
      {selectedThreat && (
        <Card>
          <CardHeader>
            <CardTitle>Threat Details: {selectedThreat.id}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h5 className="font-medium mb-2">Affected Systems</h5>
                <div className="flex flex-wrap gap-2">
                  {selectedThreat.affectedSystems.map((system) => (
                    <Badge key={system} variant="outline">
                      {system}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="font-medium mb-2">Description</h5>
                <p className="text-sm text-gray-600">{selectedThreat.description}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedThreat(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};