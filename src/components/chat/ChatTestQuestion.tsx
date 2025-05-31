import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface ChatTestQuestionProps {
  question: string;
  type: 'multiple-choice' | 'text-input';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  onAnswer: (answer: string) => void;
  onComplete?: () => void;
  initialAnswer?: string;
  initialIsCorrect?: boolean;
  initialFeedback?: string;
  disabled?: boolean;
  status?: 'active' | 'feedbackDisplayed' | 'completed';
}

const ChatTestQuestion: React.FC<ChatTestQuestionProps> = ({
  question,
  type,
  options = [],
  correctAnswer,
  explanation,
  onAnswer,
  onComplete,
  initialAnswer,
  initialIsCorrect,
  initialFeedback,
  disabled = false,
  status
}) => {
  const [answer, setAnswer] = useState(initialAnswer || '');
  const [submitted, setSubmitted] = useState(!!initialAnswer);
  const [isCorrect, setIsCorrect] = useState(initialIsCorrect || false);
  const [feedback, setFeedback] = useState<string | null>(initialFeedback || null);

  // Update state when props change
  useEffect(() => {
    if (initialAnswer) {
      setAnswer(initialAnswer);
      setSubmitted(true);
    }
    if (initialIsCorrect !== undefined) {
      setIsCorrect(initialIsCorrect);
    }
    if (initialFeedback) {
      setFeedback(initialFeedback);
    }
  }, [initialAnswer, initialIsCorrect, initialFeedback]);

  const handleSubmit = () => {
    if (!answer || disabled) return;

    const correct = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    setIsCorrect(correct);
    setFeedback(explanation);
    setSubmitted(true);
    onAnswer(answer);
  };

  const handleNext = () => {
    if (disabled) return;
    
    setAnswer('');
    setSubmitted(false);
    setFeedback(null);
    if (onComplete) onComplete();
  };

  // If the question is completed, show a compact version
  if (status === 'completed') {
    return (
      <Card className="mb-4 border border-gray-200 bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-gray-700">{question}</h3>
              <div className="flex items-center mt-1 text-sm">
                <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                  {isCorrect ? "Correct" : "Incorrect"} answer: 
                </span>
                <span className="ml-1 font-medium">
                  {answer || "No answer provided"}
                </span>
              </div>
            </div>
            {isCorrect ? (
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="text-lg text-blue-800">{question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {type === 'multiple-choice' ? (
          <RadioGroup
            value={answer}
            onValueChange={setAnswer}
            disabled={submitted || disabled}
            className="space-y-2"
          >
            {options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={option} />
                <Label htmlFor={option} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <Input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer..."
            disabled={submitted || disabled}
            className="w-full"
          />
        )}

        {!submitted ? (
          <Button 
            onClick={handleSubmit}
            disabled={!answer || disabled}
            className="w-full"
          >
            Submit Answer
          </Button>
        ) : (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${
              isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                {isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className={`font-medium ${
                  isCorrect ? 'text-green-700' : 'text-red-700'
                }`}>
                  {isCorrect ? 'Correct!' : 'Not quite right'}
                </span>
              </div>
              <p className="text-gray-700">{feedback}</p>
              {!isCorrect && (
                <p className="mt-2 text-blue-700">
                  Correct answer: {correctAnswer}
                </p>
              )}
            </div>
            
            <Button 
              onClick={handleNext}
              className="w-full"
              disabled={disabled}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Continue
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatTestQuestion;