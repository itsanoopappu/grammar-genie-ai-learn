import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Target, BookOpen, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  topic: string;
  level: string;
  explanation: string;
}

const PlacementTest = () => {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [testType, setTestType] = useState<'standard' | 'adaptive'>('standard');

  useEffect(() => {
    if (user && !testStarted) {
      startTest();
    }
  }, [user, testStarted]);

  const startTest = async () => {
    setLoading(true);
    try {
      // Check if there's an existing test
      const { data: existingTest, error: existingTestError } = await supabase
        .from('placement_tests')
        .select('*')
        .eq('user_id', user?.id)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (existingTest) {
        setTestType(existingTest.test_type);
      }

      const { data, error } = await supabase.functions.invoke('placement-test', {
        body: { 
          action: 'generate',
          userLevel: profile?.level,
          testType: testType
        }
      });

      if (error) throw error;
      
      setQuestions(data.questions);
      setTestStarted(true);
    } catch (error) {
      console.error('Error starting test:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value);
  };

  const submitAnswer = async () => {
    if (!selectedAnswer) return;

    setAnswers(prevAnswers => ({
      ...prevAnswers,
      [questions[currentQuestion].id]: selectedAnswer
    }));

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer('');
    } else {
      await completeTest();
    }
  };

  const completeTest = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('placement-test', {
        body: { 
          action: 'evaluate',
          questions,
          answers: {
            ...answers,
            [questions[currentQuestion].id]: selectedAnswer
          }
        }
      });

      if (error) throw error;
      
      setTestResults(data);
      setTestCompleted(true);
      await saveTestResults(data.score, data.level, data);
    } catch (error) {
      console.error('Error completing test:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTestResults = async (score: number, level: string, results: any) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('placement_tests')
        .insert({
          user_id: user.id,
          test_type: testType,
          score,
          level,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Save detailed results
      await supabase
        .from('assessment_results')
        .insert({
          user_id: user.id,
          assessment_type: 'placement',
          topics_assessed: results.topicsAssessed,
          overall_score: score,
          strengths: results.strengths,
          weaknesses: results.weaknesses,
          recommended_level: level,
          detailed_analysis: results.detailedAnalysis,
          next_steps: results.nextSteps
        });

      // Update user profile with new level
      if (profile) {
        await updateProfile({ level });
      }

    } catch (error) {
      console.error('Error saving test results:', error);
    }
  };

  const resetTest = () => {
    setTestStarted(false);
    setTestCompleted(false);
    setCurrentQuestion(0);
    setQuestions([]);
    setAnswers({});
    setSelectedAnswer('');
    setTestResults(null);
  };

  const testProgress = testStarted ? ((currentQuestion + 1) / questions?.length) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Card className="space-y-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-500" />
            <span>English Placement Test</span>
          </CardTitle>
          <CardDescription>
            Determine your English proficiency level with our adaptive placement test.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!testStarted && !testCompleted && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                This test will assess your English skills and provide you with an accurate proficiency level.
              </p>
              <Button onClick={startTest} disabled={loading}>
                {loading ? 'Loading...' : 'Start Test'}
              </Button>
            </div>
          )}

          {testStarted && !testCompleted && questions.length > 0 && (
            <div className="space-y-6">
              <Progress value={testProgress} className="h-2" />
              <div className="text-lg font-semibold">
                Question {currentQuestion + 1} of {questions.length}
              </div>
              <div className="text-gray-700">{questions[currentQuestion].question}</div>
              <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
                <div className="grid gap-2">
                  {questions[currentQuestion].options.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={option} className="peer sr-only" />
                      <Label
                        htmlFor={option}
                        className="cursor-pointer rounded-md border-2 border-muted bg-popover p-4 text-sm font-medium shadow-sm data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary [&:has([data-state=checked])]:text-primary-foreground"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
              <Button onClick={submitAnswer} disabled={!selectedAnswer || loading}>
                {loading ? 'Loading...' : 'Submit Answer'}
              </Button>
            </div>
          )}

          {testCompleted && testResults && (
            <div className="space-y-4">
              <div className="text-center">
                <CheckCircle className="h-10 w-10 mx-auto text-green-500" />
                <h3 className="text-2xl font-semibold">Test Completed!</h3>
                <p className="text-gray-600">
                  Your estimated English level is: <Badge variant="secondary">{testResults.level}</Badge>
                </p>
                <p className="text-gray-600">
                  Score: {testResults.score} / {questions.length}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Strengths</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside">
                      {testResults.strengths.map((strength: string, index: number) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Weaknesses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside">
                      {testResults.weaknesses.map((weakness: string, index: number) => (
                        <li key={index}>{weakness}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center">
                <Button onClick={resetTest}>Take Again</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlacementTest;