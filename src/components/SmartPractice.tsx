
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, TrendingUp, BookOpen, Brain, CheckCircle, AlertCircle, Clock, Sparkles } from 'lucide-react';
import { useIntelligentTutor } from '@/hooks/useIntelligentTutor';
import { useUnifiedPractice } from '@/hooks/useUnifiedPractice';
import { supabase } from '@/integrations/supabase/client';
import LoadingState from './LoadingState';
import { PracticeCard } from '@/components/ui/practice-card';
import { StatsCard } from '@/components/ui/stats-card';
import ProgressAnalytics from './ProgressAnalytics';

interface SmartPracticeProps {
  onSelectTopic: (topicId: string) => void;
}

const SmartPractice: React.FC<SmartPracticeProps> = ({ onSelectTopic }) => {
  const { 
    topicRecommendations, 
    assessmentData, 
    loading: topicsLoading, 
    getTopicRecommendations,
    getSpacedRepetitionTopics
  } = useIntelligentTutor();
  
  const { 
    drillRecommendations, 
    loading: drillsLoading, 
    startDrill, 
    drillInProgress,
    currentDrill,
    exercises,
    currentExercise,
    userAnswer,
    selectedOption,
    showFeedback,
    exerciseResult,
    drillScore,
    setUserAnswer,
    setSelectedOption,
    submitAnswer,
    nextExercise,
    completeDrill
  } = useUnifiedPractice();
  
  const [activeSubTab, setActiveSubTab] = useState('personalized');
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);
  const [spacedRepetitionTopics, setSpacedRepetitionTopics] = useState<any[]>([]);

  useEffect(() => {
    // Load recommendations with assessment data
    getTopicRecommendations(true);
    checkAssessmentHistory();
    loadSpacedRepetitionTopics();
  }, []);

  const checkAssessmentHistory = async () => {
    try {
      const { data } = await supabase
        .from('assessment_results')
        .select('id')
        .limit(1);
      
      setHasCompletedAssessment(!!data && data.length > 0);
    } catch (error) {
      console.error('Error checking assessment history:', error);
    }
  };

  const loadSpacedRepetitionTopics = async () => {
    try {
      const topics = await getSpacedRepetitionTopics();
      setSpacedRepetitionTopics(topics);
    } catch (error) {
      console.error('Error loading spaced repetition topics:', error);
    }
  };

  const loading = topicsLoading || drillsLoading;

  const getMasteryColor = (mastery: string) => {
    switch (mastery) {
      case 'expert': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'advanced': return 'bg-green-100 text-green-800 border-green-200';
      case 'proficient': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'developing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'novice': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading && activeSubTab !== 'analytics') {
    return <LoadingState message="Analyzing your progress and creating intelligent recommendations..." />;
  }

  // If drill is in progress, show the drill interface
  if (drillInProgress && currentDrill && exercises.length > 0) {
    const currentExerciseData = exercises[currentExercise];
    
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader className="p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-500" />
                <span>{currentDrill.topic}</span>
                <Badge variant="outline" className="bg-purple-100 text-purple-800">
                  Adaptive
                </Badge>
              </CardTitle>
              <Badge variant="outline">{currentExercise + 1} of {exercises.length}</Badge>
            </div>
            <CardDescription>{currentDrill.description}</CardDescription>
            <Progress value={((currentExercise + 1) / exercises.length) * 100} className="mt-2" />
            <div className="text-sm text-gray-600">Score: {drillScore}/{currentExercise + (showFeedback ? 1 : 0)}</div>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg">{currentExerciseData.question}</h3>

              {currentExerciseData.type === 'multiple-choice' && currentExerciseData.options && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentExerciseData.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={selectedOption === option ? "default" : "outline"}
                      className="justify-start h-auto py-3 px-4"
                      onClick={() => setSelectedOption(option)}
                      disabled={showFeedback}
                    >
                      {String.fromCharCode(65 + index)}) {option}
                    </Button>
                  ))}
                </div>
              )}

              {currentExerciseData.type !== 'multiple-choice' && (
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  disabled={showFeedback}
                  className="w-full text-lg p-3 border border-gray-300 rounded-md"
                />
              )}
            </div>

            {showFeedback && exerciseResult && (
              <div className={`p-4 rounded-lg border ${exerciseResult.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  {exerciseResult.isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Target className="h-5 w-5 text-red-500" />
                  )}
                  <span className={`font-semibold ${exerciseResult.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {exerciseResult.isCorrect ? 'Excellent!' : 'Not quite right'}
                  </span>
                </div>
                <p className="text-sm mb-2">{exerciseResult.feedback}</p>
                <p className="text-xs text-gray-600">{currentExerciseData.explanation}</p>
                {exerciseResult.xpGained && (
                  <Badge className="mt-2 bg-yellow-100 text-yellow-700 border-yellow-200">
                    +{exerciseResult.xpGained} XP
                  </Badge>
                )}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={completeDrill}>
                Exit Practice
              </Button>
              <div className="space-x-2">
                {!showFeedback ? (
                  <Button onClick={submitAnswer} disabled={loading || (!userAnswer.trim() && !selectedOption)}>
                    {loading ? 'Analyzing...' : 'Submit Answer'}
                  </Button>
                ) : (
                  <Button onClick={nextExercise}>
                    {currentExercise === exercises.length - 1 ? 'Complete Practice' : 'Next Exercise'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const highPriorityTopics = topicRecommendations.filter(topic => topic.priority === 'high');
  const assessmentDrivenTopics = topicRecommendations.filter(topic => topic.assessment_driven);
  const aiDrills = drillRecommendations.filter(drill => drill.source === 'ai');
  const completedDrills = drillRecommendations.filter(drill => drill.completed);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Assessment-driven insights banner */}
      {assessmentData && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Sparkles className="h-8 w-8 text-blue-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-blue-800 mb-1">
                  Intelligent Recommendations Active
                </h3>
                <p className="text-blue-600 text-sm mb-3">
                  Based on your {Math.round(assessmentData.score)}% assessment score, we've identified {assessmentData.weaknesses.length} areas for improvement and optimized your learning path.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    Level: {assessmentData.level}
                  </Badge>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {assessmentData.strengths.length} Strengths
                  </Badge>
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    {assessmentData.weaknesses.length} Focus Areas
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show assessment prompt if no assessment completed */}
      {!hasCompletedAssessment && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Target className="h-8 w-8 text-purple-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-purple-800 mb-1">
                  Unlock Intelligent Learning
                </h3>
                <p className="text-purple-600 text-sm mb-3">
                  Take a quick assessment to activate AI-powered recommendations, adaptive difficulty, and personalized learning paths.
                </p>
                <Button 
                  onClick={() => window.location.hash = '#assessment'}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Take 5-Minute Assessment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="AI Recommendations"
          value={assessmentDrivenTopics.length}
          icon={Brain}
          variant="blue"
        />
        <StatsCard
          title="Priority Topics"
          value={highPriorityTopics.length}
          icon={Target}
          variant="red"
        />
        <StatsCard
          title="Review Due"
          value={spacedRepetitionTopics.length}
          icon={Clock}
          variant="purple"
        />
        <StatsCard
          title="Completed"
          value={completedDrills.length}
          icon={CheckCircle}
          variant="green"
        />
      </div>

      {/* Main Content */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="w-full bg-white/80 backdrop-blur-sm border">
          <TabsTrigger value="personalized" className="flex items-center space-x-2 flex-1">
            <Brain className="h-4 w-4" />
            <span>Smart Practice</span>
          </TabsTrigger>
          <TabsTrigger value="topics" className="flex items-center space-x-2 flex-1">
            <BookOpen className="h-4 w-4" />
            <span>Topic Focus</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2 flex-1">
            <TrendingUp className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personalized" className="mt-6">
          <div className="space-y-6">
            {/* Spaced Repetition Section */}
            {spacedRepetitionTopics.length > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="p-6">
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span>Due for Review</span>
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                      Spaced Repetition
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Topics optimally scheduled for review based on your learning pattern
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {spacedRepetitionTopics.slice(0, 4).map((topic) => (
                      <PracticeCard
                        key={topic.id}
                        title={topic.grammar_topics?.name || 'Unknown Topic'}
                        description={`Review due - Last practiced ${Math.floor((new Date().getTime() - new Date(topic.last_practiced).getTime()) / (1000 * 60 * 60 * 24))} days ago`}
                        level={`${Math.round(topic.skill_level * 100)}% mastery`}
                        priority="normal"
                        onAction={() => onSelectTopic(topic.topic_id)}
                        actionLabel="Review Now"
                        variant="topic"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI-Powered Drills */}
            <Card>
              <CardHeader className="p-6">
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <span>Intelligent Practice Drills</span>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                    Adaptive AI
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Dynamically generated practice sessions with adaptive difficulty
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {aiDrills.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {aiDrills.map((drill) => (
                      <PracticeCard
                        key={drill.id}
                        title={drill.topic}
                        description={drill.description}
                        level={drill.level}
                        difficulty={drill.difficulty}
                        estimatedTime={drill.estimatedTime}
                        priority={drill.priority}
                        reason={drill.reason}
                        onAction={() => startDrill(drill)}
                        actionLabel="Start Adaptive Practice"
                        variant="ai"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Brain className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      {hasCompletedAssessment ? 'Building Your AI Recommendations' : 'Ready for Intelligent Learning?'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {hasCompletedAssessment 
                        ? 'Complete some practice sessions to unlock more AI-powered recommendations!'
                        : 'Take a quick assessment to activate personalized AI recommendations!'
                      }
                    </p>
                    <div className="flex gap-3 justify-center">
                      {!hasCompletedAssessment && (
                        <Button 
                          onClick={() => window.location.hash = '#assessment'}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Take Assessment
                        </Button>
                      )}
                      <Button onClick={() => onSelectTopic('')} variant="outline">
                        Explore Topics
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="topics" className="mt-6">
          <Card>
            <CardHeader className="p-6">
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span>Intelligent Topic Recommendations</span>
                {assessmentData && (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    Assessment-Driven
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Grammar topics prioritized by AI analysis of your performance and assessment results
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {topicRecommendations.length > 0 ? (
                <div className="space-y-4">
                  {topicRecommendations.slice(0, 8).map((topic) => (
                    <Card 
                      key={topic.id} 
                      className={`transition-all hover:shadow-md ${
                        topic.priority === 'high' ? 'ring-2 ring-red-200 bg-red-50' : 
                        topic.assessment_driven ? 'ring-2 ring-blue-200 bg-blue-50' : 'bg-white'
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {topic.priority === 'high' && <AlertCircle className="h-4 w-4 text-red-500" />}
                              {topic.assessment_driven && <Sparkles className="h-4 w-4 text-blue-500" />}
                              <h3 className="font-semibold text-lg">{topic.name}</h3>
                              <Badge 
                                variant="outline" 
                                className={
                                  topic.priority === 'high' ? 'bg-red-100 text-red-800 border-red-200' : 
                                  topic.assessment_driven ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                  'bg-gray-100 text-gray-800 border-gray-200'
                                }
                              >
                                {topic.priority} priority
                              </Badge>
                              {topic.assessment_driven && (
                                <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                  AI-Selected
                                </Badge>
                              )}
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
                                <span className="text-gray-500">Skill level:</span>
                                <span className="font-medium">{Math.round(topic.skill_level * 100)}%</span>
                              </div>
                              <Progress value={topic.skill_level * 100} className="h-2" />
                              
                              <p className="text-sm font-medium">
                                <span className={topic.assessment_driven ? 'text-blue-600' : topic.priority === 'high' ? 'text-red-600' : 'text-gray-600'}>
                                  {topic.reason}
                                </span>
                              </p>
                              
                              {topic.confidence_score && (
                                <p className="text-xs text-gray-500">
                                  Confidence: {Math.round(topic.confidence_score * 100)}%
                                  {topic.days_since_practice && ` • Last practiced: ${topic.days_since_practice} days ago`}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="ml-4">
                            <Button 
                              onClick={() => onSelectTopic(topic.id)}
                              size="sm"
                              variant={topic.priority === 'high' || topic.assessment_driven ? 'default' : 'outline'}
                              className={
                                topic.priority === 'high' ? 'bg-red-600 hover:bg-red-700' :
                                topic.assessment_driven ? 'bg-blue-600 hover:bg-blue-700' : ''
                              }
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
                  <p className="text-gray-500 mb-6">Complete an assessment to get intelligent topic recommendations!</p>
                  <Button onClick={() => window.location.hash = '#assessment'}>
                    Take Assessment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <ProgressAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartPractice;
