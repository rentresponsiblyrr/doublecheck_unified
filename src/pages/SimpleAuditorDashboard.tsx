import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Settings,
  Download
} from 'lucide-react';

// Simple, error-resistant Auditor Dashboard
export default function SimpleAuditorDashboard() {
  const mockMetrics = {
    totalInspections: 156,
    pendingReviews: 23,
    completedToday: 8,
    averageAccuracy: 87.3
  };

  const mockInspections = [
    {
      id: '1',
      property: 'Sunset Villa Resort',
      inspector: 'John Doe', 
      status: 'pending',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      property: 'Mountain View Lodge',
      inspector: 'Jane Smith',
      status: 'in_review', 
      createdAt: '2024-01-15T09:15:00Z'
    },
    {
      id: '3',
      property: 'Ocean Breeze Cottage',
      inspector: 'Mike Johnson',
      status: 'completed',
      createdAt: '2024-01-15T08:45:00Z'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600">Pending</Badge>;
      case 'in_review':
        return <Badge variant="outline" className="text-blue-600">In Review</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <ErrorBoundary 
      componentName="SimpleAuditorDashboard"
      showRetry={true}
      maxRetries={3}
    >
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Auditor Dashboard</h1>
            <p className="text-gray-600 mt-1">Review and manage property inspections</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inspections</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockMetrics.totalInspections}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockMetrics.pendingReviews}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockMetrics.completedToday}</div>
              <p className="text-xs text-muted-foreground">+3 from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockMetrics.averageAccuracy}%</div>
              <p className="text-xs text-muted-foreground">+2.1% improvement</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="inspections" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inspections">Inspections</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="inspections">
            <Card>
              <CardHeader>
                <CardTitle>Recent Inspections</CardTitle>
                <CardDescription>
                  Review and approve property inspections from field inspectors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockInspections.map((inspection) => (
                    <div key={inspection.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{inspection.property}</h3>
                        <p className="text-sm text-gray-600">Inspector: {inspection.inspector}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(inspection.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(inspection.status)}
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>
                  Performance metrics and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Analytics charts will be displayed here</p>
                    <p className="text-sm">Real-time performance data coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Inspection Reports</CardTitle>
                <CardDescription>
                  Generate and download inspection reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Report generation tools</p>
                    <p className="text-sm">PDF and Excel export options available</p>
                    <Button className="mt-4" variant="outline">
                      Generate Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </ErrorBoundary>
  );
}