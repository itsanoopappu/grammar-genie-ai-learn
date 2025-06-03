
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Target, TrendingUp, BookOpen, Clock, Award, Brain } from 'lucide-react';

interface QuestionReview {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  detailedExplanation?: string;
  firstPrinciplesExplanation?: string;
  level: string;
  grammarCategory: string;
  grammarTopic: string;
  pointsEarned: number;
  hasCompleteMetadata: boolean;
}

interface GrammarPerformance {
  correct: number;
  total: number;
  accuracy: number;
}

interface TestResults {
  score: number;
  weightedScore?: number;
  totalPossibleScore?: number;
  recommendedLevel: string;
  confidence?: number;
  totalQuestions: number;
  questionsAnswered: number;
  adaptiveProgression?: string[];
  levelBreakdown: Record<string, { correct: number; total: number; points: number }>;
  grammarBreakdown?: Record<string, GrammarPerformance>;
  grammarTopicsUsed?: number;
  xpEarned: number;
  detailedFeedback: {
    message: string;
    nextSteps: string[];
    questionReview?: QuestionReview[];
  };
}

interface AssessmentResultsProps {
  results: TestResults;
  onRetakeTest: () => void;
  onContinuePractice?: () => void;
}

const AssessmentResults: React.FC<AssessmentResultsProps> = ({
  results,
  onRetakeTest,
  onContinuePractice
}) => {
  // Calculate current week (placeholder logic)
  const getCurrentWeek = () => {
    const startDate = new Date('2024-01-01'); // Placeholder start date
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
  };

  // Identify strong and weak grammar topics
  const getGrammarAnalysis = () => {
    if (!results.grammarBreakdown) {
      return { strongTopics: [], weakTopics: [] };
    }

    const strongTopics = Object.entries(results.grammarBreakdown)
      .filter(([_, performance]) => performance.accuracy >= 0.7)
      .map(([topic, performance]) => ({
        topic,
        accuracy: performance.accuracy,
        correct: performance.correct,
        total: performance.total
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    const weakTopics = Object.entries(results.grammarBreakdown)
      .filter(([_, performance]) => performance.accuracy < 0.7)
      .map(([topic, performance]) => ({
        topic,
        accuracy: performance.accuracy,
        correct: performance.correct,
        total: performance.total
      }))
      .sort((a, b) => a.accuracy - b.accuracy);

    return { strongTopics, weakTopics };
  };

  const { strongTopics, weakTopics } = getGrammarAnalysis();
  const currentWeek = getCurrentWeek();

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minutes`;
  };

  const getPracticeRecommendation = (topic: string, accuracy: number) => {
    if (accuracy < 0.3) return { level: 'Beginner', sessions: '5-7 sessions' };
    if (accuracy < 0.5) return { level: 'Basic', sessions: '3-4 sessions' };
    return { level: 'Intermediate', sessions: '2-3 sessions' };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Enhanced Session Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Award className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-2xl text-blue-800">Assessment Complete!</CardTitle>
          </div>
          <CardDescription className="text-lg">
            Week {currentWeek} of your learning journey • {results.questionsAnswered}/{results.totalQuestions} questions answered
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{Math.round(results.score)}%</div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{results.recommendedLevel}</div>
              <div className="text-sm text-gray-600">Your Level</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{strongTopics.length}</div>
              <div className="text-sm text-gray-600">Strong Topics</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{results.xpEarned}</div>
              <div className="text-sm text-gray-600">XP Earned</div>
            </div>
          </div>

          {results.adaptiveProgression && results.adaptiveProgression.length > 1 && (
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Adaptive Level Progression</div>
              <div className="flex items-center justify-center space-x-2">
                {results.adaptiveProgression.map((level, index) => (
                  <React.Fragment key={level}>
                    <Badge variant="outline" className="bg-white">
                      {level}
                    </Badge>
                    {index < results.adaptiveProgression!.length - 1 && (
                      <span className="text-gray-400">→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full bg-white/80 backdrop-blur-sm">
          <TabsTrigger value="overview" className="flex items-center space-x-2 flex-1">
            <TrendingUp className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex items-center space-x-2 flex-1">
            <Brain className="h-4 w-4" />
            <span>Question Review</span>
          </TabsTrigger>
          <TabsTrigger value="topics" className="flex items-center space-x-2 flex-1">
            <Target className="h-4 w-4" />
            <span>Topic Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="practice" className="flex items-center space-x-2 flex-1">
            <BookOpen className="h-4 w-4" />
            <span>Practice Plan</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Your Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span>Your Strengths</span>
                </CardTitle>
                <CardDescription>Grammar topics where you performed well (≥70% accuracy)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {strongTopics.length > 0 ? (
                    strongTopics.map((topic, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <div className="font-medium text-green-800">{topic.topic}</div>
                          <div className="text-sm text-green-600">
                            {topic.correct}/{topic.total} correct
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">
                            {Math.round(topic.accuracy * 100)}%
                          </Badge>
                          <div className="text-green-600">
                            {topic.accuracy >= 0.9 ? '🏆' : topic.accuracy >= 0.8 ? '⭐' : '✅'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      <Target className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>Complete more questions to identify your strengths!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Areas to Improve */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-700">
                  <Target className="h-5 w-5" />
                  <span>Areas to Improve</span>
                </CardTitle>
                <CardDescription>Grammar topics that need more practice (&lt;70% accuracy)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {weakTopics.length > 0 ? (
                    weakTopics.map((topic, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-orange-800">{topic.topic}</div>
                          <div className="text-sm text-orange-600">
                            {topic.correct}/{topic.total} correct
                          </div>
                          <div className="mt-1">
                            <Progress 
                              value={topic.accuracy * 100} 
                              className="h-2 bg-orange-100"
                            />
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <Badge variant="outline" className="text-orange-700 border-orange-300">
                            {Math.round(topic.accuracy * 100)}%
                          </Badge>
                          <div className="text-xs text-orange-600 mt-1">
                            Needs practice
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>Great job! No major areas need improvement.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="questions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Complete Question Diagnosis</CardTitle>
              <CardDescription>Detailed review of each question with explanations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.detailedFeedback.questionReview?.map((question, index) => (
                  <div key={index} className={`p-4 rounded-lg border-l-4 ${
                    question.isCorrect 
                      ? 'bg-green-50 border-green-400' 
                      : 'bg-red-50 border-red-400'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {question.isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className="font-medium">Question {index + 1}</span>
                        <Badge variant="outline">{question.level}</Badge>
                        <Badge className="bg-blue-100 text-blue-800">{question.grammarCategory}</Badge>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${question.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                          {question.pointsEarned > 0 ? '+' : ''}{question.pointsEarned} pts
                        </div>
                        <div className="text-xs text-gray-500">{question.grammarTopic}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="font-medium text-gray-800 mb-1">Question:</div>
                        <div className="text-gray-700">{question.question}</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-gray-600">Your Answer:</div>
                          <div className={`p-2 rounded ${
                            question.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {question.userAnswer}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-600">Correct Answer:</div>
                          <div className="p-2 rounded bg-green-100 text-green-800">
                            {question.correctAnswer}
                          </div>
                        </div>
                      </div>

                      {question.explanation && (
                        <div>
                          <div className="text-sm font-medium text-gray-600 mb-1">Explanation:</div>
                          <div className="text-gray-700 text-sm">{question.explanation}</div>
                        </div>
                      )}

                      {question.firstPrinciplesExplanation && (
                        <div>
                          <div className="text-sm font-medium text-gray-600 mb-1">First Principles:</div>
                          <div className="text-gray-700 text-sm bg-blue-50 p-2 rounded">
                            {question.firstPrinciplesExplanation}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )) || (
                  <div className="text-center text-gray-500 py-8">
                    <Brain className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Question review data not available for this assessment.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Grammar Topic Performance</CardTitle>
              <CardDescription>Detailed breakdown of your performance across grammar categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.grammarBreakdown ? (
                  Object.entries(results.grammarBreakdown).map(([topic, performance]) => (
                    <div key={topic} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-lg">{topic}</h3>
                        <div className="flex items-center space-x-2">
                          <Badge className={
                            performance.accuracy >= 0.8 ? 'bg-green-100 text-green-800' :
                            performance.accuracy >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {Math.round(performance.accuracy * 100)}%
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {performance.correct}/{performance.total}
                          </span>
                        </div>
                      </div>
                      <Progress value={performance.accuracy * 100} className="h-3" />
                      <div className="mt-2 text-sm text-gray-600">
                        {performance.accuracy >= 0.8 ? 'Excellent mastery!' :
                         performance.accuracy >= 0.6 ? 'Good understanding, room for improvement' :
                         'Needs focused practice'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Target className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Topic performance data not available for this assessment.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="practice" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Practice Plan</CardTitle>
              <CardDescription>Personalized recommendations based on your performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weakTopics.length > 0 ? (
                  weakTopics.map((topic, index) => {
                    const recommendation = getPracticeRecommendation(topic.topic, topic.accuracy);
                    return (
                      <div key={index} className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-lg">{topic.topic}</h3>
                            <div className="text-sm text-gray-600">
                              Current accuracy: {Math.round(topic.accuracy * 100)}%
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-white">
                            Priority: {topic.accuracy < 0.3 ? 'High' : topic.accuracy < 0.5 ? 'Medium' : 'Low'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="text-center p-3 bg-white rounded">
                            <div className="font-medium text-blue-600">{recommendation.level}</div>
                            <div className="text-xs text-gray-500">Recommended Level</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded">
                            <div className="font-medium text-purple-600">{recommendation.sessions}</div>
                            <div className="text-xs text-gray-500">Practice Sessions</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded">
                            <div className="font-medium text-green-600">15-20 min</div>
                            <div className="text-xs text-gray-500">Per Session</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            🎯 Target: Improve to 80%+ accuracy
                          </div>
                          <Button variant="outline" className="text-sm" disabled>
                            Continue to Smart Practice →
                            <span className="ml-1 text-xs">(Coming Soon)</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <div className="text-lg font-medium mb-2">Excellent Performance!</div>
                    <p>You're performing well across all topics. Consider taking a higher-level assessment to challenge yourself further.</p>
                    <Button variant="outline" className="mt-4" onClick={onRetakeTest}>
                      Take Advanced Assessment
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={onRetakeTest} variant="outline" className="flex items-center space-x-2">
          <Clock className="h-4 w-4" />
          <span>Retake Assessment</span>
        </Button>
        {onContinuePractice && (
          <Button onClick={onContinuePractice} className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>Continue Learning</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default AssessmentResults;
