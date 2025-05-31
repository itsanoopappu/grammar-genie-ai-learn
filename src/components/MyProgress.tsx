import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { TrendingUp, Target, Trophy, Clock, Brain, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface SkillData {
  topic_name: string;
  skill_level: number;
  mastery_level: string;
  attempts_count: number;
  last_practiced: string;
}

interface AssessmentData {
  id: string;
  assessment_type: string;
  overall_score: number;
  strengths: string[]; // Updated to match expected type
  weaknesses: string[]; // Updated to match expected type
  recommended_level: string;
  created_at: string;
}

interface SessionData {
  date: string;
  exercises_correct: number;
  exercises_attempted: number;
  time_spent: number;
}

const MyProgress = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [skillsData, setSkillsData] = useState<SkillData[]>([]);
  const [assessmentData, setAssessmentData] = useState<AssessmentData[]>([]);
  const [sessionData, setSessionData] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [user]);

  const fetchProgressData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch user skills with topic names
      const { data: skills, error: skillsError } = await supabase
        .from('user_skills')
        .select(`
          skill_level,
          mastery_level,
          attempts_count,
          last_practiced,
          grammar_topics!inner(name)
        `)
        .eq('user_id', user.id);

      if (skillsError) throw skillsError;

      const formattedSkills = skills?.map((skill: any) => ({
        topic_name: skill.grammar_topics.name,
        skill_level: skill.skill_level,
        mastery_level: skill.mastery_level,
        attempts_count: skill.attempts_count,
        last_practiced: skill.last_practiced
      })) || [];

      setSkillsData(formattedSkills);

      // Fetch assessment results with proper type conversion
      const { data: assessments, error: assessmentError } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (assessmentError) throw assessmentError;

      const formattedAssessments = assessments?.map((assessment: any) => ({
        id: assessment.id,
        assessment_type: assessment.assessment_type,
        overall_score: assessment.overall_score,
        strengths: Array.isArray(assessment.strengths) ? assessment.strengths : [],
        weaknesses: Array.isArray(assessment.weaknesses) ? assessment.weaknesses : [],
        recommended_level: assessment.recommended_level,
        created_at: assessment.created_at
      })) || [];

      setAssessmentData(formattedAssessments);

      // Fetch practice session data for charts
      const { data: sessions, error: sessionError } = await supabase
        .from('practice_sessions')
        .select('exercises_correct, exercises_attempted, time_spent_seconds, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(30);

      if (sessionError) throw sessionError;

      const formattedSessions = sessions?.map((session: any) => ({
        date: new Date(session.created_at).toLocaleDateString(),
        exercises_correct: session.exercises_correct || 0,
        exercises_attempted: session.exercises_attempted || 0,
        time_spent: Math.round((session.time_spent_seconds || 0) / 60) // Convert to minutes
      })) || [];

      setSessionData(formattedSessions);

    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | undefined): string => {
    if (!date) return 'No date selected';
    return date.toLocaleDateString();
  };

  const filteredSessions = sessionData.filter(session => session.date === formatDate(selectedDate));

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <span>My Progress</span>
          </CardTitle>
          <CardDescription>Track your learning journey and see your improvements over time.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <Tabs defaultValue="skills" className="space-y-4">
              <TabsList>
                <TabsTrigger value="skills" className="flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>Skills</span>
                </TabsTrigger>
                <TabsTrigger value="assessments" className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4" />
                  <span>Assessments</span>
                </TabsTrigger>
                <TabsTrigger value="sessions" className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Practice Sessions</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="skills" className="space-y-4">
                <h3 className="text-lg font-semibold">Current Skill Levels</h3>
                {skillsData.length === 0 ? (
                  <div className="text-gray-500">No skill data available yet. Start practicing to see your skills progress!</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {skillsData.map((skill, index) => (
                      <Card key={index} className="bg-gray-50 border border-gray-200">
                        <CardHeader>
                          <CardTitle>{skill.topic_name}</CardTitle>
                          <CardDescription>Mastery Level: {skill.mastery_level}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Brain className="h-4 w-4 text-blue-500" />
                              <span>Skill Level: {skill.skill_level}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span>Attempts: {skill.attempts_count}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span>Last Practiced: {skill.last_practiced ? new Date(skill.last_practiced).toLocaleDateString() : 'Never'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="assessments" className="space-y-4">
                <h3 className="text-lg font-semibold">Assessment History</h3>
                {assessmentData.length === 0 ? (
                  <div className="text-gray-500">No assessments taken yet. Take a placement test to evaluate your current level!</div>
                ) : (
                  <div className="space-y-4">
                    {assessmentData.map((assessment) => (
                      <Card key={assessment.id} className="bg-gray-50 border border-gray-200">
                        <CardHeader>
                          <CardTitle>Assessment: {assessment.assessment_type}</CardTitle>
                          <CardDescription>Taken on: {new Date(assessment.created_at).toLocaleDateString()}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Progress value={assessment.overall_score} className="w-32" />
                              <span>Overall Score: {assessment.overall_score}%</span>
                            </div>
                            <div>
                              <span className="font-medium">Recommended Level:</span> {assessment.recommended_level}
                            </div>
                            <div>
                              <span className="font-medium">Strengths:</span> {assessment.strengths.join(', ') || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Weaknesses:</span> {assessment.weaknesses.join(', ') || 'N/A'}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sessions" className="space-y-4">
                <h3 className="text-lg font-semibold">Practice Session Data</h3>
                <div className="flex items-center space-x-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                  <div>
                    <h4 className="text-sm font-medium">Selected Date:</h4>
                    <p className="text-gray-600">{formatDate(selectedDate)}</p>
                  </div>
                </div>

                {filteredSessions.length === 0 ? (
                  <div className="text-gray-500">No practice sessions recorded for the selected date.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-gray-50 border border-gray-200">
                      <CardHeader>
                        <CardTitle>Exercises Completed</CardTitle>
                        <CardDescription>Number of exercises correct vs. attempted</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={filteredSessions}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="exercises_correct" fill="#82ca9d" />
                            <Bar dataKey="exercises_attempted" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-50 border border-gray-200">
                      <CardHeader>
                        <CardTitle>Time Spent Practicing</CardTitle>
                        <CardDescription>Minutes spent practicing on the selected date</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={filteredSessions}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="time_spent" stroke="#8884d8" activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyProgress;
