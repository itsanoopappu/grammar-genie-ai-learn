
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, BookOpen, Award, Brain, Target, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface Question {
  question: string;
  options: string[];
  correct: string;
  topic: string;
  explanation: string;
}

interface TestResults {
  score: number;
  total: number;
  percentage: number;
  recommendedLevel: string;
  topicPerformance: Record<string, { correct: number; total: number }>;
  weakTopics: string[];
  strongTopics: string[];
  detailedFeedback: string[];
}

const PlacementTest = () => {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [testType, setTestType] = useState<'standard' | 'adaptive'>('adaptive');
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (testStarted && !testCompleted && startTime) {
      interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [testStarted, testCompleted, startTime]);

  const handleStartTest = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('placement-test', {
        body: { 
          action: 'generate',
          level: profile?.level || 'A2',
          adaptive: testType === 'adaptive'
        }
      });

      if (error) throw error;
      
      setQuestions(data.questions);
      setTestStarted(true);
      setCurrentQuestion(0);
      setUserAnswers([]);
      setTestCompleted(false);
      setStartTime(new Date());
      setTimeSpent(0);
    } catch (error) {
      console.error('Error starting test:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value);
  };

  const handleNextQuestion = async () => {
    const newAnswers = [...userAnswers, selectedAnswer];
    setUserAnswers(newAnswers);
    setSelectedAnswer('');

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Test completed - evaluate results
      setLoading(true);
      try {
        const answersWithQuestions = questions.map((q, index) => ({
          question: q.question,
          userAnswer: newAnswers[index],
          correctAnswer: q.correct,
          topic: q.topic,
          explanation: q.explanation
        }));

        const { data, error } = await supabase.functions.invoke('placement-test', {
          body: { 
            action: 'evaluate',
            answers: answersWithQuestions
          }
        });

        if (error) throw error;
        
        setTestResults(data);
        setTestCompleted(true);

        // Save test results to database
        await supabase.from('placement_tests').insert({
          user_id: user?.id,
          score: data.percentage,
          level: data.recommendedLevel,
          test_type: testType,
          completed_at: new Date().toISOString()
        });

        // Update user profile with new level if it's higher
        if (shouldUpdateLevel(profile?.level, data.recommendedLevel)) {
          await updateProfile({ 
            level: data.recommendedLevel,
            xp: (profile?.xp || 0) + 50 // Bonus XP for completing test
          });
        }

      } catch (error) {
        console.error('Error evaluating test:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const shouldUpdateLevel = (currentLevel: string, newLevel: string): boolean => {
    const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levelOrder.indexOf(currentLevel || 'A1');
    const newIndex = levelOrder.indexOf(newLevel);
    return newIndex > currentIndex;
  };

  const resetTest = () => {
    setTestStarted(false);
    setCurrentQuestion(0);
    setSelectedAnswer('');
    setQuestions([]);
    setUserAnswers([]);
    setTestCompleted(false);
    setTestResults(null);
    setTimeSpent(0);
    setStartTime(null);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!testStarted) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2 text-2xl">
              <Brain className="h-6 w-6 text-purple-500" />
              <span>AI-Powered Grammar Assessment</span>
            </CardTitle>
            <CardDescription>
              Discover your English level with our intelligent placement test
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Test Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all ${testType === 'adaptive' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => setTestType('adaptive')}
              >
                <CardContent className="p-4 text-center">
                  <Brain className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="font-semibold">Adaptive Test</h3>
                  <p className="text-sm text-gray-600">AI adjusts difficulty based on your responses</p>
                  <Badge className="mt-2">Recommended</Badge>
                </CardContent>
              </Card>
              <Card 
                className={`cursor-pointer transition-all ${testType === 'standard' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                onClick={() => setTestType('standard')}
              >
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <h3 className="font-semibold">Standard Test</h3>
                  <p className="text-sm text-gray-600">Fixed set of questions across all levels</p>
                </CardContent>
              </Card>
            </div>

            {/* Test Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <div className="font-semibold">10-15 Minutes</div>
                <div className="text-sm text-gray-600">Estimated time</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <BookOpen className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="font-semibold">10 Questions</div>
                <div className="text-sm text-gray-600">Comprehensive coverage</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Award className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <div className="font-semibold">CEFR Level</div>
                <div className="text-sm text-gray-600">A1 to C1 assessment</div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-800 mb-2">Test Instructions:</h3>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Choose the best answer for each question</li>
                <li>• Take your time - accuracy is more important than speed</li>
                <li>• {testType === 'adaptive' ? 'Questions will adapt to your skill level' : 'Questions cover different difficulty levels'}</li>
                <li>• Results will show your grammar strengths and areas to improve</li>
                <li>• You can retake the test anytime to track progress</li>
              </ul>
            </div>

            {/* Current Level Display */}
            {profile?.level && (
              <div className="text-center bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">Current Level: <span className="font-semibold text-blue-600">{profile.level}</span></p>
                <p className="text-sm text-gray-500">This test will help confirm or update your level</p>
              </div>
            )}

            <div className="text-center">
              <Button 
                onClick={handleStartTest} 
                size="lg" 
                className="px-8"
                disabled={loading}
              >
                {loading ? 'Preparing Test...' : `Start ${testType === 'adaptive' ? 'Adaptive' : 'Standard'} Test`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (testCompleted && testResults) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Test Results</CardTitle>
            <CardDescription>Your comprehensive grammar assessment is complete!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Results */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                <Award className="h-12 w-12 text-white" />
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                Level: {testResults.recommendedLevel}
              </div>
              <div className="text-lg text-gray-600 mb-2">
                Score: {testResults.score}/{testResults.total} ({testResults.percentage.toFixed(1)}%)
              </div>
              <div className="text-sm text-gray-500">
                Time: {formatTime(timeSpent)} | Test Type: {testType}
              </div>
            </div>

            {/* Detailed Feedback */}
            {testResults.detailedFeedback && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Detailed Feedback:</h3>
                <div className="space-y-2">
                  {testResults.detailedFeedback.map((feedback, index) => (
                    <p key={index} className="text-blue-700">{feedback}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Topic Performance */}
            {testResults.topicPerformance && Object.keys(testResults.topicPerformance).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span>Topic Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(testResults.topicPerformance).map(([topic, perf]) => (
                      <div key={topic} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{topic}</span>
                          <span className="text-sm text-gray-600">
                            {perf.correct}/{perf.total} ({Math.round((perf.correct / perf.total) * 100)}%)
                          </span>
                        </div>
                        <Progress value={(perf.correct / perf.total) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Strengths and Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-green-600">Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {testResults.strongTopics?.map((topic, index) => (
                      <Badge key={index} variant="secondary" className="bg-green-100 text-green-700 mr-2 mb-2">
                        {topic}
                      </Badge>
                    ))}
                    {(!testResults.strongTopics || testResults.strongTopics.length === 0) && (
                      <p className="text-gray-500">Keep practicing to build your strengths!</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-orange-600">Areas to Improve</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {testResults.weakTopics?.map((topic, index) => (
                      <Badge key={index} variant="outline" className="border-orange-200 text-orange-700 mr-2 mb-2">
                        {topic}
                      </Badge>
                    ))}
                    {(!testResults.weakTopics || testResults.weakTopics.length === 0) && (
                      <p className="text-gray-500">Excellent! You performed well across all areas!</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={resetTest} variant="outline">
                Retake Test
              </Button>
              <Button onClick={() => window.location.hash = '#drills'}>
                Get Personalized Drills
              </Button>
              <Button onClick={() => window.location.hash = '#chat'}>
                Chat with AI Tutor
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Test in progress
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Question {currentQuestion + 1} of {questions.length}
            </CardTitle>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                Time: {formatTime(timeSpent)}
              </Badge>
              <Badge variant="outline">
                {questions[currentQuestion]?.topic}
              </Badge>
            </div>
          </div>
          <Progress value={((currentQuestion + 1) / questions.length) * 100} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {questions[currentQuestion] && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {questions[currentQuestion].question}
              </h3>
              
              <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
                {questions[currentQuestion].options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <div className="flex justify-between">
            <div className="text-sm text-gray-500">
              {testType === 'adaptive' ? 'Adaptive difficulty' : 'Standard test'}
            </div>
            <Button 
              onClick={handleNextQuestion} 
              disabled={!selectedAnswer || loading}
            >
              {loading ? 'Processing...' : currentQuestion === questions.length - 1 ? 'Finish Test' : 'Next Question'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlacementTest;
