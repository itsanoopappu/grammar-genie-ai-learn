
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, CheckCircle, Clock, Award, Brain } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { LoadingState } from './LoadingState';

interface UserSkill {
  id: string;
  topic_id: string;
  skill_level: number;
  mastery_level: string;
  attempts_count: number;
  last_practiced: string;
  grammar_topics: {
    name: string;
    level: string;
    category: string;
  };
}

interface PracticeSession {
  id: string;
  topic_id: string;
  exercises_attempted: number;
  exercises_correct: number;
  time_spent_seconds: number;
  started_at: string;
  completed_at: string;
  grammar_topics: {
    name: string;
    level: string;
  };
}

interface AssessmentResult {
  id: string;
  assessment_type: string;
  overall_score: number;
  recommended_level: string;
  created_at: string;
  strengths: string[];
  weaknesses: string[];
}

const MyProgress = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>([]);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user) {
      loadProgressData();
    }
  }, [user]);

  const loadProgressData = async () => {
    setLoading(true);
    try {
      // Load user skills with topic information
      const { data: skillsData, error: skillsError } = await supabase
        .from('user_skills')
        .select(`
          *,
          grammar_topics:topic_id (
            name,
            level,
            category
          )
        `)
        .eq('user_id', user?.id)
        .order('last_practiced', { ascending: false });

      if (skillsError) throw skillsError;

      // Load practice sessions with topic information
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('practice_sessions')
        .select(`
          *,
          grammar_topics:topic_id (
            name,
            level
          )
        `)
        .eq('user_id', user?.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(20);

      if (sessionsError) throw sessionsError;

      // Load assessment results
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (assessmentsError) throw assessmentsError;

      setUserSkills(skillsData || []);
      setPracticeSessions(sessionsData || []);
      setAssessmentResults(assessmentsData || []);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading your progress data..." />;
  }

  const getMasteryColor = (mastery: string) => {
    switch (mastery) {
      case 'expert': return 'bg-purple-100 text-purple-800';
      case 'advanced': return 'bg-green-100 text-green-800';
      case 'proficient': return 'bg-blue-100 text-blue-800';
      case 'developing': return 'bg-yellow-100 text-yellow-800';
      case 'novice': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const totalPracticeTime = practiceSessions.reduce((total, session) => total + (session.time_spent_seconds || 0), 0);
  const totalExercises = practiceSessions.reduce((total, session) => total + (session.exercises_attempted || 0), 0);
  const totalCorrect = practiceSessions.reduce((total, session) => total + (session.exercises_correct || 0), 0);
  const averageAccuracy = totalExercises > 0 ? Math.round((totalCorrect / totalExercises) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="flex items-center p-6">
            <Target className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-800">{userSkills.length}</div>
              <div className="text-sm text-blue-600">Skills Tracked</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-green-800">{averageAccuracy}%</div>
              <div className="text-sm text-green-600">Accuracy Rate</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="flex items-center p-6">
            <Clock className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-purple-800">{Math.round(totalPracticeTime / 60)}</div>
              <div className="text-sm text-purple-600">Minutes Practiced</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="flex items-center p-6">
            <Award className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-orange-800">{profile?.xp || 0}</div>
              <div className="text-sm text-orange-600">Total XP</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Progress */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full bg-white/80 backdrop-blur-sm">
          <TabsTrigger value="overview" className="flex items-center space-x-2 flex-1">
            <TrendingUp className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center space-x-2 flex-1">
            <Target className="h-4 w-4" />
            <span>Skills</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center space-x-2 flex-1">
            <CheckCircle className="h-4 w-4" />
            <span>Practice Sessions</span>
          </TabsTrigger>
          <TabsTrigger value="assessments" className="flex items-center space-x-2 flex-1">
            <Brain className="h-4 w-4" />
            <span>Assessments</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Progress</CardTitle>
                <CardDescription>Your overall progress across all grammar topics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Current Level: {profile?.level || 'A1'}</span>
                      <span>{profile?.completed_lessons || 0}/{profile?.total_lessons || 45} lessons</span>
                    </div>
                    <Progress 
                      value={((profile?.completed_lessons || 0) / (profile?.total_lessons || 45)) * 100} 
                      className="h-3"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Current Streak</span>
                      <span>{profile?.streak || 0} days</span>
                    </div>
                    <div className="text-xs text-gray-500">Keep practicing daily to maintain your streak!</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest practice sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {practiceSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{session.grammar_topics?.name}</div>
                        <div className="text-xs text-gray-500">
                          {session.exercises_correct}/{session.exercises_attempted} correct
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {session.grammar_topics?.level}
                      </Badge>
                    </div>
                  ))}
                  {practiceSessions.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      No practice sessions yet. Start practicing to see your progress!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Grammar Skills Progress</CardTitle>
              <CardDescription>Track your mastery level across different grammar topics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userSkills.map((skill) => (
                  <div key={skill.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{skill.grammar_topics?.name}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {skill.grammar_topics?.level}
                        </Badge>
                        <Badge className={getMasteryColor(skill.mastery_level)}>
                          {skill.mastery_level}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Skill Level</span>
                        <span>{Math.round(skill.skill_level * 100)}%</span>
                      </div>
                      <Progress value={skill.skill_level * 100} className="h-2" />
                      <div className="text-xs text-gray-500">
                        {skill.attempts_count} attempts • Last practiced: {new Date(skill.last_practiced).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                {userSkills.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Target className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No skills tracked yet. Complete some practice sessions to see your skill development!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Practice Session History</CardTitle>
              <CardDescription>Detailed view of your completed practice sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {practiceSessions.map((session) => (
                  <div key={session.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{session.grammar_topics?.name}</h3>
                      <Badge variant="outline">{session.grammar_topics?.level}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Accuracy</div>
                        <div className="font-medium">
                          {session.exercises_attempted > 0 
                            ? Math.round((session.exercises_correct / session.exercises_attempted) * 100)
                            : 0}%
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Exercises</div>
                        <div className="font-medium">{session.exercises_correct}/{session.exercises_attempted}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Duration</div>
                        <div className="font-medium">{formatDuration(session.time_spent_seconds || 0)}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Completed: {new Date(session.completed_at).toLocaleString()}
                    </div>
                  </div>
                ))}
                {practiceSessions.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No completed practice sessions yet. Start practicing to build your history!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Results</CardTitle>
              <CardDescription>Track your assessment scores and level progression</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assessmentResults.map((assessment) => (
                  <div key={assessment.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium capitalize">{assessment.assessment_type} Assessment</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{assessment.recommended_level}</Badge>
                        <Badge className="bg-blue-100 text-blue-800">
                          {Math.round(assessment.overall_score)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {assessment.strengths && assessment.strengths.length > 0 && (
                        <div>
                          <div className="text-green-600 font-medium mb-1">Strengths</div>
                          <ul className="text-gray-600">
                            {assessment.strengths.slice(0, 3).map((strength, index) => (
                              <li key={index} className="text-xs">• {strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {assessment.weaknesses && assessment.weaknesses.length > 0 && (
                        <div>
                          <div className="text-red-600 font-medium mb-1">Areas to Improve</div>
                          <ul className="text-gray-600">
                            {assessment.weaknesses.slice(0, 3).map((weakness, index) => (
                              <li key={index} className="text-xs">• {weakness}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Taken: {new Date(assessment.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
                {assessmentResults.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Brain className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No assessment results yet. Take a placement test to see your level and progress!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyProgress;
