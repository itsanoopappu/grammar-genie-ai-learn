
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookOpen, ChevronRight, MessageCircle, Target } from 'lucide-react';
import { useTopics } from '@/hooks/useTopics';
import LoadingState from './LoadingState';
import ErrorDisplay from './ErrorDisplay';

interface OptimizedGrammarTopicsProps {
  onTopicSelect: (topicId: string) => void;
}

const OptimizedGrammarTopics: React.FC<OptimizedGrammarTopicsProps> = ({ onTopicSelect }) => {
  const { data: topics = [], isLoading, error, refetch } = useTopics();

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
  }, {} as Record<string, Record<string, any[]>>);

  if (isLoading) {
    return <LoadingState message="Loading grammar topics..." />;
  }

  if (error) {
    return <ErrorDisplay error={error.message} onRetry={refetch} />;
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
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => onTopicSelect(topic.id)}
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
                                  onTopicSelect(topic.id);
                                }}
                              >
                                <Target className="h-4 w-4" />
                                <span className="sr-only">Practice</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
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

export default OptimizedGrammarTopics;
