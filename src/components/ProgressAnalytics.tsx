
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Target, Clock, Brain, Calendar, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useIntelligentTutor } from '@/hooks/useIntelligentTutor';

interface SkillAnalytics {
  topic_name: string;
  skill_level: number;
  mastery_level: string;
  attempts_count: number;
  last_practiced: string;
  next_review_due: string;
  confidence_interval: number;
}

interface LearningMetrics {
  totalSessions: number;
  totalExercises: number;
  accuracyRate: number;
  averageTime: number;
  improvementRate: number;
  consistencyScore: number;
}

const ProgressAnalytics = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { assessmentData, getSpacedRepetitionTopics } = useIntelligentTutor();
  const [skillAnalytics, setSkillAnalytics] = useState<SkillAnalytics[]>([]);
  const [learningMetrics, setLearningMetrics] = useState<LearningMetrics | null>(null);
  const [spacedRepetitionTopics, setSpacedRepetitionTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSkillAnalytics(),
        loadLearningMetrics(),
        loadSpacedRepetitionData()
      ]);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSkillAnalytics = async () => {
    const { data } = await supabase
      .from('user_skills')
      .select(`
        skill_level,
        mastery_level,
        attempts_count,
        last_practiced,
        next_review_due,
        confidence_interval,
        grammar_topics(name)
      `)
      .eq('user_id', user?.id)
      .order('skill_level', { ascending: false });

    setSkillAnalytics(data?.map(skill => ({
      topic_name: skill.grammar_topics?.name || 'Unknown Topic',
      skill_level: skill.skill_level,
      mastery_level: skill.mastery_level,
      attempts_count: skill.attempts_count,
      last_practiced: skill.last_practiced,
      next_review_due: skill.next_review_due,
      confidence_interval: skill.confidence_interval
    })) || []);
  };

  const loadLearningMetrics = async () => {
    // Get practice sessions data
    const { data: sessions } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', user?.id);

    // Get exercise attempts data
    const { data: attempts } = await supabase
      .from('exercise_attempts')
      .select('*')
      .eq('user_id', user?.id)
      .order('attempted_at', { ascending: false });

    if (!sessions || !attempts) return;

    const totalSessions = sessions.length;
    const totalExercises = attempts.length;
    const correctAnswers = attempts.filter(a => a.is_correct).length;
    const accuracyRate = totalExercises > 0 ? (correctAnswers / totalExercises) * 100 : 0;
    
    const totalTime = attempts.reduce((acc, attempt) => acc + (attempt.time_taken_seconds || 0), 0);
    const averageTime = totalExercises > 0 ? totalTime / totalExercises : 0;

    // Calculate improvement rate (last 10 vs previous 10)
    const recentAttempts = attempts.slice(0, 10);
    const previousAttempts = attempts.slice(10, 20);
    const recentAccuracy = recentAttempts.length > 0 ? recentAttempts.filter(a => a.is_correct).length / recentAttempts.length : 0;
    const previousAccuracy = previousAttempts.length > 0 ? previousAttempts.filter(a => a.is_correct).length / previousAttempts.length : 0;
    const improvementRate = previousAccuracy > 0 ? ((recentAccuracy - previousAccuracy) / previousAccuracy) * 100 : 0;

    // Calculate consistency score (based on practice frequency)
    const practiceFrequency = calculatePracticeFrequency(attempts);
    const consistencyScore = Math.min(100, practiceFrequency * 20); // Score out of 100

    setLearningMetrics({
      totalSessions,
      totalExercises,
      accuracyRate,
      averageTime,
      improvementRate,
      consistencyScore
    });
  };

  const loadSpacedRepetitionData = async () => {
    const topics = await getSpacedRepetitionTopics();
    setSpacedRepetitionTopics(topics);
  };

  const calculatePracticeFrequency = (attempts: any[]) => {
    if (attempts.length === 0) return 0;
    
    const last30Days = attempts.filter(attempt => {
      const attemptDate = new Date(attempt.attempted_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return attemptDate > thirtyDaysAgo;
    });

    const uniqueDays = new Set(last30Days.map(attempt => 
      new Date(attempt.attempted_at).toDateString()
    )).size;

    return uniqueDays / 30; // Frequency as days practiced out of 30
  };

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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Learning Metrics */}
      {learningMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{learningMetrics.totalSessions}</div>
                  <div className="text-sm text-gray-600">Practice Sessions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{Math.round(learningMetrics.accuracyRate)}%</div>
                  <div className="text-sm text-gray-600">Accuracy Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className={`h-4 w-4 ${learningMetrics.improvementRate >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <div>
                  <div className="text-2xl font-bold">
                    {learningMetrics.improvementRate >= 0 ? '+' : ''}{Math.round(learningMetrics.improvementRate)}%
                  </div>
                  <div className="text-sm text-gray-600">Improvement</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{Math.round(learningMetrics.consistencyScore)}%</div>
                  <div className="text-sm text-gray-600">Consistency</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="skills" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="skills">Skill Analysis</TabsTrigger>
          <TabsTrigger value="schedule">Review Schedule</TabsTrigger>
          <TabsTrigger value="assessment">Assessment Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-blue-600" />
                <span>Skill Level Analysis</span>
              </CardTitle>
              <CardDescription>
                Your proficiency levels across different grammar topics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skillAnalytics.map((skill, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{skill.topic_name}</span>
                        <Badge className={getMasteryColor(skill.mastery_level)}>
                          {skill.mastery_level}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {Math.round(skill.skill_level * 100)}% ({skill.attempts_count} attempts)
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Progress value={skill.skill_level * 100} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Confidence: ±{Math.round(skill.confidence_interval * 100)}%</span>
                        <span>Last practiced: {skill.last_practiced ? formatTimeAgo(skill.last_practiced) : 'Never'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-600" />
                <span>Spaced Repetition Schedule</span>
              </CardTitle>
              <CardDescription>
                Topics due for review based on your learning pattern
              </CardDescription>
            </CardHeader>
            <CardContent>
              {spacedRepetitionTopics.length > 0 ? (
                <div className="space-y-3">
                  {spacedRepetitionTopics.map((topic, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div>
                        <div className="font-medium">{topic.grammar_topics?.name}</div>
                        <div className="text-sm text-gray-600">
                          Skill level: {Math.round(topic.skill_level * 100)}% • 
                          Last practiced: {formatTimeAgo(topic.last_practiced)}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        Due for review
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">All caught up!</h3>
                  <p className="text-gray-500">No topics are due for review right now.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-purple-600" />
                <span>Assessment Insights</span>
              </CardTitle>
              <CardDescription>
                Analysis based on your latest placement test results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assessmentData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{Math.round(assessmentData.score)}%</div>
                      <div className="text-sm text-blue-600">Overall Score</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{assessmentData.level}</div>
                      <div className="text-sm text-green-600">Recommended Level</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {new Date(assessmentData.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-purple-600">Assessment Date</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-green-700">Strengths</h4>
                      <div className="space-y-1">
                        {assessmentData.strengths.map((strength, index) => (
                          <Badge key={index} className="mr-2 mb-1 bg-green-100 text-green-800 border-green-200">
                            {strength}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-red-700">Areas for Improvement</h4>
                      <div className="space-y-1">
                        {assessmentData.weaknesses.map((weakness, index) => (
                          <Badge key={index} className="mr-2 mb-1 bg-red-100 text-red-800 border-red-200">
                            {weakness}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Assessment Data</h3>
                  <p className="text-gray-500 mb-4">Take a placement test to get personalized insights.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProgressAnalytics;
