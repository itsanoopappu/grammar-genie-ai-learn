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
  return <div className="max-w-6xl mx-auto">
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        

        <TabsContent value="topics" className="mt-0">
          <OptimizedGrammarTopics onTopicSelect={handleTopicSelect} />
        </TabsContent>

        <TabsContent value="practice" className="mt-0">
          {selectedTopicId ? <OptimizedIntelligentPractice topicId={selectedTopicId} /> : <Card className="text-center p-12">
              <div className="text-gray-500">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">Select a Topic to Practice</h3>
                <p>Choose a grammar topic from the Topics tab to start your practice session.</p>
              </div>
            </Card>}
        </TabsContent>
      </Tabs>
    </div>;
};
export default GrammarPractice;