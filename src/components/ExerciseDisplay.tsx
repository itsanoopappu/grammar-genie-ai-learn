
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb } from 'lucide-react';
import { Exercise } from '@/types/exercise';

interface ExerciseDisplayProps {
  exercise: Exercise;
  userAnswer: string;
  selectedOption: string;
  onAnswerChange: (answer: string) => void;
  onOptionChange: (option: string) => void;
  disabled?: boolean;
}

const ExerciseDisplay: React.FC<ExerciseDisplayProps> = ({
  exercise,
  userAnswer,
  selectedOption,
  onAnswerChange,
  onOptionChange,
  disabled = false
}) => {
  if (!exercise || !exercise.content) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-4">
          <div className="text-red-600">Invalid exercise data</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-lg font-medium">{exercise.content.question}</p>
      </div>

      {exercise.type === 'multiple-choice' && exercise.content.options && (
        <RadioGroup value={selectedOption} onValueChange={onOptionChange}>
          <div className="grid gap-2">
            {exercise.content.options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={option} disabled={disabled} />
                <Label htmlFor={option}>{option}</Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      )}

      {exercise.type === 'fill-blank' && (
        <Input
          value={userAnswer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Type your answer here..."
          disabled={disabled}
        />
      )}

      {(exercise.type === 'transformation' || exercise.type === 'error-correction') && (
        <Textarea
          value={userAnswer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder={exercise.type === 'transformation' ? 'Transform the sentence...' : 'Correct the errors...'}
          disabled={disabled}
        />
      )}

      {exercise.content.hints && exercise.content.hints.length > 0 && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Lightbulb className="h-4 w-4 text-yellow-600" />
            <span className="font-medium text-yellow-800">Hints:</span>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {exercise.content.hints.map((hint, index) => (
              <li key={index} className="text-sm text-yellow-700">{hint}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ExerciseDisplay;
