
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitAnswer = async () => {
    setIsSubmitting(true);
    await submitAnswer();
    
    // Brief pause for better UX, then automatically move to next question
    setTimeout(() => {
      handleNextQuestion();
    }, 1500);
  };

  const handleNextQuestion = async () => {
    setShowFeedback(false);
    setIsSubmitting(false);
    await nextQuestion();
  };

  const handleRestart = () => {
    setShowFeedback(false);
    setIsSubmitting(false);
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
        <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200 shadow-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="flex items-center justify-center space-x-3 text-3xl">
              <Target className="h-8 w-8 text-blue-600" />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Enhanced English Level Assessment
              </span>
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              Discover your true English level with our comprehensive assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Accurate Results</h3>
                <p className="text-sm text-gray-600">
                  Advanced algorithm for precise level prediction
                </p>
              </div>
              <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <BookOpen className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Detailed Analysis</h3>
                <p className="text-sm text-gray-600">
                  Comprehensive breakdown of strengths and weaknesses
                </p>
              </div>
              <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <Clock className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Quick & Easy</h3>
                <p className="text-sm text-gray-600">
                  15 questions, approximately 10-15 minutes
                </p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-md">
              <h3 className="font-bold text-gray-900 mb-6 text-xl">What You'll Get:</h3>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Your exact CEFR level (A1-C2) with confidence score</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Detailed analysis of your grammar strengths and weaknesses</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Question-by-question review with explanations</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Personalized practice drills for weak areas</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Weekly study plan and next steps</span>
                </li>
              </ul>
            </div>

            <div className="text-center">
              <Button 
                onClick={startAssessment} 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
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
      {/* Enhanced Progress Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-3">
              <Target className="h-6 w-6 text-blue-600" />
              <span className="text-xl">Question {state.currentQuestionIndex + 1} of {state.questions.length}</span>
            </CardTitle>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">
                Progress: {Math.round(progress)}%
              </div>
              <div className="text-xs text-gray-500">
                {state.questions.length - state.currentQuestionIndex - 1} remaining
              </div>
            </div>
          </div>
          <Progress value={progress} className="mt-3 h-3 bg-blue-100" />
        </CardHeader>
      </Card>

      {/* Enhanced Exercise Display */}
      <div className="space-y-6">
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
            disabled={isSubmitting}
            showFeedback={false}
            isAssessmentMode={true}
          />
        )}

        {/* Enhanced Submit Button */}
        <Card className="border-blue-200 shadow-md">
          <CardContent className="p-6">
            {!isSubmitting ? (
              <Button 
                onClick={handleSubmitAnswer} 
                disabled={!state.selectedAnswer}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                size="lg"
              >
                {state.selectedAnswer ? 'Submit Answer' : 'Select an answer to continue'}
              </Button>
            ) : (
              <div className="text-center py-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-4">
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="text-blue-700 font-medium">Processing your answer...</span>
                  </div>
                  <p className="text-blue-600 text-sm">Moving to next question automatically</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedPlacementTest;
