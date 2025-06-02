import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, CheckCircle, XCircle } from 'lucide-react';
import { Exercise } from '@/types/exercise';

interface ExerciseDisplayProps {
  exercise: Exercise;
  userAnswer: string;
  selectedOption: string;
  onAnswerChange: (answer: string) => void;
  onOptionChange: (option: string) => void;
  disabled?: boolean;
  showFeedback?: boolean;
}

const ExerciseDisplay: React.FC<ExerciseDisplayProps> = ({
  exercise,
  userAnswer,
  selectedOption,
  onAnswerChange,
  onOptionChange,
  disabled = false,
  showFeedback = false
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

  const getOptionLetter = (index: number) => String.fromCharCode(65 + index);
  const isCorrectAnswer = (option: string) => option === exercise.content.correct_answer;
  const isSelectedAnswer = (option: string) => option === selectedOption;

  return (
    <div className="space-y-6">
      {/* Question Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
        <CardContent className="p-6">
          <p className="text-lg font-medium text-gray-900 leading-relaxed">
            {exercise.content.question}
          </p>
        </CardContent>
      </Card>

      {/* Answer Options */}
      {exercise.type === 'multiple-choice' && exercise.content.options && (
        <div className="space-y-3">
          <RadioGroup value={selectedOption} onValueChange={onOptionChange}>
            {exercise.content.options.map((option, index) => {
              const isCorrect = isCorrectAnswer(option);
              const isSelected = isSelectedAnswer(option);
              
              let cardClasses = "transition-all duration-200 cursor-pointer hover:shadow-md border-2";
              
              if (showFeedback) {
                if (isCorrect) {
                  cardClasses += " border-green-300 bg-green-50";
                } else if (isSelected && !isCorrect) {
                  cardClasses += " border-red-300 bg-red-50";
                } else {
                  cardClasses += " border-gray-200 bg-gray-50";
                }
              } else {
                if (isSelected) {
                  cardClasses += " border-blue-400 bg-blue-50 shadow-md";
                } else {
                  cardClasses += " border-gray-200 hover:border-blue-300 hover:bg-blue-25";
                }
              }

              return (
                <Card key={option} className={cardClasses}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem 
                        value={option} 
                        id={option} 
                        disabled={disabled}
                        className="text-blue-600"
                      />
                      <div className="flex items-center space-x-3 flex-1">
                        <Badge 
                          variant="outline" 
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                            showFeedback && isCorrect 
                              ? 'bg-green-100 text-green-700 border-green-300' 
                              : showFeedback && isSelected && !isCorrect
                              ? 'bg-red-100 text-red-700 border-red-300'
                              : isSelected 
                              ? 'bg-blue-100 text-blue-700 border-blue-300' 
                              : 'bg-gray-100 text-gray-600 border-gray-300'
                          }`}
                        >
                          {getOptionLetter(index)}
                        </Badge>
                        <Label 
                          htmlFor={option} 
                          className="flex-1 cursor-pointer text-base font-medium"
                        >
                          {option}
                        </Label>
                        {showFeedback && (
                          <div className="flex items-center">
                            {isCorrect ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : isSelected && !isCorrect ? (
                              <XCircle className="h-5 w-5 text-red-600" />
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </RadioGroup>
        </div>
      )}

      {/* Other Exercise Types */}
      {exercise.type === 'fill-blank' && (
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <Input
              value={userAnswer}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="Type your answer here..."
              disabled={disabled}
              className="text-lg"
            />
          </CardContent>
        </Card>
      )}

      {(exercise.type === 'transformation' || exercise.type === 'error-correction') && (
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <Textarea
              value={userAnswer}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder={exercise.type === 'transformation' ? 'Transform the sentence...' : 'Correct the errors...'}
              disabled={disabled}
              className="min-h-24 text-lg"
            />
          </CardContent>
        </Card>
      )}

      {/* Feedback Card */}
      {showFeedback && exercise.content.explanation && (
        <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800 mb-2">Explanation</h4>
                <p className="text-amber-700 leading-relaxed">
                  {exercise.content.explanation}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hints */}
      {exercise.content.hints && exercise.content.hints.length > 0 && !showFeedback && (
        <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-3">Hints</h4>
                <ul className="space-y-2">
                  {exercise.content.hints.map((hint, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-yellow-700">{hint}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExerciseDisplay;
