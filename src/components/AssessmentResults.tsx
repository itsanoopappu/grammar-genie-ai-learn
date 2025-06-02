
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Target, BookOpen, TrendingUp, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface QuestionReview {
  id: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  grammarTopic: string;
  level: string;
  options?: string[];
}

interface WeakArea {
  topic: string;
  category: string;
  accuracy: number;
  questionsAttempted: number;
  level: string;
  recommendations: string[];
}

interface StrengthArea {
  topic: string;
  category: string;
  accuracy: number;
  questionsAttempted: number;
  level: string;
}

interface PracticeDrill {
  id: string;
  title: string;
  description: string;
  topic: string;
  level: string;
  estimatedTime: number;
  exercises: number;
  priority: 'high' | 'medium' | 'low';
}

interface AssessmentResultsProps {
  results: {
    score: number;
    weightedScore: number;
    recommendedLevel: string;
    confidence: number;
    totalQuestions: number;
    questionsAnswered: number;
    levelBreakdown: Record<string, { correct: number; total: number; accuracy: number }>;
    grammarBreakdown: Record<string, { correct: number; total: number; accuracy: number }>;
    detailedFeedback: {
      message: string;
      nextSteps: string[];
    };
  };
  questionReviews: QuestionReview[];
  onRestart: () => void;
}

const AssessmentResults: React.FC<AssessmentResultsProps> = ({ 
  results, 
  questionReviews, 
  onRestart 
}) => {
  // Analyze weak areas (accuracy < 60%)
  const weakAreas: WeakArea[] = Object.entries(results.grammarBreakdown)
    .filter(([_, performance]) => performance.accuracy < 0.6 && performance.total > 0)
    .map(([topic, performance]) => ({
      topic,
      category: 'Grammar',
      accuracy: performance.accuracy,
      questionsAttempted: performance.total,
      level: results.recommendedLevel,
      recommendations: [
        `Practice ${topic.toLowerCase()} exercises daily`,
        `Review ${topic.toLowerCase()} rules and examples`,
        `Complete focused drills on ${topic.toLowerCase()}`
      ]
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  // Analyze strength areas (accuracy >= 80%)
  const strengthAreas: StrengthArea[] = Object.entries(results.grammarBreakdown)
    .filter(([_, performance]) => performance.accuracy >= 0.8 && performance.total > 0)
    .map(([topic, performance]) => ({
      topic,
      category: 'Grammar',
      accuracy: performance.accuracy,
      questionsAttempted: performance.total,
      level: results.recommendedLevel
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  // Generate practice drills based on weak areas
  const practicedrills: PracticeDrill[] = weakAreas.slice(0, 5).map((weak, index) => ({
    id: `drill-${index}`,
    title: `${weak.topic} Intensive Practice`,
    description: `Focused exercises to improve your ${weak.topic.toLowerCase()} skills`,
    topic: weak.topic,
    level: weak.level,
    estimatedTime: 15 + (index * 5),
    exercises: 10 + (index * 2),
    priority: weak.accuracy < 0.3 ? 'high' : weak.accuracy < 0.5 ? 'medium' : 'low'
  }));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getLevelColor = (level: string) => {
    const colors = {
      'A1': 'bg-green-100 text-green-800',
      'A2': 'bg-blue-100 text-blue-800',
      'B1': 'bg-yellow-100 text-yellow-800',
      'B2': 'bg-orange-100 text-orange-800',
      'C1': 'bg-purple-100 text-purple-800',
      'C2': 'bg-red-100 text-red-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Overall Results Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-6 w-6 text-blue-600" />
            <span>Assessment Complete!</span>
          </CardTitle>
          <CardDescription>
            Your English level assessment results and personalized recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold ${getLevelColor(results.recommendedLevel)}`}>
                Your Level: {results.recommendedLevel}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {results.confidence}% confidence
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(results.score)}%
              </div>
              <p className="text-sm text-gray-600">Overall Score</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {results.questionsAnswered}/{results.totalQuestions}
              </div>
              <p className="text-sm text-gray-600">Questions Completed</p>
            </div>
          </div>
          <Progress value={results.score} className="h-3" />
          <p className="text-sm text-gray-700">{results.detailedFeedback.message}</p>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="review">Question Review</TabsTrigger>
          <TabsTrigger value="drills">Practice Drills</TabsTrigger>
          <TabsTrigger value="progress">Next Steps</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Your Strengths</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {strengthAreas.length > 0 ? (
                  <div className="space-y-3">
                    {strengthAreas.map((strength, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <div className="font-medium text-green-900">{strength.topic}</div>
                          <div className="text-sm text-green-700">
                            {strength.questionsAttempted} questions
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-800">
                            {Math.round(strength.accuracy * 100)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Complete more questions to identify your strengths
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Weak Areas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span>Areas for Improvement</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weakAreas.length > 0 ? (
                  <div className="space-y-3">
                    {weakAreas.map((weak, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div>
                          <div className="font-medium text-orange-900">{weak.topic}</div>
                          <div className="text-sm text-orange-700">
                            {weak.questionsAttempted} questions
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-orange-800">
                            {Math.round(weak.accuracy * 100)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Great job! No major weak areas identified
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span>Question by Question Review</span>
              </CardTitle>
              <CardDescription>
                Review your answers with detailed explanations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questionReviews.map((review, index) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Question {index + 1}</span>
                        <Badge variant={review.isCorrect ? "default" : "destructive"}>
                          {review.grammarTopic}
                        </Badge>
                        <Badge variant="outline">{review.level}</Badge>
                      </div>
                      <div className="flex items-center space-x-1">
                        {review.isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-gray-900">{review.question}</p>
                      </div>
                      
                      {review.options && (
                        <div className="grid grid-cols-2 gap-2">
                          {review.options.map((option, optIndex) => (
                            <div 
                              key={optIndex}
                              className={`p-2 rounded text-sm ${
                                option === review.correctAnswer 
                                  ? 'bg-green-100 text-green-800 border border-green-300' 
                                  : option === review.userAnswer && !review.isCorrect
                                  ? 'bg-red-100 text-red-800 border border-red-300'
                                  : 'bg-gray-50 text-gray-700'
                              }`}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Your answer: </span>
                          <span className={review.isCorrect ? 'text-green-600' : 'text-red-600'}>
                            {review.userAnswer}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Correct answer: </span>
                          <span className="text-green-600">{review.correctAnswer}</span>
                        </div>
                      </div>
                      
                      {review.explanation && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm text-blue-900">
                            <strong>Explanation:</strong> {review.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-purple-600" />
                <span>Recommended Practice Drills</span>
              </CardTitle>
              <CardDescription>
                Personalized practice activities based on your weak areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {practicedrills.length > 0 ? (
                <div className="space-y-4">
                  {practicedrills.map((drill) => (
                    <div key={drill.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{drill.title}</h4>
                          <p className="text-sm text-gray-600">{drill.description}</p>
                        </div>
                        <Badge variant={getPriorityColor(drill.priority)}>
                          {drill.priority} priority
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>📚 Topic: {drill.topic}</span>
                        <span>⏱️ {drill.estimatedTime} min</span>
                        <span>📝 {drill.exercises} exercises</span>
                        <Badge variant="outline">{drill.level}</Badge>
                      </div>
                      
                      <Button className="mt-3" variant="outline" size="sm">
                        Start Practice
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Excellent work! You don't have any specific weak areas that need immediate attention.
                  Continue practicing at your current level to maintain your skills.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Your Learning Path</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Immediate Next Steps:</h4>
                  <ul className="space-y-1">
                    {results.detailedFeedback.nextSteps.map((step, index) => (
                      <li key={index} className="text-sm text-blue-800">
                        • {step}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {weakAreas.length > 0 && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-medium text-orange-900 mb-2">Weekly Focus Areas:</h4>
                    <ul className="space-y-1">
                      {weakAreas.slice(0, 3).map((weak, index) => (
                        <li key={index} className="text-sm text-orange-800">
                          • Dedicate 15-20 minutes daily to {weak.topic.toLowerCase()} practice
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Maintain Your Strengths:</h4>
                  <ul className="space-y-1">
                    {strengthAreas.slice(0, 3).map((strength, index) => (
                      <li key={index} className="text-sm text-green-800">
                        • Keep practicing {strength.topic.toLowerCase()} to maintain your {Math.round(strength.accuracy * 100)}% accuracy
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-center">
        <Button onClick={onRestart} variant="outline" size="lg">
          Take Another Assessment
        </Button>
      </div>
    </div>
  );
};

export default AssessmentResults;
