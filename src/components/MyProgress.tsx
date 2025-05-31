
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { TrendingUp, Clock, Target, BookOpen, Award, Calendar } from 'lucide-react';

interface SkillData {
  topic_name: string;
  skill_level: number;
  mastery_level: string;
  attempts_count: number;
  last_practiced: string;
  category: string;
}

interface SessionData {
  topic_name: string;
  session_type: string;
  exercises_attempted: number;
  exercises_correct: number;
  time_spent_seconds: number;
  started_at: string;
  accuracy: number;
}

interface AssessmentData {
  assessment_type: string;
  overall_score: number;
  recommended_level: string;
  strengths: string[];
  weaknesses: string[];
  created_at: string;
}

const MyProgress: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [skills, setSkills] = useState<SkillData[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [assessments, setAssessments] = useState<AssessmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [user]);

  const fetchProgressData = async () => {
    if (!user) return;

    try {
      // Fetch user skills with topic information
      const { data: skillsData } = await supabase
        .from('user_skills')
        .select(`
          skill_level,
          mastery_level,
          attempts_count,
          last_practiced,
          grammar_topics (
            name,
            category
          )
        `)
        .eq('user_id', user.id);

      // Fetch practice sessions with topic information
      const { data: sessionsData } = await supabase
        .from('practice_sessions')
        .select(`
          session_type,
          exercises_attempted,
          exercises_correct,
          time_spent_seconds,
          started_at,
          grammar_topics (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(20);

      // Fetch assessment results
      const { data: assessmentsData } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Transform skills data
      const transformedSkills = skillsData?.map(skill => ({
        topic_name: skill.grammar_topics?.name || 'Unknown Topic',
        skill_level: skill.skill_level,
        mastery_level: skill.mastery_level,
        attempts_count: skill.attempts_count,
        last_practiced: skill.last_practiced,
        category: skill.grammar_topics?.category || 'General'
      })) || [];

      // Transform sessions data
      const transformedSessions = sessionsData?.map(session => ({
        topic_name: session.grammar_topics?.name || 'Unknown Topic',
        session_type: session.session_type,
        exercises_attempted: session.exercises_attempted,
        exercises_correct: session.exercises_correct,
        time_spent_seconds: session.time_spent_seconds,
        started_at: session.started_at,
        accuracy: session.exercises_attempted > 0 
          ? (session.exercises_correct / session.exercises_attempted) * 100 
          : 0
      })) || [];

      setSkills(transformedSkills);
      setSessions(transformedSessions);
      setAssessments(assessmentsData || []);
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m` : `${seconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading your progress...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Current Level</p>
                <p className="text-xl font-bold">{profile?.level || 'A1'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">XP Points</p>
                <p className="text-xl font-bold">{profile?.xp || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Topics Practiced</p>
                <p className="text-xl font-bold">{skills.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-xl font-bold">{sessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Progress Tabs */}
      <Tabs defaultValue="skills" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="skills">Skills & Mastery</TabsTrigger>
          <TabsTrigger value="sessions">Practice History</TabsTrigger>
          <TabsTrigger value="assessments">Assessment Results</TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Topic Mastery Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {skills.map((skill, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold">{skill.topic_name}</h3>
                        <Badge variant="outline">{skill.category}</Badge>
                        <Badge className={getMasteryColor(skill.mastery_level)}>
                          {skill.mastery_level}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{skill.attempts_count} attempts</p>
                        <p className="text-xs text-gray-400">
                          Last: {skill.last_practiced ? formatDate(skill.last_practiced) : 'Never'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Skill Level</span>
                        <span>{Math.round(skill.skill_level * 100)}%</span>
                      </div>
                      <Progress value={skill.skill_level * 100} className="h-2" />
                    </div>
                  </Card>
                ))}
                {skills.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No skills data yet. Start practicing to see your progress!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Recent Practice Sessions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessions.map((session, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-semibold">{session.topic_name}</h3>
                          <p className="text-sm text-gray-600 capitalize">
                            {session.session_type} session
                          </p>
                        </div>
                        <Badge variant="outline">
                          {session.exercises_correct}/{session.exercises_attempted} correct
                        </Badge>
                        <Badge 
                          className={
                            session.accuracy >= 80 ? 'bg-green-100 text-green-800' :
                            session.accuracy >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }
                        >
                          {Math.round(session.accuracy)}% accuracy
                        </Badge>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>{formatTime(session.time_spent_seconds)}</p>
                        <p>{formatDate(session.started_at)}</p>
                      </div>
                    </div>
                  </Card>
                ))}
                {sessions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No practice sessions yet. Start your learning journey!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Assessment History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assessments.map((assessment, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold capitalize">
                          {assessment.assessment_type} Assessment
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(assessment.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          Score: {Math.round(assessment.overall_score)}%
                        </Badge>
                        {assessment.recommended_level && (
                          <Badge>{assessment.recommended_level}</Badge>
                        )}
                      </div>
                    </div>
                    
                    {assessment.strengths && assessment.strengths.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-green-700 mb-1">Strengths:</p>
                        <div className="flex flex-wrap gap-1">
                          {assessment.strengths.map((strength, i) => (
                            <Badge key={i} className="bg-green-100 text-green-800 text-xs">
                              {strength}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {assessment.weaknesses && assessment.weaknesses.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-red-700 mb-1">Areas for improvement:</p>
                        <div className="flex flex-wrap gap-1">
                          {assessment.weaknesses.map((weakness, i) => (
                            <Badge key={i} className="bg-red-100 text-red-800 text-xs">
                              {weakness}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
                {assessments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No assessments completed yet. Take a placement test to get started!</p>
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
