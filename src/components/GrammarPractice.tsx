
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Target } from 'lucide-react';
import OptimizedGrammarTopics from './OptimizedGrammarTopics';
import OptimizedIntelligentPractice from './OptimizedIntelligentPractice';

const GrammarPractice = () => {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('topics');

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopicId(topicId);
    setActiveTab('practice');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <span>Grammar Topics & Practice</span>
          </CardTitle>
          <CardDescription>
            Explore comprehensive grammar topics and practice with intelligent exercises tailored to your level.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full mb-6 bg-white/80 backdrop-blur-sm shadow-sm">
          <TabsTrigger value="topics" className="flex items-center space-x-2 flex-1">
            <BookOpen className="h-4 w-4" />
            <span>Browse Topics</span>
          </TabsTrigger>
          <TabsTrigger value="practice" className="flex items-center space-x-2 flex-1" disabled={!selectedTopicId}>
            <Target className="h-4 w-4" />
            <span>Practice Session</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="topics" className="mt-0">
          <OptimizedGrammarTopics onTopicSelect={handleTopicSelect} />
        </TabsContent>

        <TabsContent value="practice" className="mt-0">
          {selectedTopicId ? (
            <OptimizedIntelligentPractice topicId={selectedTopicId} />
          ) : (
            <Card className="text-center p-12">
              <div className="text-gray-500">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">Select a Topic to Practice</h3>
                <p>Choose a grammar topic from the Topics tab to start your practice session.</p>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GrammarPractice;
