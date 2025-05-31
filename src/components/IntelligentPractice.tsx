
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useIntelligentTutor } from '@/hooks/useIntelligentTutor';
import { BookOpen, Target, Clock, CheckCircle, XCircle, Lightbulb } from 'lucide-react';

interface IntelligentPracticeProps {
  topicId?: string;
}

const IntelligentPractice: React.FC<IntelligentPracticeProps> = ({ topicId }) => {
  const {
    loading,
    currentExercise,
    sessionData,
    currentExerciseIndex,
    userAnswer,
    setUserAnswer,
    feedback,
    showFeedback,
    getPersonalizedExercises,
    submitAnswer,
    nextExercise,
    isLastExercise,
    progress
  } = useIntelligentTutor();

  React.useEffect(() => {
    if (topicId) {
      getPersonalizedExercises(topicId);
    }
  }, [topicId]);

  if (loading && !currentExercise) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Generating personalized exercises...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentExercise) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Select a topic to start practicing</p>
        </CardContent>
      </Card>
    );
  }

  const renderExerciseInput = () => {
    switch (currentExercise.type) {
      case 'multiple-choice':
        return (
          <RadioGroup value={userAnswer} onValueChange={setUserAnswer}>
            {currentExercise.content.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case 'fill-blank':
        return (
          <Input
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="text-lg"
            disabled={showFeedback}
          />
        );
      
      case 'error-correction':
        return (
          <Textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Correct the sentence..."
            className="min-h-[100px]"
            disabled={showFeedback}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Exercise {currentExerciseIndex + 1}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                ~{currentExercise.estimated_time_seconds}s
              </span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
            <span>Progress: {Math.round(progress)}%</span>
            {sessionData && (
              <Badge variant="outline">
                Difficulty: {sessionData.target_difficulty}/10
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exercise Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Practice Exercise</span>
            <Badge variant="secondary" className="capitalize">
              {currentExercise.type.replace('-', ' ')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-lg font-medium text-blue-900">
              {currentExercise.content.question}
            </p>
          </div>

          {/* Answer Input */}
          <div className="space-y-4">
            {renderExerciseInput()}
          </div>

          {/* Hints */}
          {currentExercise.content.hints && currentExercise.content.hints.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Lightbulb className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Hints:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-yellow-700">
                {currentExercise.content.hints.map((hint, index) => (
                  <li key={index} className="text-sm">{hint}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Feedback */}
          {showFeedback && feedback && (
            <div className={`p-4 rounded-lg ${feedback.is_correct ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center space-x-2 mb-3">
                {feedback.is_correct ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={`font-medium ${feedback.is_correct ? 'text-green-800' : 'text-red-800'}`}>
                  {feedback.is_correct ? 'Correct!' : 'Not quite right'}
                </span>
              </div>
              
              <div className="space-y-3">
                <p className={feedback.is_correct ? 'text-green-700' : 'text-red-700'}>
                  {feedback.feedback.message}
                </p>
                
                {!feedback.is_correct && (
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm font-medium text-gray-700">Correct answer:</p>
                    <p className="text-green-600 font-medium">{feedback.correct_answer}</p>
                  </div>
                )}
                
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm font-medium text-gray-700 mb-1">Explanation:</p>
                  <p className="text-gray-600 text-sm">{feedback.explanation}</p>
                </div>
                
                {feedback.feedback.tip && (
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="text-sm font-medium text-blue-700 mb-1">Tip:</p>
                    <p className="text-blue-600 text-sm">{feedback.feedback.tip}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            {!showFeedback ? (
              <Button 
                onClick={submitAnswer} 
                disabled={!userAnswer.trim() || loading}
                className="w-full"
              >
                {loading ? 'Checking...' : 'Submit Answer'}
              </Button>
            ) : (
              <Button 
                onClick={nextExercise}
                disabled={isLastExercise}
                className="w-full"
              >
                {isLastExercise ? 'Practice Complete!' : 'Next Exercise'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntelligentPractice;
