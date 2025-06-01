import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Target, BookOpen, TrendingUp, Clock, Award, ArrowRight, Star, Lightbulb, Brain, AlertCircle, BarChart3 } from 'lucide-react';
import { usePlacementTestLogic } from '@/hooks/usePlacementTestLogic';
import LoadingState from './LoadingState';

const PlacementTest = () => {
  const { state, startTest, submitAnswer, nextQuestion, resetTest, setSelectedAnswer, generateQuestions } = usePlacementTestLogic();
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  const testProgress = state.testStarted ? ((state.currentQuestion + 1) / state.questions.length) * 100 : 0;
  const timeElapsed = state.startTime ? Math.floor((Date.now() - state.startTime.getTime()) / 1000 / 60) : 0;

  const handleGenerateQuestions = async () => {
    setIsGeneratingQuestions(true);
    try {
      await generateQuestions(30, 'mixed'); // Generate 30 questions (5 per level)
      alert('Successfully generated 30 new assessment questions (5 per level A1-C2)!');
    } catch (error) {
      alert('Failed to generate questions. Please ensure your OpenAI API key is configured.');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  if (state.loading && !state.testStarted) {
    return <LoadingState message="Preparing your balanced assessment with questions from all levels..." />;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="space-y-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-500" />
            <span>Balanced English Assessment</span>
          </CardTitle>
          <CardDescription>
            Take a carefully balanced assessment with questions from all proficiency levels (A1-C2).
          </CardDescription>
        </CardHeader>

        <CardContent>
          {state.error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4" />
                <p className="font-medium">Assessment Error</p>
              </div>
              <p className="text-sm mt-1">{state.error}</p>
              <Button variant="outline" size="sm" onClick={resetTest} className="mt-2">
                Try Again
              </Button>
            </div>
          )}

          {!state.testStarted && !state.testCompleted && (
            <div className="space-y-6">
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <BarChart3 className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="font-semibold text-xl">Balanced Multi-Level Assessment</h3>
                      <Badge className="bg-blue-100 text-blue-700 mt-1">Smart Question Distribution</Badge>
                    </div>
                  </div>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <span><strong>Duration:</strong> 20 minutes (15 carefully selected questions)</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      <span><strong>Balanced:</strong> 2-3 questions from each level (A1, A2, B1, B2, C1, C2)</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <Brain className="h-5 w-5 text-blue-500" />
                      <span><strong>Focused:</strong> No distractions during the test</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <Lightbulb className="h-5 w-5 text-blue-500" />
                      <span><strong>Complete Review:</strong> Detailed feedback and explanations after completion</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <Award className="h-5 w-5 text-blue-500" />
                      <span><strong>Rewards:</strong> 100+ XP based on performance</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <div className="text-center space-y-4">
                <Button 
                  onClick={startTest} 
                  disabled={state.loading}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {state.loading ? 'Preparing Balanced Assessment...' : 'Start Balanced Assessment'}
                </Button>
                
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">Admin: Generate 30 questions (5 per level)</p>
                  <Button 
                    onClick={handleGenerateQuestions}
                    disabled={isGeneratingQuestions}
                    variant="outline"
                    size="sm"
                  >
                    {isGeneratingQuestions ? 'Generating 30 Questions...' : 'Generate 30 Questions (5 per level)'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {state.testStarted && !state.testCompleted && state.questions.length > 0 && (
            <div className="space-y-6">
              {/* Progress Header */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold">
                      Question {state.currentQuestion + 1} of {state.questions.length}
                    </h3>
                    <Badge variant="outline" className="border-blue-200 text-blue-700">
                      Balanced Assessment
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{timeElapsed} min</span>
                  </div>
                </div>
                <Progress value={testProgress} className="h-3" />
              </div>

              {/* Question Display */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-3">
                      {state.questions[state.currentQuestion].level && (
                        <Badge variant="secondary">
                          Level: {state.questions[state.currentQuestion].level}
                        </Badge>
                      )}
                      {state.questions[state.currentQuestion].topic && (
                        <Badge variant="outline">
                          {state.questions[state.currentQuestion].topic}
                        </Badge>
                      )}
                    </div>
                    <h4 className="text-xl font-medium text-gray-800">
                      {state.questions[state.currentQuestion].question}
                    </h4>
                  </div>

                  <RadioGroup value={state.selectedAnswer} onValueChange={setSelectedAnswer} className="space-y-3">
                    {state.questions[state.currentQuestion].options.map((option) => (
                      <div key={option} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/60 transition-colors">
                        <RadioGroupItem value={option} id={option} />
                        <Label htmlFor={option} className="cursor-pointer text-base flex-1">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  <div className="mt-6 flex justify-end">
                    <Button 
                      onClick={() => {
                        submitAnswer().then(() => {
                          nextQuestion();
                        });
                      }} 
                      disabled={!state.selectedAnswer || state.loading}
                      className="flex items-center space-x-2"
                    >
                      {state.loading ? (
                        'Recording...'
                      ) : (
                        <>
                          <span>{state.currentQuestion === state.questions.length - 1 ? 'Complete Assessment' : 'Next Question'}</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {state.loading && state.testStarted && (
            <LoadingState message="Evaluating your responses across all proficiency levels..." />
          )}

          {state.testCompleted && state.testResults && (
            <div className="space-y-6">
              {/* Results Header */}
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                    <Star className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1" />
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Balanced Assessment Complete!</h2>
                  <p className="text-lg text-gray-600">{state.testResults.detailedFeedback.message}</p>
                  <Badge className="bg-green-100 text-green-700 mt-2">
                    Questions from all proficiency levels analyzed
                  </Badge>
                </div>
                
                {/* Key Results */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-blue-700 mb-1">
                        {state.testResults.recommendedLevel}
                      </div>
                      <div className="text-sm text-blue-600">Your Level</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-green-700 mb-1">
                        {Math.round(state.testResults.score)}%
                      </div>
                      <div className="text-sm text-green-600">Overall Score</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-purple-700 mb-1">
                        +{state.testResults.xpEarned}
                      </div>
                      <div className="text-sm text-purple-600">XP Earned</div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Level Performance Breakdown */}
              {state.testResults.levelBreakdown && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      <span>Performance by Level</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(state.testResults.levelBreakdown).map(([level, correct]) => (
                        <div key={level} className="text-center p-3 rounded-lg bg-gray-50">
                          <div className="text-lg font-semibold text-gray-800">{level}</div>
                          <div className="text-sm text-gray-600">{correct} correct</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Detailed Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Your Strengths</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {state.testResults.strengths.length > 0 ? (
                      <ul className="space-y-2">
                        {state.testResults.strengths.map((strength, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                            <span className="text-green-700">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm">Keep practicing to develop your strengths!</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-orange-500" />
                      <span>Areas to Improve</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {state.testResults.weaknesses.length > 0 ? (
                      <ul className="space-y-2">
                        {state.testResults.weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <Target className="h-4 w-4 text-orange-500 shrink-0" />
                            <span className="text-orange-700">{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm">Great job! No major weaknesses identified.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Next Steps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <span>Recommended Next Steps</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {state.testResults.detailedFeedback.nextSteps.map((step, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <Badge variant="outline" className="mt-0.5 shrink-0">
                          {index + 1}
                        </Badge>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Question Review Section */}
              {state.testResults.detailedFeedback.questionReview && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5 text-blue-500" />
                      <span>Complete Question Review & Explanations</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {state.testResults.detailedFeedback.questionReview.map((review: any, index: number) => (
                      <div key={index} className={`p-4 rounded-lg border ${review.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-start space-x-3 mb-3">
                          {review.isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-red-600 flex items-center justify-center mt-0.5">
                              <span className="text-white text-xs">✗</span>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="secondary" className="text-xs">
                                {review.level}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {review.topic}
                              </Badge>
                            </div>
                            <p className="font-medium mb-2">{review.question}</p>
                            <div className="text-sm space-y-1">
                              <p><strong>Your answer:</strong> {review.userAnswer}</p>
                              <p><strong>Correct answer:</strong> {review.correctAnswer}</p>
                              <p className="text-blue-700"><strong>Explanation:</strong> {review.explanation}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={resetTest}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Take Another Assessment</span>
                </Button>
                <Button 
                  onClick={() => window.location.hash = '#smart-practice'}
                  className="flex items-center space-x-2"
                >
                  <Target className="h-4 w-4" />
                  <span>Start Smart Practice</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlacementTest;
