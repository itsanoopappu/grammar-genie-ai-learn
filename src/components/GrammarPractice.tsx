
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import OptimizedGrammarTopics from './OptimizedGrammarTopics';
import OptimizedIntelligentPractice from './OptimizedIntelligentPractice';

const GrammarPractice = () => {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopicId(topicId);
  };

  const handleBackToTopics = () => {
    setSelectedTopicId(null);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <span>Grammar Practice</span>
          </CardTitle>
          <CardDescription>
            {selectedTopicId ? 'Practice exercises for the selected grammar topic' : 'Choose a grammar topic to start practicing'}
          </CardDescription>
        </CardHeader>
      </Card>

      {selectedTopicId ? (
        <OptimizedIntelligentPractice 
          topicId={selectedTopicId} 
          onBackToTopics={handleBackToTopics}
        />
      ) : (
        <OptimizedGrammarTopics onTopicSelect={handleTopicSelect} />
      )}
    </div>
  );
};

export default GrammarPractice;
