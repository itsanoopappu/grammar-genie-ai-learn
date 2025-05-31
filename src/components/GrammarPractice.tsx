import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { BookOpen, ChevronRight, Target, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import IntelligentPractice from './IntelligentPractice';

interface GrammarTopic {
  id: string;
  name: string;
  description: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  category: string;
  difficulty_score: number;
  prerequisites: string[];
  learning_objectives: string[];
  common_errors: string[];
}

const GrammarPractice = () => {
  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<GrammarTopic | null>(null);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('grammar-topics', {
        body: { action: 'get_topics' }
      });

      if (error) throw error;
      setTopics(data.topics);
    } catch (err) {
      setError('Failed to load grammar topics');
      console.error('Error fetching topics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group topics by level and category
  const groupedTopics = topics.reduce((acc, topic) => {
    const level = topic.level;
    if (!acc[level]) {
      acc[level] = {};
    }
    if (!acc[level][topic.category]) {
      acc[level][topic.category] = [];
    }
    acc[level][topic.category].push(topic);
    return acc;
  }, {} as Record<string, Record<string, GrammarTopic[]>>);

  const renderTopicCard = (topic: GrammarTopic) => (
    <Card 
      key={topic.id}
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setSelectedTopic(topic)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-medium">{topic.name}</h4>
            <p className="text-sm text-gray-600">{topic.description}</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline">{topic.level}</Badge>
              <Badge variant="secondary">Difficulty: {topic.difficulty_score}/100</Badge>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}
      </div>
    );
  }

  if (selectedTopic) {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedTopic(null)}
          className="mb-4"
        >
          ← Back to Topics
        </Button>
        <IntelligentPractice topicId={selectedTopic.id} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedTopics).map(([level, categories]) => (
        <Card key={level}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <span>Level {level}</span>
            </CardTitle>
            <CardDescription>
              {level.startsWith('A') ? 'Basic/Elementary Level' :
               level.startsWith('B') ? 'Intermediate Level' :
               'Advanced Level'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-full">
              {Object.entries(categories).map(([category, topicList]) => (
                <div key={category} className="mb-6 last:mb-0">
                  <h3 className="text-lg font-semibold text-blue-700 mb-3">{category}</h3>
                  <div className="grid gap-4">
                    {topicList.map(topic => renderTopicCard(topic))}
                  </div>
                  <Separator className="my-6" />
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default GrammarPractice;