
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useIntelligentTutor } from '@/hooks/useIntelligentTutor';
import { Target, TrendingUp, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';

interface TopicRecommendationsProps {
  onSelectTopic: (topicId: string) => void;
}

const TopicRecommendations: React.FC<TopicRecommendationsProps> = ({ onSelectTopic }) => {
  const { topicRecommendations, loading, getTopicRecommendations } = useIntelligentTutor();

  React.useEffect(() => {
    getTopicRecommendations();
  }, []);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'normal':
        return <Target className="h-4 w-4 text-blue-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <BookOpen className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMasteryColor = (mastery: string) => {
    switch (mastery) {
      case 'expert':
        return 'bg-purple-100 text-purple-800';
      case 'advanced':
        return 'bg-green-100 text-green-800';
      case 'proficient':
        return 'bg-blue-100 text-blue-800';
      case 'developing':
        return 'bg-yellow-100 text-yellow-800';
      case 'novice':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Analyzing your progress...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span>Personalized Topic Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Based on your performance and learning patterns, here are topics tailored for you:
          </p>
          
          <div className="grid gap-4">
            {topicRecommendations.slice(0, 8).map((topic) => (
              <Card 
                key={topic.id} 
                className={`transition-all hover:shadow-md ${
                  topic.priority === 'high' ? 'ring-2 ring-red-200' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getPriorityIcon(topic.priority)}
                        <h3 className="font-semibold text-lg">{topic.name}</h3>
                        <Badge variant="outline" className={getPriorityColor(topic.priority)}>
                          {topic.priority} priority
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{topic.description}</p>
                      
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">Category:</span>
                          <Badge variant="secondary">{topic.category}</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">Level:</span>
                          <Badge variant="outline">{topic.level}</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">Mastery:</span>
                          <Badge className={getMasteryColor(topic.mastery_level)}>
                            {topic.mastery_level}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Your skill level:</span>
                          <span className="font-medium">{Math.round(topic.skill_level * 100)}%</span>
                        </div>
                        <Progress value={topic.skill_level * 100} className="h-2" />
                        
                        <p className="text-sm text-blue-600 font-medium">{topic.reason}</p>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Button 
                        onClick={() => onSelectTopic(topic.id)}
                        size="sm"
                        variant={topic.priority === 'high' ? 'default' : 'outline'}
                      >
                        Practice
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {topicRecommendations.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">
                Complete a placement test to get personalized recommendations!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TopicRecommendations;
