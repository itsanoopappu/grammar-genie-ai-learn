import React, { useState } from 'react';
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
  onAnswer: (isCorrect: boolean) => void;
  onComplete: () => void;
}

const ChatTestQuestion: React.FC<ChatTestQuestionProps> = ({
  question,
  type,
  options = [],
  correctAnswer,
  explanation,
  onAnswer,
  onComplete
}) => {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    if (!answer) return;

    const correct = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    setIsCorrect(correct);
    setSubmitted(true);
    onAnswer(correct);
  };

  const handleNext = () => {
    setAnswer('');
    setSubmitted(false);
    onComplete();
  };

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
            disabled={submitted}
            className="space-y-2"
          >
            {options.map((option) => (
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
            disabled={submitted}
            className="w-full"
          />
        )}

        {!submitted ? (
          <Button 
            onClick={handleSubmit}
            disabled={!answer}
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
              <p className="text-gray-700">{explanation}</p>
              {!isCorrect && (
                <p className="mt-2 text-blue-700">
                  Correct answer: {correctAnswer}
                </p>
              )}
            </div>
            
            <Button 
              onClick={handleNext}
              className="w-full"
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