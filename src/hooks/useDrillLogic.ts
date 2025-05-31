
import { atom, useAtom } from 'jotai';
import { produce } from 'immer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';

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

interface DrillState {
  selectedDrill: Drill | null;
  drillInProgress: boolean;
  exercises: Exercise[];
  currentExercise: number;
  userAnswer: string;
  selectedOption: string;
  showFeedback: boolean;
  exerciseResult: any;
  drillScore: number;
  loading: boolean;
  personalizedDrills: Drill[];
  conceptDialogOpen: boolean;
  selectedConcept: Exercise['grammarConcept'] | null;
  loadingConcept: boolean;
}

const initialState: DrillState = {
  selectedDrill: null,
  drillInProgress: false,
  exercises: [],
  currentExercise: 0,
  userAnswer: '',
  selectedOption: '',
  showFeedback: false,
  exerciseResult: null,
  drillScore: 0,
  loading: false,
  personalizedDrills: [],
  conceptDialogOpen: false,
  selectedConcept: null,
  loadingConcept: false
};

const drillStateAtom = atom<DrillState>(initialState);

export const useDrillLogic = () => {
  const [state, setState] = useAtom(drillStateAtom);
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();

  const startDrill = async (drill: Drill) => {
    setState(produce(state => { state.loading = true }));
    try {
      // Check for unresolved drill first
      const { data: existingDrill } = await supabase
        .from('drill_recommendations')
        .select('*')
        .eq('topic', drill.topic)
        .eq('level', drill.level)
        .eq('user_id', user?.id)
        .eq('resolved', false)
        .single();

      if (existingDrill?.drill_data) {
        // Properly type the drill_data as Exercise[]
        const exercises = Array.isArray(existingDrill.drill_data) 
          ? existingDrill.drill_data as Exercise[]
          : [];
          
        setState(produce(state => {
          state.exercises = exercises;
          state.selectedDrill = drill;
          state.drillInProgress = true;
          state.currentExercise = 0;
          state.drillScore = 0;
          state.loading = false;
        }));
        return;
      }

      const { data, error } = await supabase.functions.invoke('drill-recommendations', {
        body: { 
          action: 'generate',
          topic: drill.topic,
          level: drill.level,
          userLevel: profile?.level,
          user_id: user?.id
        }
      });

      if (error) throw error;
      
      setState(produce(state => {
        state.exercises = data.exercises || [];
        state.selectedDrill = drill;
        state.drillInProgress = true;
        state.currentExercise = 0;
        state.drillScore = 0;
        state.loading = false;
      }));
    } catch (error) {
      console.error('Error starting drill:', error);
      setState(produce(state => { state.loading = false }));
    }
  };

  const submitAnswer = async () => {
    const answer = state.exercises[state.currentExercise].type === 'multiple-choice' 
      ? state.selectedOption 
      : state.userAnswer;
    
    if (!answer.trim()) return;

    setState(produce(state => { state.loading = true }));
    try {
      const { data, error } = await supabase.functions.invoke('drill-recommendations', {
        body: { 
          action: 'evaluate',
          userAnswer: answer,
          correctAnswer: state.exercises[state.currentExercise].answer,
          topic: state.selectedDrill?.topic
        }
      });

      if (error) throw error;
      
      setState(produce(state => {
        state.exerciseResult = data;
        state.showFeedback = true;
        if (data.isCorrect) {
          state.drillScore += 1;
        }
        state.loading = false;
      }));

      if (profile && data.xpGained) {
        await updateProfile({ xp: (profile.xp || 0) + data.xpGained });
      }
    } catch (error) {
      console.error('Error evaluating answer:', error);
      setState(produce(state => { state.loading = false }));
    }
  };

  const nextExercise = async () => {
    if (state.currentExercise < state.exercises.length - 1) {
      setState(produce(state => {
        state.currentExercise += 1;
        state.userAnswer = '';
        state.selectedOption = '';
        state.showFeedback = false;
        state.exerciseResult = null;
      }));
    } else {
      await completeDrill();
    }
  };

  const completeDrill = async () => {
    const finalScore = (state.drillScore / state.exercises.length) * 100;
    
    // Mark drill as resolved in database
    if (state.selectedDrill) {
      await supabase
        .from('drill_recommendations')
        .update({ 
          resolved: true,
          score: finalScore
        })
        .eq('topic', state.selectedDrill.topic)
        .eq('level', state.selectedDrill.level)
        .eq('user_id', user?.id);
    }
    
    setState(produce(state => {
      state.drillInProgress = false;
      state.selectedDrill = null;
      state.exercises = [];
      state.currentExercise = 0;
    }));
  };

  const fetchGrammarConcept = async (concept: string) => {
    setState(produce(state => { state.loadingConcept = true }));
    try {
      const { data, error } = await supabase.functions.invoke('drill-recommendations', {
        body: { 
          action: 'get-concept-explanation',
          concept
        }
      });

      if (error) throw error;
      
      setState(produce(state => {
        state.selectedConcept = {
          name: concept,
          explanation: data.explanation,
          examples: data.examples || [],
          tips: data.tips || [],
          commonMistakes: data.commonMistakes || [],
          resources: data.resources || []
        };
        state.conceptDialogOpen = true;
        state.loadingConcept = false;
      }));
    } catch (error) {
      console.error('Error fetching concept explanation:', error);
      setState(produce(state => { state.loadingConcept = false }));
    }
  };

  const setUserAnswer = (answer: string) => {
    setState(produce(state => { state.userAnswer = answer }));
  };

  const setSelectedOption = (option: string) => {
    setState(produce(state => { state.selectedOption = option }));
  };

  const setConceptDialogOpen = (open: boolean) => {
    setState(produce(state => { state.conceptDialogOpen = open }));
  };

  return {
    state,
    startDrill,
    submitAnswer,
    nextExercise,
    completeDrill,
    fetchGrammarConcept,
    setUserAnswer,
    setSelectedOption,
    setConceptDialogOpen
  };
};
