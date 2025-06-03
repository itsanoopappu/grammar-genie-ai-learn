import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Target, Clock, Lightbulb } from 'lucide-react';
import { useOptimizedExercises } from '@/hooks/useOptimizedExercises';
import ExerciseDisplay from './ExerciseDisplay';
import ExerciseFeedback from './ExerciseFeedback';
import LoadingState from './LoadingState';

interface OptimizedIntelligentPracticeProps {
  topicId: string;
  onBackToTopics?: () => void;
}

const OptimizedIntelligentPractice: React.FC<OptimizedIntelligentPracticeProps> = ({ 
  topicId, 
  onBackToTopics 
}) => {
  const { 
    exercises, 
    loading, 
    error, 
    sessionCompleted, 
    sessionResults, 
    currentExerciseIndex, 
    score, 
    feedback, 
    userAnswer, 
    selectedOption, 
    setCurrentExerciseIndex, 
    setUserAnswer, 
    setSelectedOption, 
    submitAnswer, 
    loadNextExercise, 
    restartSession 
  } = useOptimizedExercises(topicId);

  if (loading) {
    return <LoadingState message="Loading practice exercises..." />;
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-red-600 mb-4">Error loading exercises: {error}</div>
            {onBackToTopics && (
              <Button onClick={onBackToTopics} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Topics
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sessionCompleted && sessionResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Session Complete!</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {Math.round(sessionResults.accuracy)}%
            </div>
            <p className="text-gray-600">
              You answered {sessionResults.correctAnswers} out of {sessionResults.totalQuestions} questions correctly
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{sessionResults.totalQuestions}</div>
              <div className="text-sm text-blue-600">Questions</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{sessionResults.correctAnswers}</div>
              <div className="text-sm text-green-600">Correct</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">+{sessionResults.xpEarned}</div>
              <div className="text-sm text-yellow-600">XP Earned</div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button onClick={restartSession}>
              Practice Again
            </Button>
            {onBackToTopics && (
              <Button onClick={onBackToTopics} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Topics
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!exercises.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Target className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Exercises Available</h3>
            <p className="text-gray-500 mb-4">No exercises found for this topic.</p>
            {onBackToTopics && (
              <Button onClick={onBackToTopics} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Topics
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentExercise = exercises[currentExerciseIndex];

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      {onBackToTopics && (
        <Button 
          onClick={onBackToTopics} 
          variant="outline" 
          size="sm"
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Topics
        </Button>
      )}

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span>Grammar Practice</span>
            </CardTitle>
            <Badge variant="outline">
              {currentExerciseIndex + 1} of {exercises.length}
            </Badge>
          </div>
          <CardDescription>
            Practice exercises to improve your grammar skills
          </CardDescription>
          <Progress 
            value={((currentExerciseIndex + 1) / exercises.length) * 100} 
            className="mt-2" 
          />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Exercise {currentExerciseIndex + 1}</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-4 w-4" />
              <span>Score: {score}/{currentExerciseIndex + (feedback ? 1 : 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Card */}
      <Card>
        <CardContent className="p-6">
          <ExerciseDisplay
            exercise={currentExercise}
            userAnswer={userAnswer}
            selectedOption={selectedOption}
            onAnswerChange={setUserAnswer}
            onOptionChange={setSelectedOption}
            disabled={feedback !== null}
          />

          {feedback && (
            <div className="mt-6">
              <ExerciseFeedback feedback={feedback} />
            </div>
          )}

          <div className="flex justify-between mt-6">
            <div className="flex items-center space-x-2">
              {currentExercise.content?.hints && currentExercise.content.hints.length > 0 && (
                <div className="text-sm text-gray-500 flex items-center space-x-1">
                  <Lightbulb className="h-4 w-4" />
                  <span>Hints available above</span>
                </div>
              )}
            </div>
            
            <div className="space-x-2">
              {!feedback ? (
                <Button 
                  onClick={submitAnswer}
                  disabled={loading || (!userAnswer.trim() && !selectedOption)}
                >
                  {loading ? 'Submitting...' : 'Submit Answer'}
                </Button>
              ) : (
                <Button onClick={loadNextExercise}>
                  {currentExerciseIndex === exercises.length - 1 ? 'Complete Session' : 'Next Exercise'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimizedIntelligentPractice;
