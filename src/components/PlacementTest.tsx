import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Target, BookOpen, TrendingUp, Clock, Award, ArrowRight, Star, X, Lightbulb, Brain, AlertCircle } from 'lucide-react';
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
      await generateQuestions(200, 'mixed');
      alert('Successfully generated 200 new assessment questions!');
    } catch (error) {
      alert('Failed to generate questions. Please ensure your OpenAI API key is configured.');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  if (state.loading && !state.testStarted) {
    return <LoadingState message="Preparing your comprehensive assessment..." />;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="space-y-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-500" />
            <span>Comprehensive English Assessment</span>
          </CardTitle>
          <CardDescription>
            Take a detailed 15-question assessment with immediate feedback and comprehensive explanations.
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
                    <Award className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="font-semibold text-xl">Comprehensive Assessment</h3>
                      <Badge className="bg-blue-100 text-blue-700 mt-1">Enhanced with AI Feedback</Badge>
                    </div>
                  </div>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <span><strong>Duration:</strong> 20 minutes (15 questions)</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <Brain className="h-5 w-5 text-blue-500" />
                      <span><strong>Immediate Feedback:</strong> Detailed explanations after each question</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <Lightbulb className="h-5 w-5 text-blue-500" />
                      <span><strong>First Principles:</strong> Deep understanding of grammar concepts</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <Target className="h-5 w-5 text-blue-500" />
                      <span><strong>Personalized:</strong> No repeated questions, tailored to your level</span>
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
                  {state.loading ? 'Loading...' : 'Start Comprehensive Assessment'}
                </Button>
                
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">Admin: Generate more questions for the database</p>
                  <Button 
                    onClick={handleGenerateQuestions}
                    disabled={isGeneratingQuestions}
                    variant="outline"
                    size="sm"
                  >
                    {isGeneratingQuestions ? 'Generating...' : 'Generate 200 Questions'}
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
                      Comprehensive Assessment
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{timeElapsed} min</span>
                  </div>
                </div>
                <Progress value={testProgress} className="h-3" />
              </div>

              {!state.showingFeedback ? (
                // Question Display
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
                        onClick={submitAnswer} 
                        disabled={!state.selectedAnswer || state.loading}
                        className="flex items-center space-x-2"
                      >
                        {state.loading ? (
                          'Checking...'
                        ) : (
                          <>
                            <span>Submit Answer</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // Feedback Display
                state.currentFeedback && (
                  <Card className={`border-2 ${state.currentFeedback.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Result Header */}
                        <div className="flex items-center space-x-3">
                          {state.currentFeedback.isCorrect ? (
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          ) : (
                            <X className="h-8 w-8 text-red-600" />
                          )}
                          <div>
                            <h3 className={`text-xl font-semibold ${state.currentFeedback.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                              {state.currentFeedback.isCorrect ? 'Correct!' : 'Incorrect'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              The correct answer is: <strong>{state.currentFeedback.correctAnswer}</strong>
                            </p>
                          </div>
                        </div>

                        {/* Basic Explanation */}
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-medium text-gray-800 mb-2 flex items-center space-x-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            <span>Explanation</span>
                          </h4>
                          <p className="text-gray-700">{state.currentFeedback.explanation}</p>
                        </div>

                        {/* Detailed Explanation */}
                        {state.currentFeedback.detailedExplanation && (
                          <div className="bg-white p-4 rounded-lg">
                            <h4 className="font-medium text-gray-800 mb-2 flex items-center space-x-2">
                              <BookOpen className="h-4 w-4 text-blue-500" />
                              <span>Detailed Analysis</span>
                            </h4>
                            <p className="text-gray-700">{state.currentFeedback.detailedExplanation}</p>
                          </div>
                        )}

                        {/* First Principles */}
                        {state.currentFeedback.firstPrinciplesExplanation && (
                          <div className="bg-white p-4 rounded-lg">
                            <h4 className="font-medium text-gray-800 mb-2 flex items-center space-x-2">
                              <Brain className="h-4 w-4 text-purple-500" />
                              <span>First Principles</span>
                            </h4>
                            <p className="text-gray-700">{state.currentFeedback.firstPrinciplesExplanation}</p>
                          </div>
                        )}

                        {/* Wrong Answer Explanations */}
                        {!state.currentFeedback.isCorrect && state.currentFeedback.wrongAnswerExplanations && (
                          <div className="bg-white p-4 rounded-lg">
                            <h4 className="font-medium text-gray-800 mb-2">Why other answers are incorrect:</h4>
                            <div className="space-y-2">
                              {Object.entries(state.currentFeedback.wrongAnswerExplanations).map(([answer, explanation]) => (
                                <div key={answer} className="text-sm">
                                  <span className="font-medium text-red-600">"{answer}":</span>
                                  <span className="text-gray-700 ml-2">{explanation}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end">
                          <Button onClick={nextQuestion} className="flex items-center space-x-2">
                            {state.currentQuestion === state.questions.length - 1 ? (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                <span>Complete Assessment</span>
                              </>
                            ) : (
                              <>
                                <span>Next Question</span>
                                <ArrowRight className="h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}

          {state.loading && state.testStarted && (
            <LoadingState message="Evaluating your responses and calculating results..." />
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
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Assessment Complete!</h2>
                  <p className="text-lg text-gray-600">{state.testResults.detailedFeedback.message}</p>
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
                      <div className="text-sm text-green-600">Score</div>
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
