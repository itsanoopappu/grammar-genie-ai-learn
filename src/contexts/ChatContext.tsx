import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface GrammarTopic {
  id: string; // UUID of the topic
  name: string;
  level: string;
  description: string;
  examples: string[];
  situations: Array<{
    context: string;
    usage: string;
  }>;
  rulesChange?: Array<{
    situation: string;
    newRule: string;
  }>;
}

interface TestQuestion {
  question: string;
  type: 'multiple-choice' | 'text-input';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  topicId?: string; // UUID of the related topic
}

interface UiElement {
  id: string;
  type: 'grammarCard' | 'testQuestion';
  data: any;
  status?: 'active' | 'feedbackDisplayed' | 'completed';
  timestamp: Date;
}

interface ChatContextType {
  currentTopic: GrammarTopic | null;
  currentQuestion: TestQuestion | null;
  isTesting: boolean;
  chatDisabled: boolean;
  userProgress: {
    correctAnswers: number;
    totalQuestions: number;
    masteredTopics: string[];
  };
  displayedUiElements: UiElement[];
  currentActiveUiElementId: string | null;
  setAiResponse: (response: any) => void;
  handleTestAnswer: (answer: string) => void;
  completeTest: () => void;
  advanceTestQuestion: (id: string) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  
  const [currentTopic, setCurrentTopic] = useState<GrammarTopic | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<TestQuestion | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [chatDisabled, setChatDisabled] = useState(false);
  const [userProgress, setUserProgress] = useState({
    correctAnswers: 0,
    totalQuestions: 0,
    masteredTopics: [] as string[]
  });
  const [displayedUiElements, setDisplayedUiElements] = useState<UiElement[]>([]);
  const [currentActiveUiElementId, setCurrentActiveUiElementId] = useState<string | null>(null);

  // Process AI response and update state accordingly
  const setAiResponse = (response: any) => {
    if (!response) return;

    // Update grammar card if provided
    if (response.grammarCard) {
      const grammarCardElement: UiElement = {
        id: `grammar-${Date.now()}`,
        type: 'grammarCard',
        data: response.grammarCard,
        timestamp: new Date()
      };
      
      setCurrentTopic(response.grammarCard);
      setDisplayedUiElements(prev => [...prev, grammarCardElement]);
    }

    // Update test question if provided
    if (response.testQuestion) {
      const testQuestionId = `test-${Date.now()}`;
      const testQuestionElement: UiElement = {
        id: testQuestionId,
        type: 'testQuestion',
        data: response.testQuestion,
        status: 'active',
        timestamp: new Date()
      };
      
      setCurrentQuestion(response.testQuestion);
      setIsTesting(true);
      setChatDisabled(true);
      setCurrentActiveUiElementId(testQuestionId);
      setDisplayedUiElements(prev => [...prev, testQuestionElement]);
    } else if (response.isTestActive === false && isTesting) {
      // Test is no longer active
      setIsTesting(false);
      setChatDisabled(false);
      setCurrentActiveUiElementId(null);
    }

    // Update progress if provided
    if (response.progressUpdate && response.progressUpdate.isCorrect !== null) {
      setUserProgress(prev => ({
        ...prev,
        correctAnswers: prev.correctAnswers + (response.progressUpdate.isCorrect ? 1 : 0),
        totalQuestions: prev.totalQuestions + 1
      }));

      // Update user XP if provided
      if (response.progressUpdate.xpGain && profile) {
        updateProfile({
          xp: (profile.xp || 0) + response.progressUpdate.xpGain
        });
      }
    }
  };

  // Handle test answer submission
  const handleTestAnswer = async (answer: string) => {
    if (!currentQuestion) return;

    const isCorrect = answer.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
    
    // Update progress
    setUserProgress(prev => ({
      ...prev,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      totalQuestions: prev.totalQuestions + 1
    }));

    // Award XP
    if (profile) {
      const xpGain = isCorrect ? 10 : 5;
      await updateProfile({
        xp: (profile.xp || 0) + xpGain
      });
    }

    // Update UI elements
    if (currentActiveUiElementId) {
      setDisplayedUiElements(prev => 
        prev.map(element => 
          element.id === currentActiveUiElementId 
            ? {
                ...element,
                data: {
                  ...element.data,
                  userAnswer: answer,
                  isCorrect,
                  feedback: currentQuestion.explanation
                },
                status: 'feedbackDisplayed'
              }
            : element
        )
      );
    }

    // Update user skills if we have a topic
    if (currentTopic && user && currentTopic.id) {
      try {
        // Check if skill exists
        const { data: existingSkill } = await supabase
          .from('user_skills')
          .select('*')
          .eq('user_id', user.id)
          .eq('topic_id', currentTopic.id)
          .maybeSingle();

        const skillUpdate = {
          user_id: user.id,
          topic_id: currentTopic.id,
          skill_level: existingSkill 
            ? Math.min(1, existingSkill.skill_level + (isCorrect ? 0.1 : -0.05))
            : isCorrect ? 0.6 : 0.4,
          attempts_count: (existingSkill?.attempts_count || 0) + 1,
          last_practiced: new Date().toISOString()
        };

        if (existingSkill) {
          await supabase
            .from('user_skills')
            .update(skillUpdate)
            .eq('id', existingSkill.id);
        } else {
          await supabase
            .from('user_skills')
            .insert(skillUpdate);
        }
      } catch (error) {
        console.error('Error updating user skills:', error);
      }
    }

    // Reset testing state
    setIsTesting(false);
    setChatDisabled(false);
    setCurrentActiveUiElementId(null);
  };

  // Complete the current test
  const completeTest = () => {
    setIsTesting(false);
    setChatDisabled(false);
    setCurrentQuestion(null);
    setCurrentActiveUiElementId(null);
  };

  // Advance to next question or mark as completed
  const advanceTestQuestion = (id: string) => {
    setDisplayedUiElements(prev => 
      prev.map(element => 
        element.id === id 
          ? { ...element, status: 'completed' }
          : element
      )
    );
  };

  const value = {
    currentTopic,
    currentQuestion,
    isTesting,
    chatDisabled,
    userProgress,
    displayedUiElements,
    currentActiveUiElementId,
    setAiResponse,
    handleTestAnswer,
    completeTest,
    advanceTestQuestion
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};