
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Target, BookOpen, TrendingUp, Clock, Zap, Award, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { usePlacementTestLogic } from '@/hooks/usePlacementTestLogic';
import LoadingState from './LoadingState';

const PlacementTest = () => {
  const { state, startTest, submitAnswer, resetTest, setSelectedAnswer, previousQuestion } = usePlacementTestLogic();
  const [selectedTestType, setSelectedTestType] = useState<'quick' | 'comprehensive'>('quick');

  const testProgress = state.testStarted ? ((state.currentQuestion + 1) / state.questions.length) * 100 : 0;
  const timeElapsed = state.startTime ? Math.floor((Date.now() - state.startTime.getTime()) / 1000 / 60) : 0;

  if (state.loading && !state.testStarted) {
    return <LoadingState message={`Preparing your ${state.testType} assessment...`} />;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="space-y-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-500" />
            <span>English Placement Assessment</span>
          </CardTitle>
          <CardDescription>
            Get an accurate assessment of your English proficiency level with personalized recommendations.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {state.error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
              <p className="font-medium">Assessment Error</p>
              <p className="text-sm">{state.error}</p>
              <Button variant="outline" size="sm" onClick={resetTest} className="mt-2">
                Try Again
              </Button>
            </div>
          )}

          {!state.testStarted && !state.testCompleted && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card 
                  className={`cursor-pointer transition-all ${selectedTestType === 'quick' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                  onClick={() => setSelectedTestType('quick')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <Zap className="h-6 w-6 text-blue-500" />
                      <h3 className="font-semibold text-lg">Quick Assessment</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>5 minutes</span>
                      </li>
                      <li>• 5 targeted questions</li>
                      <li>• Basic level estimation</li>
                      <li>• Instant results</li>
                      <li>• 50+ XP reward</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all ${selectedTestType === 'comprehensive' ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:bg-gray-50'}`}
                  onClick={() => setSelectedTestType('comprehensive')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <Award className="h-6 w-6 text-purple-500" />
                      <h3 className="font-semibold text-lg">Comprehensive Assessment</h3>
                      <Badge className="bg-purple-100 text-purple-700">Recommended</Badge>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>15 minutes</span>
                      </li>
                      <li>• 15 detailed questions</li>
                      <li>• Precise level assessment</li>
                      <li>• Detailed topic analysis</li>
                      <li>• 100+ XP reward</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center">
                <Button 
                  onClick={() => startTest(selectedTestType)} 
                  disabled={state.loading}
                  size="lg"
                  className={selectedTestType === 'comprehensive' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                >
                  {state.loading ? 'Loading...' : `Start ${selectedTestType === 'quick' ? 'Quick' : 'Comprehensive'} Assessment`}
                </Button>
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
                    <Badge variant="outline" className={state.testType === 'comprehensive' ? 'border-purple-200 text-purple-700' : ''}>
                      {state.testType === 'quick' ? 'Quick' : 'Comprehensive'} Assessment
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{timeElapsed} min / ~{state.estimatedTime} min</span>
                  </div>
                </div>
                <Progress value={testProgress} className="h-3" />
              </div>

              {/* Question */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-6">
                  <div className="mb-4">
                    {state.questions[state.currentQuestion].level && (
                      <Badge variant="secondary" className="mb-3">
                        Level: {state.questions[state.currentQuestion].level}
                      </Badge>
                    )}
                    <h4 className="text-xl font-medium text-gray-800">
                      {state.questions[state.currentQuestion].question}
                    </h4>
                  </div>

                  <RadioGroup value={state.selectedAnswer} onValueChange={setSelectedAnswer} className="space-y-3">
                    {state.questions[state.currentQuestion].options.map((option) => (
                      <div key={option} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/60 transition-colors">
                        <RadioGroupItem value={option} id={option} />
                        <Label htmlFor={option} className="cursor-pointer text-base">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex justify-between items-center">
                <Button 
                  variant="outline" 
                  onClick={previousQuestion}
                  disabled={state.currentQuestion === 0}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>

                <Button 
                  onClick={submitAnswer} 
                  disabled={!state.selectedAnswer || state.loading}
                  className="flex items-center space-x-2"
                >
                  {state.loading ? (
                    'Processing...'
                  ) : state.currentQuestion === state.questions.length - 1 ? (
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
