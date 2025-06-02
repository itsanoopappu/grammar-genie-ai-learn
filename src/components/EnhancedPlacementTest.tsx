import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Target, BookOpen } from 'lucide-react';
import { useEnhancedAssessment } from '@/hooks/useEnhancedAssessment';
import ExerciseDisplay from './ExerciseDisplay';
import LoadingState from './LoadingState';
import ErrorDisplay from './ErrorDisplay';
import AssessmentResults from './AssessmentResults';

const EnhancedPlacementTest = () => {
  const { 
    state,
    startAssessment,
    submitAnswer,
    nextQuestion,
    resetAssessment,
    setSelectedAnswer
  } = useEnhancedAssessment();

  const [showFeedback, setShowFeedback] = useState(false);

  const handleSubmitAnswer = async () => {
    await submitAnswer();
    setShowFeedback(true);
    
    // Automatically move to next question after 2.5 seconds
    setTimeout(() => {
      handleNextQuestion();
    }, 2500);
  };

  const handleNextQuestion = async () => {
    setShowFeedback(false);
    await nextQuestion();
  };

  const handleRestart = () => {
    setShowFeedback(false);
    resetAssessment();
  };

  if (state.loading && !state.testStarted) {
    return <LoadingState message="Preparing your personalized assessment..." />;
  }

  if (state.error) {
    return <ErrorDisplay error={state.error} onRetry={startAssessment} />;
  }

  if (state.testCompleted && state.testResults) {
    return (
      <AssessmentResults
        results={state.testResults}
        questionReviews={state.questionReviews}
        onRestart={handleRestart}
      />
    );
  }

  if (!state.testStarted) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2 text-2xl">
              <Target className="h-8 w-8 text-blue-600" />
              <span>Enhanced English Level Assessment</span>
            </CardTitle>
            <CardDescription className="text-lg">
              Discover your true English level with our comprehensive assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Accurate Results</h3>
                <p className="text-sm text-gray-600">
                  Advanced algorithm for precise level prediction
                </p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Detailed Analysis</h3>
                <p className="text-sm text-gray-600">
                  Comprehensive breakdown of strengths and weaknesses
                </p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Quick & Easy</h3>
                <p className="text-sm text-gray-600">
                  15 questions, approximately 10-15 minutes
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">What You'll Get:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Your exact CEFR level (A1-C2) with confidence score</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Detailed analysis of your grammar strengths and weaknesses</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Question-by-question review with explanations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Personalized practice drills for weak areas</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Weekly study plan and next steps</span>
                </li>
              </ul>
            </div>

            <div className="text-center">
              <Button 
                onClick={startAssessment} 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Enhanced Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = state.questions[state.currentQuestionIndex];
  const progress = ((state.currentQuestionIndex + 1) / state.questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <span>Question {state.currentQuestionIndex + 1} of {state.questions.length}</span>
            </CardTitle>
            <div className="text-sm text-gray-600">
              Progress: {Math.round(progress)}%
            </div>
          </div>
          <Progress value={progress} className="mt-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          {currentQuestion && (
            <ExerciseDisplay
              exercise={{
                id: currentQuestion.id,
                type: 'multiple-choice',
                content: {
                  question: currentQuestion.question,
                  options: currentQuestion.options,
                  correct_answer: currentQuestion.correct_answer,
                  explanation: currentQuestion.explanation
                },
                difficulty_level: currentQuestion.difficulty_score || 50,
                estimated_time_seconds: 60
              }}
              userAnswer={''}
              selectedOption={state.selectedAnswer}
              onAnswerChange={() => {}}
              onOptionChange={setSelectedAnswer}
              disabled={showFeedback}
              showFeedback={showFeedback}
            />
          )}

          <div className="flex justify-between">
            {!showFeedback ? (
              <Button 
                onClick={handleSubmitAnswer} 
                disabled={!state.selectedAnswer}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                Submit Answer
              </Button>
            ) : (
              <div className="w-full text-center">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-blue-700 font-medium">
                    {state.selectedAnswer === currentQuestion.correct_answer 
                      ? "✅ Correct! Moving to next question..." 
                      : "❌ Incorrect. Moving to next question..."}
                  </p>
                </div>
                <Button 
                  onClick={handleNextQuestion}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {state.currentQuestionIndex >= state.questions.length - 1 
                    ? 'Complete Assessment' 
                    : 'Next Question'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedPlacementTest;
