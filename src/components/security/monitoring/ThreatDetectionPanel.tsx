import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  XCircle, 
  Eye, 
  Shield, 
  FileX, 
  Network, 
  Database,
  Activity
} from 'lucide-react';

interface SecurityThreat {
  id: string;
  type: 'malware' | 'phishing' | 'brute_force' | 'injection' | 'xss' | 'csrf';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  source: string;
  timestamp: Date;
  status: 'detected' | 'blocked' | 'investigating';
  affectedResource?: string;
}

interface ThreatDetectionPanelProps {
  threats: SecurityThreat[];
  isLoading: boolean;
  onThreatResponse: (threatId: string, action: 'block' | 'allow' | 'investigate') => void;
  onThreatDetails: (threat: SecurityThreat) => void;
}

export const ThreatDetectionPanel: React.FC<ThreatDetectionPanelProps> = ({
  threats,
  isLoading,
  onThreatResponse,
  onThreatDetails
}) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'active'>('all');

  const filteredThreats = threats.filter(threat => {
    if (filter === 'all') return true;
    if (filter === 'critical') return threat.severity === 'critical';
    if (filter === 'high') return threat.severity === 'high';
    if (filter === 'active') return threat.status === 'detected';
    return true;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'outline';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'detected': return 'destructive';
      case 'blocked': return 'secondary';
      case 'investigating': return 'outline';
      default: return 'secondary';
    }
  };

  const getThreatIcon = (type: string) => {
    switch (type) {
      case 'malware': return <FileX className="h-4 w-4 text-red-500" />;
      case 'phishing': return <Eye className="h-4 w-4 text-orange-500" />;
      case 'brute_force': return <Shield className="h-4 w-4 text-yellow-500" />;
      case 'injection': return <Database className="h-4 w-4 text-purple-500" />;
      case 'xss': return <Network className="h-4 w-4 text-blue-500" />;
      case 'csrf': return <Activity className="h-4 w-4 text-pink-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card id="threat-detection-loading">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading threat data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="threat-detection-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Threat Detection</span>
            <Badge variant="secondary">{threats.length}</Badge>
          </CardTitle>
          
          <div className="flex space-x-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              id="filter-all-threats"
            >
              All ({threats.length})
            </Button>
            <Button
              variant={filter === 'critical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('critical')}
              id="filter-critical-threats"
            >
              Critical ({threats.filter(t => t.severity === 'critical').length})
            </Button>
            <Button
              variant={filter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('active')}
              id="filter-active-threats"
            >
              Active ({threats.filter(t => t.status === 'detected').length})
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4" id="threats-list">
          {filteredThreats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {filter === 'all' ? 'No threats detected' : `No ${filter} threats found`}
            </div>
          ) : (
            filteredThreats.map((threat) => (
              <div
                key={threat.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                id={`threat-${threat.id}`}
              >
                <div className="flex items-start space-x-3">
                  {getThreatIcon(threat.type)}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{threat.description}</h4>
                      <Badge variant={getSeverityColor(threat.severity)}>
                        {threat.severity}
                      </Badge>
                      <Badge variant={getStatusColor(threat.status)}>
                        {threat.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>Source: {threat.source}</span>
                      <span>Type: {threat.type.replace('_', ' ')}</span>
                      <span>Time: {threat.timestamp.toLocaleTimeString()}</span>
                      {threat.affectedResource && (
                        <span>Resource: {threat.affectedResource}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onThreatDetails(threat)}
                    id={`view-threat-${threat.id}`}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  
                  {threat.status === 'detected' && (
                    <>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onThreatResponse(threat.id, 'block')}
                        id={`block-threat-${threat.id}`}
                      >
                        Block
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onThreatResponse(threat.id, 'investigate')}
                        id={`investigate-threat-${threat.id}`}
                      >
                        Investigate
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        {threats.filter(t => t.severity === 'critical' && t.status === 'detected').length > 0 && (
          <Alert variant="destructive" className="mt-4" id="critical-threat-alert">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {threats.filter(t => t.severity === 'critical' && t.status === 'detected').length} critical threats require immediate attention!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};