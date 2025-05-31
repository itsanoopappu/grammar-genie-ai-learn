import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface GrammarTopic {
  id: string;
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
  id: string;
  question: string;
  type: 'multiple-choice' | 'text-input';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
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
  setCurrentTopic: (topic: GrammarTopic) => void;
  startTest: () => void;
  handleTestAnswer: (isCorrect: boolean) => void;
  completeTest: () => void;
  enableChat: () => void;
  disableChat: () => void;
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
    masteredTopics: []
  });

  const startTest = async () => {
    if (!currentTopic || !user) return;

    try {
      const { data: questions } = await supabase.functions.invoke('drill-recommendations', {
        body: {
          action: 'generate',
          topic: currentTopic.name,
          level: profile?.level,
          count: 3,
          type: 'test'
        }
      });

      if (questions?.[0]) {
        setCurrentQuestion(questions[0]);
        setIsTesting(true);
        setChatDisabled(true);
      }
    } catch (error) {
      console.error('Error starting test:', error);
    }
  };

  const handleTestAnswer = async (isCorrect: boolean) => {
    if (!user || !currentTopic) return;

    // Update progress
    setUserProgress(prev => ({
      ...prev,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      totalQuestions: prev.totalQuestions + 1
    }));

    // Update user skills
    try {
      const { data: existingSkill } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', user.id)
        .eq('topic_id', currentTopic.id)
        .single();

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
  };

  const completeTest = async () => {
    setIsTesting(false);
    setChatDisabled(false);
    setCurrentQuestion(null);

    // Update user profile
    if (profile) {
      const xpGained = Math.round(
        (userProgress.correctAnswers / userProgress.totalQuestions) * 50
      );
      await updateProfile({
        xp: (profile.xp || 0) + xpGained
      });
    }

    // Reset progress
    setUserProgress({
      correctAnswers: 0,
      totalQuestions: 0,
      masteredTopics: userProgress.masteredTopics
    });
  };

  const enableChat = () => setChatDisabled(false);
  const disableChat = () => setChatDisabled(true);

  const value = {
    currentTopic,
    currentQuestion,
    isTesting,
    chatDisabled,
    userProgress,
    setCurrentTopic,
    startTest,
    handleTestAnswer,
    completeTest,
    enableChat,
    disableChat
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};