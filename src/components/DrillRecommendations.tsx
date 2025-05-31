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
import { useAtom } from 'jotai';
import { topicToDrillAtom } from '@/hooks/useGlobalUIState';

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

// Define staticDrills with some default grammar exercises
const staticDrills: Drill[] = [
  {
    id: 1,
    topic: 'Present Simple',
    level: 'A1',
    description: 'Practice using the present simple tense for daily routines and habits',
    estimatedTime: 15,
    difficulty: 'Easy',
    completed: false,
    recommended: true,
    priority: 'high',
    reason: 'Fundamental grammar concept for beginners'
  },
  {
    id: 2,
    topic: 'Past Simple',
    level: 'A2',
    description: 'Learn to describe past events and experiences',
    estimatedTime: 20,
    difficulty: 'Medium',
    completed: false,
    recommended: true,
    priority: 'normal',
    reason: 'Essential for telling stories and describing past experiences'
  },
  {
    id: 3,
    topic: 'Present Perfect',
    level: 'B1',
    description: 'Understanding and using the present perfect tense',
    estimatedTime: 25,
    difficulty: 'Hard',
    completed: false,
    recommended: false
  }
];

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
  const [topicToDrill] = useAtom(topicToDrillAtom);

  useEffect(() => {
    if (topicToDrill && !drillInProgress) {
      const matchingDrill = [...personalizedDrills, ...staticDrills].find(
        drill => drill.topic === topicToDrill
      );
      if (matchingDrill) {
        startDrill(matchingDrill);
      }
    }
  }, [topicToDrill]);

  const startDrill = (drill: Drill) => {
    setSelectedDrill(drill);
    setDrillInProgress(true);
    // Additional implementation would be needed here
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Grammar Drills</h2>
        <Badge variant="outline" className="text-sm">
          Level: {profile?.level || 'A1'}
        </Badge>
      </div>

      {!drillInProgress && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...personalizedDrills, ...staticDrills].map((drill) => (
            <Card key={drill.id} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {drill.topic}
                  {drill.recommended && (
                    <Badge variant="secondary">
                      <Target className="mr-1 h-3 w-3" />
                      Recommended
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{drill.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Clock className="h-4 w-4" />
                    <span>{drill.estimatedTime} minutes</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Brain className="h-4 w-4" />
                    <span>{drill.difficulty}</span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => startDrill(drill)}
                    disabled={loading}
                  >
                    Start Drill
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {drillInProgress && selectedDrill && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedDrill.topic}</CardTitle>
            <CardDescription>
              Exercise {currentExercise + 1} of {exercises.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Exercise content would go here */}
            <Button onClick={() => setDrillInProgress(false)}>Exit Drill</Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={conceptDialogOpen} onOpenChange={setConceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedConcept?.name || 'Grammar Concept'}
            </DialogTitle>
            <DialogDescription>
              {selectedConcept?.explanation}
            </DialogDescription>
          </DialogHeader>
          {/* Dialog content for grammar concept would go here */}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DrillRecommendations;