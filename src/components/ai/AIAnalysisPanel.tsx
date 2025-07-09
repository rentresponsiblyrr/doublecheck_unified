import React from 'react';

interface AIAnalysisResult {
  confidence: number;
  status: 'pass' | 'fail' | 'review';
  reasoning: string;
  suggestedActions?: string[];
}

interface AIAnalysisPanelProps {
  result?: AIAnalysisResult;
  isLoading?: boolean;
  onOverride?: (newStatus: string) => void;
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ 
  result, 
  isLoading, 
  onOverride 
}) => {
  if (isLoading) {
    return (
      <div className="ai-analysis-panel border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">AI Analysis</h3>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Analyzing...</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="ai-analysis-panel border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">AI Analysis</h3>
        <p className="text-gray-500">No analysis available</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800';
      case 'fail': return 'bg-red-100 text-red-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="ai-analysis-panel border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">AI Analysis</h3>
      
      <div className="space-y-4">
        {/* Status and Confidence */}
        <div className="flex items-center justify-between">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(result.status)}`}>
            {result.status.toUpperCase()}
          </span>
          <div className="text-right">
            <div className="text-sm text-gray-600">Confidence</div>
            <div className="text-lg font-semibold">{Math.round(result.confidence * 100)}%</div>
          </div>
        </div>

        {/* Confidence Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              result.confidence >= 0.8 ? 'bg-green-500' :
              result.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${result.confidence * 100}%` }}
          ></div>
        </div>

        {/* Reasoning */}
        <div>
          <h4 className="font-medium mb-2">AI Reasoning</h4>
          <p className="text-sm text-gray-700">{result.reasoning}</p>
        </div>

        {/* Suggested Actions */}
        {result.suggestedActions && result.suggestedActions.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Suggested Actions</h4>
            <ul className="list-disc list-inside space-y-1">
              {result.suggestedActions.map((action, index) => (
                <li key={index} className="text-sm text-gray-600">{action}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Override Options */}
        {onOverride && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Override Decision</h4>
            <div className="flex space-x-2">
              <button 
                onClick={() => onOverride('pass')}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                Pass
              </button>
              <button 
                onClick={() => onOverride('fail')}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                Fail
              </button>
              <button 
                onClick={() => onOverride('review')}
                className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
              >
                Review
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysisPanel;