
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Target, TrendingUp } from 'lucide-react';
import GrammarTopics from './GrammarTopics';
import OptimizedIntelligentPractice from './OptimizedIntelligentPractice';
import DrillRecommendations from './DrillRecommendations';

const GrammarPractice = () => {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('topics');

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopicId(topicId);
    setActiveTab('practice');
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-blue-500" />
            <span>Grammar Practice</span>
          </CardTitle>
          <CardDescription>
            Master English grammar with personalized exercises and intelligent recommendations.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full mb-6">
          <TabsTrigger value="topics" className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>Topics</span>
          </TabsTrigger>
          <TabsTrigger value="practice" className="flex items-center space-x-2" disabled={!selectedTopicId}>
            <Target className="h-4 w-4" />
            <span>Practice</span>
          </TabsTrigger>
          <TabsTrigger value="drills" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Recommended Drills</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="topics">
          <GrammarTopics onTopicSelect={handleTopicSelect} />
        </TabsContent>

        <TabsContent value="practice">
          {selectedTopicId ? (
            <OptimizedIntelligentPractice topicId={selectedTopicId} />
          ) : (
            <div className="text-center text-gray-500 p-8">
              Please select a topic from the Topics tab to start practicing.
            </div>
          )}
        </TabsContent>

        <TabsContent value="drills">
          <DrillRecommendations />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GrammarPractice;
