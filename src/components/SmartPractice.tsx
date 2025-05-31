
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, TrendingUp, BookOpen, Brain, Zap, Award, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useIntelligentTutor } from '@/hooks/useIntelligentTutor';
import { useSmartPractice } from '@/hooks/useSmartPractice';
import { LoadingState } from './LoadingState';
import { ErrorDisplay } from './ErrorDisplay';

interface SmartPracticeProps {
  onSelectTopic: (topicId: string) => void;
}

const SmartPractice: React.FC<SmartPracticeProps> = ({ onSelectTopic }) => {
  const { topicRecommendations, loading: topicsLoading, getTopicRecommendations } = useIntelligentTutor();
  const { drillRecommendations, loading: drillsLoading, getDrillRecommendations, startDrill } = useSmartPractice();
  const [activeSubTab, setActiveSubTab] = useState('personalized');

  useEffect(() => {
    getTopicRecommendations();
    getDrillRecommendations();
  }, []);

  const loading = topicsLoading || drillsLoading;

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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return <LoadingState message="Analyzing your progress and creating personalized recommendations..." />;
  }

  const highPriorityTopics = topicRecommendations.filter(topic => topic.priority === 'high');
  const aiDrills = drillRecommendations.filter(drill => drill.source === 'ai');
  const completedDrills = drillRecommendations.filter(drill => drill.completed);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="flex items-center p-6">
            <Brain className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-800">{aiDrills.length}</div>
              <div className="text-sm text-blue-600">AI Recommendations</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="flex items-center p-6">
            <Target className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-red-800">{highPriorityTopics.length}</div>
              <div className="text-sm text-red-600">Priority Topics</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-green-800">{completedDrills.length}</div>
              <div className="text-sm text-green-600">Completed</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="flex items-center p-6">
            <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-purple-800">
                {completedDrills.length > 0 ? Math.round(completedDrills.reduce((acc, drill) => acc + (drill.score || 0), 0) / completedDrills.length) : 0}%
              </div>
              <div className="text-sm text-purple-600">Avg. Score</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="w-full bg-white/80 backdrop-blur-sm">
          <TabsTrigger value="personalized" className="flex items-center space-x-2 flex-1">
            <Brain className="h-4 w-4" />
            <span>Personalized for You</span>
          </TabsTrigger>
          <TabsTrigger value="topics" className="flex items-center space-x-2 flex-1">
            <BookOpen className="h-4 w-4" />
            <span>Topic Recommendations</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center space-x-2 flex-1">
            <Award className="h-4 w-4" />
            <span>Completed Practice</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personalized" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <span>AI-Powered Recommendations</span>
              </CardTitle>
              <CardDescription>
                Personalized drills based on your learning patterns and performance data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aiDrills.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {aiDrills.map((drill) => (
                    <Card key={drill.id} className="border-purple-200 bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700">{drill.level}</Badge>
                          <div className="flex items-center space-x-1">
                            <Zap className="h-4 w-4 text-purple-500" />
                            <Badge className={getDifficultyColor(drill.difficulty)}>
                              {drill.difficulty}
                            </Badge>
                          </div>
                        </div>
                        <CardTitle className="text-lg">{drill.topic}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-gray-600">{drill.description}</p>
                        {drill.reason && (
                          <p className="text-xs text-purple-600 italic bg-purple-50 p-2 rounded">{drill.reason}</p>
                        )}
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {drill.estimatedTime} minutes
                        </div>
                        <Button 
                          className="w-full bg-purple-600 hover:bg-purple-700" 
                          onClick={() => startDrill(drill)}
                        >
                          Start AI Practice
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Brain className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Building Your Profile</h3>
                  <p className="text-gray-500 mb-6">Complete some grammar topics or take an assessment to get personalized AI recommendations!</p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => onSelectTopic('')} variant="outline">
                      Explore Topics
                    </Button>
                    <Button onClick={() => window.location.hash = '#assessment'}>
                      Take Assessment
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span>Topic-Based Recommendations</span>
              </CardTitle>
              <CardDescription>
                Grammar topics prioritized based on your current level and learning objectives
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topicRecommendations.length > 0 ? (
                <div className="space-y-4">
                  {topicRecommendations.slice(0, 8).map((topic) => (
                    <Card 
                      key={topic.id} 
                      className={`transition-all hover:shadow-md ${
                        topic.priority === 'high' ? 'ring-2 ring-red-200 bg-red-50' : 'bg-white'
                      }`}
                    >
                      <CardContent className="p-6">
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
                              className={topic.priority === 'high' ? 'bg-red-600 hover:bg-red-700' : ''}
                            >
                              Practice
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Recommendations Yet</h3>
                  <p className="text-gray-500 mb-6">Complete a placement test to get personalized topic recommendations!</p>
                  <Button onClick={() => window.location.hash = '#assessment'}>
                    Take Assessment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-green-600" />
                <span>Completed Practice Sessions</span>
              </CardTitle>
              <CardDescription>
                Review your achievements and retake sessions for better scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedDrills.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedDrills.map((drill) => (
                    <Card key={drill.id} className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">{drill.level}</Badge>
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            {drill.score}%
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{drill.topic}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-gray-600">{drill.description}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {drill.estimatedTime} minutes
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full hover:bg-green-50"
                          onClick={() => startDrill(drill)}
                        >
                          Practice Again
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Completed Sessions Yet</h3>
                  <p className="text-gray-500 mb-6">Start practicing to see your completed sessions here!</p>
                  <Button onClick={() => setActiveSubTab('personalized')}>
                    Start Practicing
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartPractice;
