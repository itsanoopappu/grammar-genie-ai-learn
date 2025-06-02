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
  isAssessmentMode?: boolean;
}

const ExerciseDisplay: React.FC<ExerciseDisplayProps> = ({
  exercise,
  userAnswer,
  selectedOption,
  onAnswerChange,
  onOptionChange,
  disabled = false,
  showFeedback = false,
  isAssessmentMode = false
}) => {
  if (!exercise || !exercise.content) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="p-6">
          <div className="text-red-600 font-medium">Invalid exercise data</div>
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
      <Card className="border-blue-200 shadow-md">
        <CardContent className="p-6">
          <div className="space-y-4">
            <p className="text-lg font-medium text-gray-900 leading-relaxed">
              {exercise.content.question}
            </p>
            
            {/* Grammar Topic Badge */}
            {exercise.content.grammar_topic && !isAssessmentMode && (
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="outline" 
                  className="bg-blue-100 text-blue-800 border-blue-300"
                >
                  {exercise.content.grammar_topic}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* MCQ Options */}
      {exercise.type === 'multiple-choice' && exercise.content.options && (
        <div className="space-y-3">
          <RadioGroup 
            value={selectedOption} 
            onValueChange={onOptionChange}
            className="space-y-2"
          >
            {exercise.content.options.map((option, index) => {
              const isCorrect = isCorrectAnswer(option);
              const isSelected = isSelectedAnswer(option);
              
              let cardClasses = "transition-all duration-200 cursor-pointer border-2";
              let badgeClasses = "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm";
              
              if (showFeedback) {
                if (isCorrect) {
                  cardClasses += " border-green-400 bg-green-50";
                  badgeClasses += " bg-green-600 text-white";
                } else if (isSelected && !isCorrect) {
                  cardClasses += " border-red-400 bg-red-50";
                  badgeClasses += " bg-red-600 text-white";
                } else {
                  cardClasses += " border-gray-200 bg-gray-50";
                  badgeClasses += " bg-gray-300 text-gray-600";
                }
              } else {
                if (isSelected) {
                  cardClasses += " border-blue-400 bg-blue-50";
                  badgeClasses += " bg-blue-600 text-white";
                } else {
                  cardClasses += " border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25";
                  badgeClasses += " bg-gray-100 text-gray-600";
                }
              }

              return (
                <Card key={option} className={cardClasses}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem 
                        value={option} 
                        id={`option-${index}`}
                        disabled={disabled}
                        className="sr-only"
                      />
                      <Label 
                        htmlFor={`option-${index}`} 
                        className="flex items-center space-x-3 cursor-pointer flex-1"
                      >
                        <div className={badgeClasses}>
                          {getOptionLetter(index)}
                        </div>
                        <span className="font-medium text-gray-800">
                          {option}
                        </span>
                        
                        {showFeedback && (
                          <div className="ml-auto">
                            {isCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                            {isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-600" />}
                          </div>
                        )}
                      </Label>
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
        <Card className="border-blue-200 shadow-md">
          <CardContent className="p-6">
            <Input
              value={userAnswer}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="Type your answer here..."
              disabled={disabled}
              className="text-lg py-3"
            />
          </CardContent>
        </Card>
      )}

      {(exercise.type === 'transformation' || exercise.type === 'error-correction') && (
        <Card className="border-blue-200 shadow-md">
          <CardContent className="p-6">
            <Textarea
              value={userAnswer}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder={exercise.type === 'transformation' ? 'Transform the sentence...' : 'Correct the errors...'}
              disabled={disabled}
              className="min-h-32 text-lg"
            />
          </CardContent>
        </Card>
      )}

      {/* Explanation Card */}
      {showFeedback && exercise.content.explanation && (
        <Card className="bg-amber-50 border-amber-200 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-amber-900 mb-2">Explanation</h4>
                <p className="text-amber-800">
                  {exercise.content.explanation}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hints Card */}
      {!isAssessmentMode && exercise.content.hints && exercise.content.hints.length > 0 && !showFeedback && (
        <Card className="bg-blue-50 border-blue-200 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-blue-900 mb-3">Hints</h4>
                <ul className="space-y-2">
                  {exercise.content.hints.map((hint, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-blue-800">{hint}</span>
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
