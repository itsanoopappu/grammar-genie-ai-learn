import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Target, CheckCircle, Clock, BookOpen, TrendingUp, Brain, Zap, Award, HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface Exercise {
  type: 'fill-blank' | 'multiple-choice' | 'transformation';
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
  difficulty: number;
  grammarConcept?: {
    name: string;
    explanation: string;
    examples: string[];
    tips: string[];
    commonMistakes: string[];
    resources: Array<{
      title: string;
      type: string;
      description: string;
    }>;
  };
}

interface Drill {
  id: number;
  topic: string;
  level: string;
  description: string;
  estimatedTime: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  completed: boolean;
  score?: number;
  recommended: boolean;
  priority?: 'high' | 'normal';
  reason?: string;
}

const DrillRecommendations = () => {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [drillInProgress, setDrillInProgress] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [exerciseResult, setExerciseResult] = useState<any>(null);
  const [drillScore, setDrillScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [personalizedDrills, setPersonalizedDrills] = useState<Drill[]>([]);
  const [conceptDialogOpen, setConceptDialogOpen] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<Exercise['grammarConcept'] | null>(null);
  const [loadingConcept, setLoadingConcept] = useState(false);

  const staticDrills: Drill[] = [
    {
      id: 1,
      topic: 'Present Perfect Tense',
      level: 'B1',
      description: 'Master the present perfect tense with real-world examples',
      estimatedTime: 15,
      difficulty: 'Medium',
      completed: false,
      recommended: true,
      priority: 'high',
      reason: 'Essential for intermediate level'
    },
    {
      id: 2,
      topic: 'Conditional Sentences',
      level: 'B2',
      description: 'Practice all types of conditional sentences',
      estimatedTime: 20,
      difficulty: 'Hard',
      completed: false,
      recommended: true,
      priority: 'high',
      reason: 'Challenging but important for fluency'
    },
    {
      id: 3,
      topic: 'Article Usage',
      level: 'A2',
      description: 'Learn when to use a, an, the, or no article',
      estimatedTime: 10,
      difficulty: 'Easy',
      completed: true,
      score: 85,
      recommended: false
    },
    {
      id: 4,
      topic: 'Passive Voice',
      level: 'B1',
      description: 'Transform active sentences to passive voice',
      estimatedTime: 12,
      difficulty: 'Medium',
      completed: true,
      score: 92,
      recommended: false
    },
    {
      id: 5,
      topic: 'Modal Verbs',
      level: 'B1',
      description: 'Practice using can, could, may, might, must, should',
      estimatedTime: 18,
      difficulty: 'Medium',
      completed: false,
      recommended: true,
      priority: 'normal',
      reason: 'Good for expanding expression'
    }
  ];

  useEffect(() => {
    loadPersonalizedRecommendations();
  }, [profile]);

  const loadPersonalizedRecommendations = async () => {
    if (!profile) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('drill-recommendations', {
        body: { 
          action: 'personalized-recommendations',
          userLevel: profile.level,
          weakTopics: ['Present Perfect', 'Conditionals']
        }
      });

      if (error) throw error;
      
      const aiDrills = data.recommendations.map((rec: any, index: number) => ({
        id: 100 + index,
        topic: rec.topic,
        level: profile.level,
        description: `AI-recommended practice for ${rec.topic}`,
        estimatedTime: rec.estimatedTime || 15,
        difficulty: rec.difficulty === 'easy' ? 'Easy' : rec.difficulty === 'hard' ? 'Hard' : 'Medium',
        completed: false,
        recommended: true,
        priority: rec.priority,
        reason: rec.reason
      }));
      
      setPersonalizedDrills(aiDrills);
    } catch (error) {
      console.error('Error loading personalized recommendations:', error);
    }
  };

  const startDrill = async (drill: Drill) => {
    setSelectedDrill(drill);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('drill-recommendations', {
        body: { 
          action: 'generate',
          topic: drill.topic,
          level: drill.level,
          userLevel: profile?.level,
          weakTopics: ['Present Perfect', 'Conditionals']
        }
      });

      if (error) throw error;
      
      setExercises(data.exercises || []);
      setCurrentExercise(0);
      setDrillInProgress(true);
      setDrillScore(0);
      setUserAnswer('');
      setSelectedOption('');
      setShowFeedback(false);
    } catch (error) {
      console.error('Error starting drill:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    const currentExerciseData = exercises[currentExercise];
    const answer = currentExerciseData.type === 'multiple-choice' ? selectedOption : userAnswer;
    
    if (!answer.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('drill-recommendations', {
        body: { 
          action: 'evaluate',
          userAnswer: answer,
          correctAnswer: currentExerciseData.answer,
          topic: selectedDrill?.topic
        }
      });

      if (error) throw error;
      
      setExerciseResult(data);
      setShowFeedback(true);
      
      if (data.isCorrect) {
        setDrillScore(prev => prev + 1);
      }

      if (profile && data.xpGained) {
        updateProfile({ xp: (profile.xp || 0) + data.xpGained });
      }
    } catch (error) {
      console.error('Error evaluating answer:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextExercise = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(prev => prev + 1);
      setUserAnswer('');
      setSelectedOption('');
      setShowFeedback(false);
      setExerciseResult(null);
    } else {
      completeDrill();
    }
  };

  const completeDrill = async () => {
    const finalScore = (drillScore / exercises.length) * 100;
    
    setDrillInProgress(false);
    setSelectedDrill(null);
    setExercises([]);
    setCurrentExercise(0);
    
    alert(`Drill completed! Score: ${finalScore.toFixed(0)}%\nXP Earned: ${drillScore * 10}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    return priority === 'high' ? <Zap className="h-4 w-4 text-orange-500" /> : <Target className="h-4 w-4 text-blue-500" />;
  };

  const fetchGrammarConcept = async (concept: string) => {
    setLoadingConcept(true);
    try {
      const { data, error } = await supabase.functions.invoke('drill-recommendations', {
        body: { 
          action: 'get-concept-explanation',
          concept
        }
      });

      if (error) throw error;
      
      setSelectedConcept({
        name: concept,
        explanation: data.explanation,
        examples: data.examples || [],
        tips: data.tips || [],
        commonMistakes: data.commonMistakes || [],
        resources: data.resources || []
      });
      setConceptDialogOpen(true);
    } catch (error) {
      console.error('Error fetching concept explanation:', error);
    } finally {
      setLoadingConcept(false);
    }
  };

  const renderExercise = (exercise: Exercise) => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-lg">{exercise.question}</h3>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
          onClick={() => fetchGrammarConcept(exercise.grammarConcept?.name || exercise.type)}
          disabled={loadingConcept}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Learn More</span>
        </Button>
      </div>

      {exercise.type === 'multiple-choice' && exercise.options && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {exercise.options.map((option, index) => (
            <Button
              key={index}
              variant={selectedOption === option ? "default" : "outline"}
              className="justify-start h-auto py-3 px-4"
              onClick={() => setSelectedOption(option)}
              disabled={showFeedback}
            >
              {String.fromCharCode(65 + index)}) {option}
            </Button>
          ))}
        </div>
      )}

      {exercise.type !== 'multiple-choice' && (
        <Input
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Type your answer here..."
          disabled={showFeedback}
          className="text-lg"
        />
      )}
    </div>
  );

  if (drillInProgress && selectedDrill && exercises.length > 0) {
    const currentExerciseData = exercises[currentExercise];
    
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-500" />
                <span>{selectedDrill.topic}</span>
              </CardTitle>
              <Badge variant="outline">{currentExercise + 1} of {exercises.length}</Badge>
            </div>
            <CardDescription>{selectedDrill.description}</CardDescription>
            <Progress value={((currentExercise + 1) / exercises.length) * 100} className="mt-2" />
            <div className="text-sm text-gray-600">Score: {drillScore}/{currentExercise + (showFeedback ? 1 : 0)}</div>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderExercise(currentExerciseData)}

            {showFeedback && exerciseResult && (
              <div className={`p-4 rounded-lg border ${exerciseResult.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  {exerciseResult.isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Target className="h-5 w-5 text-red-500" />
                  )}
                  <span className={`font-semibold ${exerciseResult.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {exerciseResult.isCorrect ? 'Correct!' : 'Not quite right'}
                  </span>
                </div>
                <p className="text-sm mb-2">{exerciseResult.feedback}</p>
                <p className="text-xs text-gray-600">{currentExerciseData.explanation}</p>
                {exerciseResult.xpGained && (
                  <Badge className="mt-2 bg-yellow-100 text-yellow-700">
                    +{exerciseResult.xpGained} XP
                  </Badge>
                )}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => {
                setDrillInProgress(false);
                setSelectedDrill(null);
              }}>
                Exit Drill
              </Button>
              <div className="space-x-2">
                {!showFeedback ? (
                  <Button onClick={submitAnswer} disabled={loading || (!userAnswer.trim() && !selectedOption)}>
                    {loading ? 'Checking...' : 'Submit Answer'}
                  </Button>
                ) : (
                  <Button onClick={nextExercise}>
                    {currentExercise === exercises.length - 1 ? 'Complete Drill' : 'Next Exercise'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={conceptDialogOpen} onOpenChange={setConceptDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <span>{selectedConcept?.name}</span>
              </DialogTitle>
              <DialogDescription>
                Understanding the grammar concept
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="prose prose-blue">
                <h3 className="text-lg font-semibold text-blue-700">Explanation</h3>
                <p className="text-gray-700">{selectedConcept?.explanation}</p>
              </div>

              {selectedConcept?.examples && selectedConcept.examples.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-700 mb-2">Examples</h4>
                  <ul className="space-y-2">
                    {selectedConcept.examples.map((example, index) => (
                      <li key={index} className="text-blue-600">{example}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedConcept?.tips && selectedConcept.tips.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-700 mb-2">Tips</h4>
                  <ul className="space-y-2">
                    {selectedConcept.tips.map((tip, index) => (
                      <li key={index} className="text-green-600">
                        <CheckCircle className="inline-block h-4 w-4 mr-2" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedConcept?.commonMistakes && selectedConcept.commonMistakes.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-semibold text-red-700 mb-2">Common Mistakes to Avoid</h4>
                  <ul className="space-y-2">
                    {selectedConcept.commonMistakes.map((mistake, index) => (
                      <li key={index} className="text-red-600">❌ {mistake}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedConcept?.resources && selectedConcept.resources.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Additional Resources</h4>
                  <div className="grid gap-3">
                    {selectedConcept.resources.map((resource, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-md">
                        <div className="font-medium text-blue-600">{resource.title}</div>
                        <div className="text-sm text-gray-600">{resource.description}</div>
                        <Badge variant="outline" className="mt-1">
                          {resource.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const allDrills = [...personalizedDrills, ...staticDrills];
  const recommendedDrills = allDrills.filter(drill => drill.recommended);
  const completedDrills = allDrills.filter(drill => drill.completed);
  const otherDrills = allDrills.filter(drill => !drill.recommended && !drill.completed);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Brain className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <div className="text-2xl font-bold">{personalizedDrills.length}</div>
              <div className="text-sm text-gray-600">AI Recommended</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Target className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <div className="text-2xl font-bold">{recommendedDrills.length}</div>
              <div className="text-sm text-gray-600">Recommended</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <div className="text-2xl font-bold">{completedDrills.length}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <TrendingUp className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <div className="text-2xl font-bold">
                {completedDrills.length > 0 ? Math.round(completedDrills.reduce((acc, drill) => acc + (drill.score || 0), 0) / completedDrills.length) : 0}%
              </div>
              <div className="text-sm text-gray-600">Avg. Score</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {personalizedDrills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-500" />
              <span>AI Personalized for You</span>
            </CardTitle>
            <CardDescription>
              Drills tailored to your learning level and progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personalizedDrills.map((drill) => (
                <Card key={drill.id} className="border-purple-200 bg-purple-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{drill.level}</Badge>
                      <div className="flex items-center space-x-1">
                        {getPriorityIcon(drill.priority)}
                        <Badge className={getDifficultyColor(drill.difficulty)}>
                          {drill.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{drill.topic}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">{drill.description}</p>
                    {drill.reason && (
                      <p className="text-xs text-purple-600 italic">{drill.reason}</p>
                    )}
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {drill.estimatedTime} minutes
                    </div>
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700" 
                      onClick={() => startDrill(drill)}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Start AI Drill'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {recommendedDrills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <span>Recommended Practice</span>
            </CardTitle>
            <CardDescription>
              Essential topics for your current level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedDrills.map((drill) => (
                <Card key={drill.id} className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{drill.level}</Badge>
                      <div className="flex items-center space-x-1">
                        {getPriorityIcon(drill.priority)}
                        <Badge className={getDifficultyColor(drill.difficulty)}>
                          {drill.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{drill.topic}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">{drill.description}</p>
                    {drill.reason && (
                      <p className="text-xs text-blue-600 italic">{drill.reason}</p>
                    )}
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {drill.estimatedTime} minutes
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => startDrill(drill)}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Start Practice'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {completedDrills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-green-500" />
              <span>Completed Drills</span>
            </CardTitle>
            <CardDescription>
              Review your achievements and retake for better scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedDrills.map((drill) => (
                <Card key={drill.id} className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{drill.level}</Badge>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        {drill.score}%
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{drill.topic}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">{drill.description}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {drill.estimatedTime} minutes
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => startDrill(drill)}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Practice Again'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {otherDrills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-gray-500" />
              <span>More Practice Topics</span>
            </CardTitle>
            <CardDescription>
              Explore additional grammar areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherDrills.map((drill) => (
                <Card key={drill.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{drill.level}</Badge>
                      <Badge variant="outline" className={getDifficultyColor(drill.difficulty)}>
                        {drill.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{drill.topic}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">{drill.description}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {drill.estimatedTime} minutes
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => startDrill(drill)}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Start Practice'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DrillRecommendations;