import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Rocket, 
  CheckCircle, 
  Calendar,
  Mail,
  Bell
} from 'lucide-react';

interface ComingSoonPageProps {
  title: string;
  description: string;
  features: string[];
  estimatedDate?: string;
  onNotifyMe?: () => void;
}

export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({
  title,
  description,
  features,
  estimatedDate = "Q2 2024",
  onNotifyMe
}) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Rocket className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            {description}
          </p>
          <Badge variant="secondary" className="text-sm">
            <Clock className="h-3 w-3 mr-1" />
            Coming {estimatedDate}
          </Badge>
        </div>

        {/* Features Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Planned Features
            </CardTitle>
            <CardDescription>
              Here's what we're building for you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Development Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Development Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Planning & Design</span>
                <Badge className="bg-green-100 text-green-800">Complete</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full w-full"></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Development</span>
                <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full w-3/4"></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Testing & Launch</span>
                <Badge variant="outline">Upcoming</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gray-400 h-2 rounded-full w-1/4"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Bell className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Want to be notified when this feature launches?
              </span>
            </div>
            <p className="text-xs text-blue-700 mb-3">
              We'll send you an email as soon as {title.toLowerCase()} is ready to use.
            </p>
            {onNotifyMe ? (
              <Button onClick={onNotifyMe} size="sm" variant="outline">
                <Mail className="h-3 w-3 mr-1" />
                Notify Me
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.open('mailto:support@doublecheckverified.com?subject=Feature Request Notification', '_blank')}
              >
                <Mail className="h-3 w-3 mr-1" />
                Contact Support
              </Button>
            )}
          </div>
          
          <p className="text-xs text-gray-500">
            Questions or feedback? We'd love to hear from you at{' '}
            <a 
              href="mailto:support@doublecheckverified.com" 
              className="text-blue-600 hover:underline"
            >
              support@doublecheckverified.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};