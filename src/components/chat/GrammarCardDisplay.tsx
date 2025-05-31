import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Lightbulb, AlertTriangle, ArrowRight } from 'lucide-react';

interface GrammarCardProps {
  topic: string;
  level?: string;
  explanation: string;
  examples?: string[];
  situations?: Array<{
    context: string;
    usage: string;
  }>;
  rulesChange?: Array<{
    situation: string;
    newRule: string;
  }>;
}

const GrammarCardDisplay: React.FC<GrammarCardProps> = ({
  topic,
  level = 'A1',
  explanation,
  examples = [],
  situations = [],
  rulesChange = []
}) => {
  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <CardTitle>{topic}</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            Level {level}
          </Badge>
        </div>
        <CardDescription className="text-blue-600">
          Understanding when and how to use this grammar point
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Basic Explanation */}
        <div className="bg-white/80 rounded-lg p-4">
          <p className="text-gray-700">{explanation}</p>
        </div>

        {/* Examples */}
        {examples.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center text-blue-700">
              <Lightbulb className="h-4 w-4 mr-2" />
              Examples
            </h4>
            <ul className="space-y-2">
              {examples.map((example, index) => (
                <li key={index} className="bg-white/60 rounded p-2 text-gray-700">
                  {example}
                </li>
              ))}
            </ul>
          </div>
        )}

        {situations.length > 0 && (
          <>
            <Separator className="my-4" />

            {/* Usage Situations */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center text-blue-700">
                <BookOpen className="h-4 w-4 mr-2" />
                When to Use
              </h4>
              {situations.map((situation, index) => (
                <div key={index} className="bg-white/60 rounded-lg p-3">
                  <p className="font-medium text-blue-800 mb-1">{situation.context}</p>
                  <p className="text-gray-600">{situation.usage}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Rules Changes */}
        {rulesChange && rulesChange.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center text-orange-700">
                <AlertTriangle className="h-4 w-4 mr-2" />
                How Rules Change
              </h4>
              {rulesChange.map((change, index) => (
                <div key={index} className="bg-white/60 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <div className="flex-1">
                      <p className="font-medium text-orange-800 mb-1">
                        When: {change.situation}
                      </p>
                      <div className="flex items-center text-gray-600">
                        <ArrowRight className="h-4 w-4 mr-2 text-orange-500" />
                        {change.newRule}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GrammarCardDisplay;