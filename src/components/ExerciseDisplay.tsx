
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
    <div className="space-y-8">
      {/* Enhanced Question Card */}
      <Card className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-blue-200/60 shadow-lg">
        <CardContent className="p-8">
          <div className="space-y-4">
            <p className="text-xl font-semibold text-gray-900 leading-relaxed">
              {exercise.content.question}
            </p>
            
            {/* Grammar Topic Badge */}
            {exercise.content.grammar_topic && !isAssessmentMode && (
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="outline" 
                  className="bg-blue-100/80 text-blue-800 border-blue-300/60 px-3 py-1 font-medium"
                >
                  {exercise.content.grammar_topic}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced MCQ Options */}
      {exercise.type === 'multiple-choice' && exercise.content.options && (
        <div className="space-y-4">
          <RadioGroup 
            value={selectedOption} 
            onValueChange={onOptionChange}
            className="space-y-3"
          >
            {exercise.content.options.map((option, index) => {
              const isCorrect = isCorrectAnswer(option);
              const isSelected = isSelectedAnswer(option);
              
              // Base styling
              let cardClasses = "group relative transition-all duration-300 cursor-pointer border-2 hover:shadow-lg transform hover:-translate-y-0.5";
              let badgeClasses = "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2";
              let optionTextClasses = "font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-200";
              
              // Assessment mode (no feedback until completion)
              if (isAssessmentMode && !showFeedback) {
                if (isSelected) {
                  cardClasses += " border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md scale-[1.02]";
                  badgeClasses += " bg-blue-600 text-white border-blue-600";
                } else {
                  cardClasses += " border-gray-200 bg-white hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-25 hover:to-indigo-25";
                  badgeClasses += " bg-gray-100 text-gray-600 border-gray-300 group-hover:bg-blue-100 group-hover:text-blue-700 group-hover:border-blue-300";
                }
              }
              // Show feedback mode (practice or post-assessment)
              else if (showFeedback) {
                if (isCorrect) {
                  cardClasses += " border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 shadow-md";
                  badgeClasses += " bg-green-600 text-white border-green-600";
                } else if (isSelected && !isCorrect) {
                  cardClasses += " border-red-400 bg-gradient-to-r from-red-50 to-rose-50 shadow-md";
                  badgeClasses += " bg-red-600 text-white border-red-600";
                } else {
                  cardClasses += " border-gray-200 bg-gray-50";
                  badgeClasses += " bg-gray-100 text-gray-500 border-gray-300";
                }
              }
              // Default state (practice mode without feedback)
              else {
                if (isSelected) {
                  cardClasses += " border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md scale-[1.02]";
                  badgeClasses += " bg-blue-600 text-white border-blue-600";
                } else {
                  cardClasses += " border-gray-200 bg-white hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-25 hover:to-indigo-25";
                  badgeClasses += " bg-gray-100 text-gray-600 border-gray-300 group-hover:bg-blue-100 group-hover:text-blue-700 group-hover:border-blue-300";
                }
              }

              return (
                <Card key={option} className={cardClasses}>
                  <CardContent className="p-5">
                    <div className="flex items-center space-x-4">
                      <RadioGroupItem 
                        value={option} 
                        id={`option-${index}`}
                        disabled={disabled}
                        className="sr-only"
                      />
                      <Label 
                        htmlFor={`option-${index}`} 
                        className="flex items-center space-x-4 cursor-pointer flex-1"
                      >
                        {/* Option Letter Badge */}
                        <div className={badgeClasses}>
                          {getOptionLetter(index)}
                        </div>
                        
                        {/* Option Text */}
                        <div className="flex-1">
                          <span className={optionTextClasses}>
                            {option}
                          </span>
                        </div>
                        
                        {/* Feedback Icons (only shown when feedback is enabled) */}
                        {showFeedback && (
                          <div className="flex items-center ml-auto">
                            {isCorrect && (
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                                <span className="text-sm font-medium text-green-700">Correct</span>
                              </div>
                            )}
                            {isSelected && !isCorrect && (
                              <div className="flex items-center space-x-2">
                                <XCircle className="h-6 w-6 text-red-600" />
                                <span className="text-sm font-medium text-red-700">Incorrect</span>
                              </div>
                            )}
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
              className="text-lg py-3 px-4 border-2 focus:border-blue-400 transition-colors"
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
              className="min-h-32 text-lg p-4 border-2 focus:border-blue-400 transition-colors resize-none"
            />
          </CardContent>
        </Card>
      )}

      {/* Enhanced Explanation Card (only shown when feedback is enabled) */}
      {showFeedback && exercise.content.explanation && (
        <Card className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-amber-200 shadow-lg animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Lightbulb className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-amber-900 mb-3 text-lg">Explanation</h4>
                <p className="text-amber-800 leading-relaxed">
                  {exercise.content.explanation}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Hints Card (only shown in practice mode, not during assessment) */}
      {!isAssessmentMode && exercise.content.hints && exercise.content.hints.length > 0 && !showFeedback && (
        <Card className="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 border-indigo-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Lightbulb className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-indigo-900 mb-4 text-lg">Helpful Hints</h4>
                <ul className="space-y-3">
                  {exercise.content.hints.map((hint, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-indigo-800 leading-relaxed">{hint}</span>
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
