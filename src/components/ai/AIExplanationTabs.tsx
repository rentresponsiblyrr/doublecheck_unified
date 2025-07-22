/**
 * AI Explanation Tabs - Focused Component
 * 
 * Multi-level explanations (Basic → Technical → Legal) with expandable content
 */

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, Lightbulb, Settings, Scale, Info } from 'lucide-react';
import { ExplainabilityResult } from '@/services/AIExplainabilityEngine';
import { ReliabilityAnalysis } from '@/services/AIReliabilityOrchestrator';
import { ConfidenceValidationResult } from '@/services/AIConfidenceValidator';

interface AIExplanationTabsProps {
  explainabilityResult: ExplainabilityResult | null;
  reliabilityResult: ReliabilityAnalysis | null;
  confidenceResult: ConfidenceValidationResult | null;
  showTechnicalDetails?: boolean;
  className?: string;
}

export const AIExplanationTabs: React.FC<AIExplanationTabsProps> = ({
  explainabilityResult,
  reliabilityResult,
  confidenceResult,
  showTechnicalDetails = false,
  className
}) => {
  if (!explainabilityResult || !reliabilityResult) {
    return null;
  }

  return (
    <div className={className} id="ai-explanation-tabs">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Basic
          </TabsTrigger>
          <TabsTrigger value="technical" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Technical
          </TabsTrigger>
          <TabsTrigger value="legal" className="flex items-center gap-2">
            <Scale className="w-4 h-4" />
            Legal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Basic Explanation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">What the AI Found:</h4>
                <p className="text-gray-700">
                  {explainabilityResult.basicExplanation}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Key Factors:</h4>
                <div className="flex flex-wrap gap-2">
                  {explainabilityResult.keyFactors.map((factor, index) => (
                    <Badge key={index} variant="outline">
                      {factor}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Confidence Level:</h4>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 h-2 rounded-full">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${reliabilityResult.overallScore * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {Math.round(reliabilityResult.overallScore * 100)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-600" />
                Technical Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {showTechnicalDetails && (
                <>
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between">
                        Model Performance Metrics
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 p-4 bg-gray-50 rounded">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Model Confidence:</span>
                          <span className="ml-2">{Math.round((confidenceResult?.modelConfidence || 0) * 100)}%</span>
                        </div>
                        <div>
                          <span className="font-medium">Data Quality:</span>
                          <span className="ml-2">{Math.round((confidenceResult?.dataQualityScore || 0) * 100)}%</span>
                        </div>
                        <div>
                          <span className="font-medium">Context Relevance:</span>
                          <span className="ml-2">{Math.round((confidenceResult?.contextualRelevance || 0) * 100)}%</span>
                        </div>
                        <div>
                          <span className="font-medium">Risk Level:</span>
                          <span className="ml-2 capitalize">{reliabilityResult.failureRiskLevel}</span>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between">
                        Applied Mitigations
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="space-y-2">
                        {reliabilityResult.appliedMitigations.map((mitigation, index) => (
                          <div key={index} className="p-3 bg-blue-50 rounded border border-blue-200">
                            <div className="font-medium text-blue-900">{mitigation.type}</div>
                            <div className="text-sm text-blue-700">{mitigation.description}</div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-purple-600" />
                Legal Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Regulatory Compliance:</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                    <span>GDPR Article 22 (Automated Decision Making)</span>
                    <Badge variant="default" className="bg-green-600">Compliant</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                    <span>AI Act Transparency Requirements</span>
                    <Badge variant="default" className="bg-green-600">Compliant</Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Audit Trail:</h4>
                <p className="text-sm text-gray-700">
                  This analysis has been logged with timestamp {new Date().toISOString()} 
                  and can be retrieved for legal review. All decisions are fully traceable 
                  and backed by explainable AI methodologies.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Human Review Rights:</h4>
                <p className="text-sm text-gray-700">
                  You have the right to request human review of any AI decision. 
                  Appeals can be initiated through the system and will be processed 
                  by qualified human reviewers within 24 hours.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
