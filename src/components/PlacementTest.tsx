
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Target, Clock, Brain, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePlacementTestLogic } from '@/hooks/usePlacementTestLogic';

interface FeedbackData {
  isCorrect: boolean;
  feedback: {
    message: string;
    explanation?: string;
  };
  correctAnswer: string;
  explanation?: string;
}

const PlacementTest = () => {
  const { user } = useAuth();
  const {
    state,
    submitAnswer,
    startTest,
    nextQuestion,
    resetTest,
    setSelectedAnswer
  } = usePlacementTestLogic();

  const [showFeedback, setShowFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackData | null>(null);

  // Get current question from state
  const currentQuestion = state.questions[state.currentQuestion];

  useEffect(() => {
    if (!state.testStarted && user) {
      startTest();
    }
  }, [user, state.testStarted, startTest]);

  const handleSubmitAnswer = async () => {
    if (!state.selectedAnswer || !currentQuestion) return;

    try {
      await submitAnswer();
      
      // Get the actual result from the API
      const { data: questionData } = await supabase
        .from('test_questions')
        .select('correct_answer, explanation')
        .eq('id', currentQuestion.id)
        .single();

      if (questionData) {
        const isCorrect = state.selectedAnswer.toLowerCase().trim() === 
          questionData.correct_answer.toLowerCase().trim();
        
        setCurrentFeedback({
          isCorrect,
          feedback: {
            message: isCorrect 
              ? 'Correct! Well done.' 
              : `Incorrect. The correct answer is: ${questionData.correct_answer}`,
            explanation: questionData.explanation
          },
          correctAnswer: questionData.correct_answer,
          explanation: questionData.explanation
        });
      }
      
      setShowFeedback(true);
    } catch (error) {
      console.error('Error submitting answer:', error);
      setCurrentFeedback({
        isCorrect: false,
        feedback: {
          message: 'Error submitting answer. Please try again.',
        },
        correctAnswer: currentQuestion.correct_answer || 'Unknown'
      });
      setShowFeedback(true);
    }
  };

  const handleNextQuestion = () => {
    nextQuestion();
    setSelectedAnswer('');
    setShowFeedback(false);
    setCurrentFeedback(null);
  };

  const handleRestartTest = () => {
    resetTest();
    setSelectedAnswer('');
    setShowFeedback(false);
    setCurrentFeedback(null);
  };

  if (!user) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">Please sign in to take the placement test.</p>
        </CardContent>
      </Card>
    );
  }

  if (state.testCompleted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <span>Assessment Complete!</span>
          </CardTitle>
          <CardDescription>
            Your English level has been assessed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {state.testResults?.recommendedLevel || 'B1'}
            </div>
            <p className="text-gray-600 mb-4">Your estimated level</p>
            <div className="text-2xl font-semibold text-green-600">
              {Math.round((state.testResults?.score || 0))}% Score
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">
                {state.currentQuestion + 1}
              </div>
              <div className="text-sm text-blue-600">Questions Answered</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">
                {Object.keys(state.userAnswers).length}
              </div>
              <div className="text-sm text-green-600">Total Answers</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">
                {state.testResults?.confidence ? Math.round(state.testResults.confidence) : 75}%
              </div>
              <div className="text-sm text-purple-600">Confidence</div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button onClick={handleRestartTest}>
              Take Test Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state.loading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading assessment questions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">No questions available. Please try again later.</p>
          <Button onClick={handleRestartTest} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const progress = state.questions.length > 0 ? 
    ((state.currentQuestion + 1) / state.questions.length) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <span>English Level Assessment</span>
            </CardTitle>
            <Badge variant="outline">
              Question {state.currentQuestion + 1} of {state.questions.length}
            </Badge>
          </div>
          <CardDescription>
            Answer questions to determine your English proficiency level
          </CardDescription>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>~15 minutes</span>
            </div>
            <div className="flex items-center space-x-1">
              <Target className="h-4 w-4" />
              <span>Assessment Type: {state.assessmentType}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-lg font-medium">{currentQuestion.question}</p>
          </div>

          {currentQuestion.options && (
            <RadioGroup value={state.selectedAnswer} onValueChange={setSelectedAnswer}>
              <div className="grid gap-3">
                {currentQuestion.options.map((option) => (
                  <div key={option} className="flex items-center space-x-3">
                    <RadioGroupItem 
                      value={option} 
                      id={option} 
                      disabled={showFeedback}
                    />
                    <Label 
                      htmlFor={option} 
                      className="flex-1 cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {showFeedback && currentFeedback && (
            <div className={`p-4 rounded-lg ${
              currentFeedback.isCorrect ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                {currentFeedback.isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={`font-medium ${
                  currentFeedback.isCorrect ? 'text-green-800' : 'text-red-800'
                }`}>
                  {currentFeedback.isCorrect ? 'Correct!' : 'Incorrect'}
                </span>
              </div>
              
              <p className={`mb-2 ${
                currentFeedback.isCorrect ? 'text-green-700' : 'text-red-700'
              }`}>
                {currentFeedback.feedback.message}
              </p>
              
              {currentFeedback.explanation && (
                <p className="text-gray-700 text-sm">
                  <strong>Explanation:</strong> {currentFeedback.explanation}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end">
            {!showFeedback ? (
              <Button 
                onClick={handleSubmitAnswer}
                disabled={!state.selectedAnswer}
              >
                Submit Answer
              </Button>
            ) : (
              <Button onClick={handleNextQuestion}>
                {state.currentQuestion >= state.questions.length - 1 
                  ? 'Complete Assessment' 
                  : 'Next Question'
                }
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlacementTest;
