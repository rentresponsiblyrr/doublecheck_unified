import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { OptimizationSuggestion } from './types';

interface SuggestionCardProps {
  suggestion: OptimizationSuggestion;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion }) => {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Info className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-green-200 bg-green-50';
    }
  };

  return (
    <div
      id={`suggestion-card-${suggestion.id}`}
      className={`p-4 rounded-lg border-2 ${getPriorityColor(suggestion.priority)}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getPriorityIcon(suggestion.priority)}
          <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
        </div>
        <Badge variant="outline" className="ml-2">
          {suggestion.priority}
        </Badge>
      </div>

      <p className="text-gray-600 mb-3 text-sm">{suggestion.description}</p>

      <div className="mb-3">
        <p className="text-sm font-medium text-gray-700 mb-1">Expected Impact:</p>
        <p className="text-sm text-gray-600">{suggestion.impact}</p>
      </div>

      <div className="mb-3">
        <p className="text-sm font-medium text-gray-700 mb-2">Action Items:</p>
        <ul className="space-y-1">
          {suggestion.actionItems.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle className="w-3 h-3 mt-1 text-green-500 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-4">
          <span>💰 ROI: {suggestion.estimatedROI}%</span>
          <span>⏱️ Time: {suggestion.implementationTime}</span>
          <span>🎯 Difficulty: {suggestion.difficultyLevel}</span>
        </div>
      </div>
    </div>
  );
};