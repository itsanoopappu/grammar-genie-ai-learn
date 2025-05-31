import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ArrowRight, Award } from 'lucide-react';
import ChatTestQuestion from './ChatTestQuestion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface TestQuestion {
  question: string;
  type: 'multiple-choice' | 'text-input';
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface ChatTestSeriesProps {
  topic: string;
  level: string;
  onComplete: () => void;
}

const ChatTestSeries: React.FC<ChatTestSeriesProps> = ({ topic, level, onComplete }) => {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [testCompleted, setTestCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuestions();
  }, [topic, level]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      // Generate test questions using the drill-recommendations function
      const { data, error } = await supabase.functions.invoke('drill-recommendations', {
        body: { 
          action: 'generate',
          topic,
          level,
          userLevel: profile?.level,
          user_id: user?.id,
          count: 5,
          type: 'test'
        }
      });

      if (error) throw error;
      
      if (data?.exercises && data.exercises.length > 0) {
        // Format questions to match our TestQuestion interface
        const formattedQuestions = data.exercises.map((ex: any) => ({
          question: ex.question || ex.content?.question,
          type: ex.type === 'multiple-choice' ? 'multiple-choice' : 'text-input',
          options: ex.options || ex.content?.options,
          correctAnswer: ex.answer || ex.content?.correctAnswer || ex.content?.correct_answer,
          explanation: ex.explanation || ex.content?.explanation
        }));
        
        setQuestions(formattedQuestions);
        setAnswers(new Array(formattedQuestions.length).fill(''));
      } else {
        throw new Error('No questions returned');
      }
    } catch (err) {
      console.error('Error loading test questions:', err);
      setError('Failed to load test questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }

    // Update user skills
    if (user) {
      supabase.functions.invoke('intelligent-tutor', {
        body: {
          action: 'update_skill_model',
          user_id: user.id,
          topic_id: topic,
          performance_data: {
            isCorrect,
            difficulty: 5,
            timeTaken: 30
          }
        }
      }).catch(err => console.error('Error updating skills:', err));
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      completeTest();
    }
  };

  const completeTest = async () => {
    setTestCompleted(true);
    
    // Award XP based on performance
    if (profile) {
      const baseXP = 50;
      const bonusXP = Math.floor((correctAnswers / questions.length) * 50);
      const totalXP = baseXP + bonusXP;
      
      await updateProfile({
        xp: (profile.xp || 0) + totalXP
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing your test questions...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <Button onClick={loadQuestions}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  if (testCompleted) {
    const score = Math.round((correctAnswers / questions.length) * 100);
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Test Completed!</CardTitle>
          <CardDescription className="text-center">
            You've completed the test on {topic}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <Award className="h-16 w-16 text-yellow-500" />
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">{score}%</div>
            <div className="text-sm text-gray-600">
              {correctAnswers} correct out of {questions.length} questions
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Performance</div>
            <Progress value={score} className="h-2" />
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-blue-800">
              {score >= 80 
                ? "Excellent work! You've mastered this topic." 
                : score >= 60 
                  ? "Good job! Keep practicing to improve further." 
                  : "Keep practicing! This topic needs more work."}
            </p>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={onComplete}>
              Return to Chat
            </Button>
            <Button onClick={() => {
              setTestCompleted(false);
              setCurrentQuestionIndex(0);
              setCorrectAnswers(0);
              setAnswers(new Array(questions.length).fill(''));
            }}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600 mb-4">No questions available for this topic.</p>
          <Button onClick={onComplete}>Return to Chat</Button>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{topic}</CardTitle>
          <Badge variant="outline">{level}</Badge>
        </div>
        <CardDescription>
          Question {currentQuestionIndex + 1} of {questions.length}
        </CardDescription>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent>
        <ChatTestQuestion
          question={currentQuestion.question}
          type={currentQuestion.type}
          options={currentQuestion.options}
          correctAnswer={currentQuestion.correctAnswer}
          explanation={currentQuestion.explanation}
          onAnswer={handleAnswer}
          onComplete={nextQuestion}
        />
      </CardContent>
    </Card>
  );
};

export default ChatTestSeries;