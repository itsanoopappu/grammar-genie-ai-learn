
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

  // MCQ Component with single premium card design
  if (exercise.type === 'multiple-choice' && exercise.content.options) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200 shadow-xl overflow-hidden">
        <CardContent className="p-8 space-y-8">
          {/* Question Section */}
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-relaxed">
                {exercise.content.question}
              </h2>
              
              {/* Grammar Topic Badge */}
              {exercise.content.grammar_topic && !isAssessmentMode && (
                <div className="flex justify-center">
                  <Badge 
                    variant="outline" 
                    className="bg-white/80 backdrop-blur-sm text-blue-800 border-blue-300 px-4 py-2 text-sm font-medium"
                  >
                    {exercise.content.grammar_topic}
                  </Badge>
                </div>
              )}
            </div>

            {/* Elegant Divider */}
            <div className="flex items-center justify-center">
              <div className="h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent w-full max-w-md"></div>
            </div>
          </div>

          {/* Options Section */}
          <div className="space-y-4">
            <RadioGroup 
              value={selectedOption} 
              onValueChange={onOptionChange}
              className="space-y-4"
            >
              {exercise.content.options.map((option, index) => {
                const isCorrect = isCorrectAnswer(option);
                const isSelected = isSelectedAnswer(option);
                
                let cardClasses = "transition-all duration-300 cursor-pointer border-2 bg-white/80 backdrop-blur-sm hover:shadow-lg transform hover:scale-[1.02]";
                let badgeClasses = "w-10 h-10 rounded-full flex items-center justify-center font-bold text-base transition-all duration-300";
                let textClasses = "font-medium text-gray-800 text-base";
                
                if (showFeedback) {
                  if (isCorrect) {
                    cardClasses += " border-green-400 bg-green-50/90 shadow-green-200/50";
                    badgeClasses += " bg-green-600 text-white shadow-lg";
                  } else if (isSelected && !isCorrect) {
                    cardClasses += " border-red-400 bg-red-50/90 shadow-red-200/50";
                    badgeClasses += " bg-red-600 text-white shadow-lg";
                  } else {
                    cardClasses += " border-gray-200 bg-gray-50/90";
                    badgeClasses += " bg-gray-300 text-gray-600";
                  }
                } else {
                  if (isSelected) {
                    cardClasses += " border-blue-400 bg-blue-50/90 shadow-blue-200/50 ring-2 ring-blue-200";
                    badgeClasses += " bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg";
                    textClasses += " text-blue-900";
                  } else {
                    cardClasses += " border-gray-200 hover:border-blue-300 hover:bg-blue-25";
                    badgeClasses += " bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700";
                  }
                }

                return (
                  <div key={option} className={cardClasses}>
                    <div className="p-6">
                      <div className="flex items-center space-x-6">
                        <RadioGroupItem 
                          value={option} 
                          id={`option-${index}`}
                          disabled={disabled}
                          className="sr-only"
                        />
                        <Label 
                          htmlFor={`option-${index}`} 
                          className="flex items-center space-x-6 cursor-pointer flex-1"
                        >
                          <div className={badgeClasses}>
                            {getOptionLetter(index)}
                          </div>
                          <span className={textClasses}>
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
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Explanation Section */}
          {showFeedback && exercise.content.explanation && (
            <div className="mt-8 pt-6 border-t border-gradient-to-r from-transparent via-amber-200 to-transparent">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-amber-200 shadow-lg">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                      <Lightbulb className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-amber-900 mb-3 text-base">Explanation</h4>
                    <p className="text-amber-800 leading-relaxed text-sm">
                      {exercise.content.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hints Section */}
          {!isAssessmentMode && exercise.content.hints && exercise.content.hints.length > 0 && !showFeedback && (
            <div className="mt-8 pt-6 border-t border-gradient-to-r from-transparent via-blue-200 to-transparent">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-blue-200 shadow-lg">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                      <Lightbulb className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-blue-900 mb-4 text-base">Helpful Hints</h4>
                    <ul className="space-y-3">
                      {exercise.content.hints.map((hint, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-blue-800 leading-relaxed text-sm">{hint}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Other Exercise Types (keep existing implementation for non-MCQ)
  return (
    <div className="space-y-6">
      {/* Question Card */}
      <Card className="border-blue-200 shadow-md">
        <CardContent className="p-6">
          <div className="space-y-4">
            <p className="text-lg font-medium text-gray-900 leading-relaxed">
              {exercise.content.question}
            </p>
            
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
