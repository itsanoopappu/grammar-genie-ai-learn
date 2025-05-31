import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookOpen, ChevronRight, MessageCircle, Target, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GrammarTopic {
  id: string;
  name: string;
  description: string;
  level: string;
  category: string;
  difficulty_score: number;
  prerequisites: string[];
  learning_objectives: string[];
  common_errors: string[];
}

const GrammarTopics = () => {
  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {Object.entries(groupedTopics).map(([level, categories]) => (
        <Card key={level}>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span>Level {level}</span>
            </CardTitle>
            <CardDescription>
              {level.startsWith('A') ? 'Basic/Elementary Level' :
               level.startsWith('B') ? 'Intermediate Level' :
               'Advanced Level'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ScrollArea className="h-full pr-4">
              {Object.entries(categories).map(([category, topicList]) => (
                <div key={category} className="mb-6 last:mb-0">
                  <h3 className="text-lg font-semibold text-blue-700 mb-3">{category}</h3>
                  <div className="grid gap-2">
                    {topicList.map((topic) => (
                      <Card 
                        key={topic.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{topic.name}</h4>
                              <p className="text-sm text-gray-600">{topic.description}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <Badge variant="outline">{topic.level}</Badge>
                                <Badge variant="secondary">
                                  Difficulty: {topic.difficulty_score}/100
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Navigate to practice
                                }}
                              >
                                <Target className="h-4 w-4" />
                                <span className="sr-only">Practice</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Open chat with context
                                }}
                              >
                                <MessageCircle className="h-4 w-4" />
                                <span className="sr-only">Discuss</span>
                              </Button>
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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

export default GrammarTopics;