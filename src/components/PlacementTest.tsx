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
  correct: string;
  topic: string;
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
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [testType, setTestType] = useState<'standard' | 'adaptive'>('standard');
  const [testId, setTestId] = useState<string | null>(null);

  useEffect(() => {
    if (user && !testStarted) {
      checkExistingTest();
    }
  }, [user]);

  const checkExistingTest = async () => {
    try {
      const { data: existingTests } = await supabase
        .from('placement_tests')
        .select('*')
        .eq('user_id', user?.id)
        .order('started_at', { ascending: false })
        .limit(1);

      if (existingTests && existingTests.length > 0) {
        setTestType(existingTests[0].test_type);
      }
    } catch (error) {
      console.error('Error checking existing test:', error);
    }
  };

  const startTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('placement-test', {
        body: { 
          action: 'generate',
          level: profile?.level || 'A2',
          adaptive: testType === 'adaptive',
          user_id: user?.id
        }
      });

      if (error) throw error;
      
      setQuestions(data.questions);
      setTestId(data.testId);
      setTestStarted(true);
      setCurrentQuestion(0);
      setAnswers({});
    } catch (error: any) {
      setError(error.message || 'Failed to start test');
      console.error('Error starting test:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer) return;

    const updatedAnswers = {
      ...answers,
      [questions[currentQuestion].id]: selectedAnswer
    };
    setAnswers(updatedAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer('');
    } else {
      await completeTest(updatedAnswers);
    }
  };

  const completeTest = async (finalAnswers: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('placement-test', {
        body: { 
          action: 'evaluate',
          test_id: testId,
          answers: finalAnswers
        }
      });

      if (error) throw error;
      
      setTestResults(data);
      setTestCompleted(true);

      if (profile && data.recommendedLevel) {
        await updateProfile({ 
          level: data.recommendedLevel,
          xp: (profile.xp || 0) + 50
        });
      }
    } catch (error: any) {
      setError(error.message || 'Failed to complete test');
      console.error('Error completing test:', error);
    } finally {
      setLoading(false);
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
    setError(null);
    setTestId(null);
  };

  const testProgress = testStarted ? ((currentQuestion + 1) / questions.length) * 100 : 0;

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
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {!testStarted && !testCompleted && (
            <div className="text-center space-y-4">
              <p className="text-gray-600 mb-4">
                This test will assess your English skills and provide you with an accurate proficiency level.
              </p>
              <div className="space-x-4">
                <Button 
                  variant={testType === 'standard' ? 'default' : 'outline'}
                  onClick={() => setTestType('standard')}
                >
                  Standard Test
                </Button>
                <Button 
                  variant={testType === 'adaptive' ? 'default' : 'outline'}
                  onClick={() => setTestType('adaptive')}
                >
                  Adaptive Test
                </Button>
              </div>
              <Button onClick={startTest} disabled={loading} className="mt-4">
                {loading ? 'Loading...' : 'Start Test'}
              </Button>
            </div>
          )}

          {testStarted && !testCompleted && questions.length > 0 && (
            <div className="space-y-6">
              <Progress value={testProgress} className="h-2" />
              <div className="flex justify-between items-center">
                <div className="text-lg font-semibold">
                  Question {currentQuestion + 1} of {questions.length}
                </div>
                <Badge variant="outline">
                  {testType === 'adaptive' ? 'Adaptive' : 'Standard'} Test
                </Badge>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-lg font-medium">{questions[currentQuestion].question}</p>
              </div>

              <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                <div className="grid gap-2">
                  {questions[currentQuestion].options.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={option} />
                      <Label htmlFor={option}>{option}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              <Button 
                onClick={submitAnswer} 
                disabled={!selectedAnswer || loading}
                className="w-full"
              >
                {loading ? 'Processing...' : 'Submit Answer'}
              </Button>
            </div>
          )}

          {testCompleted && testResults && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Test Completed!</h3>
                <div className="space-y-2">
                  <p className="text-xl">
                    Your level: <Badge className="ml-2 text-lg">{testResults.recommendedLevel}</Badge>
                  </p>
                  <p className="text-gray-600">
                    Score: {Math.round(testResults.score)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Strengths</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1">
                      {testResults.strengths.map((strength: string, index: number) => (
                        <li key={index} className="text-green-700">{strength}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-red-500" />
                      <span>Areas to Improve</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1">
                      {testResults.weaknesses.map((weakness: string, index: number) => (
                        <li key={index} className="text-red-700">{weakness}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <span>Next Steps</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {testResults.nextSteps.map((step: string, index: number) => (
                      <li key={index} className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4 text-blue-500 shrink-0" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <div className="text-center">
                <Button onClick={resetTest}>Take Another Test</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlacementTest;