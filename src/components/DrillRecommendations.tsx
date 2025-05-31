import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, CheckCircle, Clock, BookOpen, TrendingUp } from 'lucide-react';

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
}

const DrillRecommendations = () => {
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [drillInProgress, setDrillInProgress] = useState(false);

  const drills: Drill[] = [
    {
      id: 1,
      topic: 'Present Perfect Tense',
      level: 'B1',
      description: 'Practice using present perfect tense in various contexts',
      estimatedTime: 15,
      difficulty: 'Medium',
      completed: false,
      recommended: true
    },
    {
      id: 2,
      topic: 'Conditional Sentences',
      level: 'B2',
      description: 'Master all types of conditional sentences',
      estimatedTime: 20,
      difficulty: 'Hard',
      completed: false,
      recommended: true
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
      recommended: true
    }
  ];

  const startDrill = (drill: Drill) => {
    setSelectedDrill(drill);
    setDrillInProgress(true);
  };

  const completeDrill = () => {
    setDrillInProgress(false);
    setSelectedDrill(null);
    // In a real app, this would update the drill completion status
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (drillInProgress && selectedDrill) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <span>{selectedDrill.topic}</span>
            </CardTitle>
            <CardDescription>{selectedDrill.description}</CardDescription>
            <Progress value={30} className="mt-2" />
            <div className="text-sm text-gray-600">Progress: 3 of 10 questions</div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold mb-4">Complete the sentence with the correct present perfect form:</h3>
              <p className="text-lg mb-4">
                "I _____ (never/see) such a beautiful sunset before."
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start">
                  A) never saw
                </Button>
                <Button variant="outline" className="justify-start">
                  B) have never seen
                </Button>
                <Button variant="outline" className="justify-start">
                  C) never have seen
                </Button>
                <Button variant="outline" className="justify-start">
                  D) am never seeing
                </Button>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={completeDrill}>
                Exit Drill
              </Button>
              <div className="space-x-2">
                <Button variant="outline">Skip Question</Button>
                <Button>Submit Answer</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recommendedDrills = drills.filter(drill => drill.recommended);
  const completedDrills = drills.filter(drill => drill.completed);
  const otherDrills = drills.filter(drill => !drill.recommended && !drill.completed);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <TrendingUp className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <div className="text-2xl font-bold">
                {completedDrills.length > 0 ? Math.round(completedDrills.reduce((acc, drill) => acc + (drill.score || 0), 0) / completedDrills.length) : 0}%
              </div>
              <div className="text-sm text-gray-600">Avg. Score</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Drills */}
      {recommendedDrills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <span>Recommended for You</span>
            </CardTitle>
            <CardDescription>
              Based on your recent performance and learning goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedDrills.map((drill) => (
                <Card key={drill.id} className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{drill.level}</Badge>
                      <Badge className={getDifficultyColor(drill.difficulty)}>
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
                      className="w-full" 
                      onClick={() => startDrill(drill)}
                    >
                      Start Drill
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Drills */}
      {completedDrills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Completed Drills</span>
            </CardTitle>
            <CardDescription>
              Review your past performance and retake if needed
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
                    >
                      Retake Drill
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Available Drills */}
      {otherDrills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-gray-500" />
              <span>All Drills</span>
            </CardTitle>
            <CardDescription>
              Explore additional grammar topics
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
                    >
                      Start Drill
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
