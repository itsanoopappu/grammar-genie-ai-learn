import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Clock, Target, Zap } from 'lucide-react';
import { usePlacementTestLogic } from '@/hooks/usePlacementTestLogic';
import { useAdaptivePlacementTest } from '@/hooks/useAdaptivePlacementTest';
import LoadingState from './LoadingState';
import AssessmentResults from './AssessmentResults';

const PlacementTest = () => {
  const [assessmentMode, setAssessmentMode] = useState<'comprehensive' | 'adaptive' | null>(null);
  
  // Regular placement test logic
  const {
    state: regularState,
    startTest,
    submitAnswer,
    nextQuestion,
    resetTest,
    setSelectedAnswer
  } = usePlacementTestLogic();

  // Adaptive placement test logic
  const {
    state: adaptiveState,
    startAdaptiveTest,
    submitAdaptiveAnswer,
    loadNextAdaptiveQuestion,
    resetAdaptiveTest,
    setSelectedAnswer: setAdaptiveSelectedAnswer
  } = useAdaptivePlacementTest();

  // Use the appropriate state based on selected mode
  const currentState = assessmentMode === 'adaptive' ? adaptiveState : regularState;
  const isAdaptive = assessmentMode === 'adaptive';

  const handleStartAssessment = async (mode: 'comprehensive' | 'adaptive') => {
    setAssessmentMode(mode);
    if (mode === 'adaptive') {
      await startAdaptiveTest();
    } else {
      await startTest('comprehensive');
    }
  };

  const handleSubmitAnswer = async () => {
    if (isAdaptive) {
      await submitAdaptiveAnswer();
      await loadNextAdaptiveQuestion();
    } else {
      await submitAnswer();
      nextQuestion();
    }
  };

  const handleReset = () => {
    setAssessmentMode(null);
    if (isAdaptive) {
      resetAdaptiveTest();
    } else {
      resetTest();
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (isAdaptive) {
      setAdaptiveSelectedAnswer(answer);
    } else {
      setSelectedAnswer(answer);
    }
  };

  if (!assessmentMode) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Grammar Assessment</h1>
          <p className="text-lg text-gray-600">
            Choose your assessment type to discover your English level and get personalized recommendations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Comprehensive Assessment */}
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-300">
            <CardHeader>
              <div className="flex items-center space-x-2 mb-2">
                <Brain className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-xl">Comprehensive Assessment</CardTitle>
              </div>
              <CardDescription>
                Complete evaluation across all English levels (A1-C2)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>20-25 minutes</span>
                  </span>
                  <Badge variant="outline">15 questions</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Target className="h-4 w-4" />
                    <span>Covers all grammar topics</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Target className="h-4 w-4" />
                    <span>Balanced difficulty distribution</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Target className="h-4 w-4" />
                    <span>Detailed performance analysis</span>
                  </div>
                </div>
                <Button 
                  onClick={() => handleStartAssessment('comprehensive')} 
                  className="w-full"
                  disabled={currentState.loading}
                >
                  Start Comprehensive Assessment
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Adaptive Assessment */}
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-300">
            <CardHeader>
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="h-6 w-6 text-purple-600" />
                <CardTitle className="text-xl">Adaptive Assessment</CardTitle>
              </div>
              <CardDescription>
                Smart assessment that adapts to your responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>15-20 minutes</span>
                  </span>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">15 questions</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Target className="h-4 w-4" />
                    <span>Adjusts difficulty in real-time</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Target className="h-4 w-4" />
                    <span>Focuses on your level range</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Target className="h-4 w-4" />
                    <span>Efficient and precise</span>
                  </div>
                </div>
                <Button 
                  onClick={() => handleStartAssessment('adaptive')} 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={currentState.loading}
                >
                  Start Adaptive Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-gray-500 mt-6">
          <p>Both assessments provide detailed feedback and personalized learning recommendations</p>
        </div>
      </div>
    );
  }

  if (currentState.loading && !currentState.testStarted) {
    return <LoadingState message={`Starting your ${assessmentMode} assessment...`} />;
  }

  if (currentState.testCompleted && currentState.testResults) {
    return (
      <AssessmentResults
        results={currentState.testResults}
        onRetakeTest={handleReset}
        onContinuePractice={() => {
          // Navigate to practice - placeholder for now
          console.log('Navigate to practice');
        }}
      />
    );
  }

  if (!currentState.testStarted || currentState.questions.length === 0) {
    return <LoadingState message="Loading assessment questions..." />;
  }

  // Fix: Use correct property names based on assessment type
  const getCurrentQuestionIndex = () => {
    if (isAdaptive) {
      return (adaptiveState as any).currentQuestionIndex || 0;
    } else {
      return (regularState as any).currentQuestion || 0;
    }
  };

  const currentQuestionIndex = getCurrentQuestionIndex();
  const currentQuestion = currentState.questions[currentQuestionIndex];
  
  if (!currentQuestion) {
    return <LoadingState message="Loading next question..." />;
  }

  const questionNumber = currentQuestionIndex + 1;
  const progress = ((questionNumber - 1) / currentState.questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {isAdaptive ? (
                <Zap className="h-5 w-5 text-purple-600" />
              ) : (
                <Brain className="h-5 w-5 text-blue-600" />
              )}
              <span className="font-medium">
                {isAdaptive ? 'Adaptive' : 'Comprehensive'} Assessment
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Question {questionNumber} of {currentState.questions.length}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          {isAdaptive && (adaptiveState as any).adaptiveProgression && (adaptiveState as any).adaptiveProgression.length > 0 && (
            <div className="flex items-center justify-center mt-2 space-x-1">
              <span className="text-xs text-gray-500">Current level:</span>
              <Badge variant="outline" className="text-xs">
                {(adaptiveState as any).currentDifficultyLevel || 'B1'}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{currentQuestion.level}</Badge>
            {currentQuestion.topic && (
              <Badge variant="secondary" className="text-xs">
                {currentQuestion.topic}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={currentState.selectedAnswer}
            onValueChange={handleAnswerSelect}
          >
            <div className="space-y-3">
              {currentQuestion.options?.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          <div className="flex justify-between items-center mt-6">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={currentState.loading}
            >
              Cancel Assessment
            </Button>
            <Button
              onClick={handleSubmitAnswer}
              disabled={!currentState.selectedAnswer || currentState.loading}
            >
              {currentState.loading ? 'Submitting...' : 'Next Question'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {currentState.error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{currentState.error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlacementTest;
