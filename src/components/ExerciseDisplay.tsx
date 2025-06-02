
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
    <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200 shadow-xl">
      <CardContent className="p-8 space-y-8">
        {/* Question Section */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20">
          <h3 className="text-xl font-semibold text-gray-900 leading-relaxed">
            {exercise.content.question}
          </h3>
        </div>

        {/* Multiple Choice Options */}
        {exercise.type === 'multiple-choice' && exercise.content.options && (
          <div className="space-y-4">
            {exercise.content.options.map((option, index) => {
              const isSelected = selectedOption === option;
              const letters = ['A', 'B', 'C', 'D'];
              
              return (
                <div
                  key={option}
                  className={`
                    relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 transform
                    ${isSelected 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-500 text-white shadow-lg scale-[1.02]' 
                      : 'bg-white/80 backdrop-blur-sm border-gray-200 hover:border-blue-300 hover:shadow-md hover:scale-[1.01] text-gray-700'
                    }
                    ${disabled ? 'cursor-not-allowed opacity-70' : ''}
                  `}
                  onClick={() => !disabled && onOptionChange(option)}
                >
                  <div className="flex items-center space-x-4">
                    {/* Letter Badge */}
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm
                      ${isSelected 
                        ? 'bg-white text-blue-600' 
                        : 'bg-blue-100 text-blue-600'
                      }
                    `}>
                      {letters[index]}
                    </div>
                    
                    {/* Option Text */}
                    <span className="flex-1 text-base font-medium leading-relaxed">
                      {option}
                    </span>
                    
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Fill in the Blank */}
        {exercise.type === 'fill-blank' && (
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20">
            <Label htmlFor="answer" className="block text-base font-medium text-gray-700 mb-3">
              Your Answer
            </Label>
            <Input
              id="answer"
              value={userAnswer}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="Type your answer here..."
              disabled={disabled}
              className="text-base p-4 border-2 border-gray-200 focus:border-blue-500 rounded-lg"
            />
          </div>
        )}

        {/* Transformation or Error Correction */}
        {(exercise.type === 'transformation' || exercise.type === 'error-correction') && (
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20">
            <Label htmlFor="answer" className="block text-base font-medium text-gray-700 mb-3">
              {exercise.type === 'transformation' ? 'Transform the sentence' : 'Correct the errors'}
            </Label>
            <Textarea
              id="answer"
              value={userAnswer}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder={exercise.type === 'transformation' ? 'Transform the sentence...' : 'Correct the errors...'}
              disabled={disabled}
              className="text-base p-4 border-2 border-gray-200 focus:border-blue-500 rounded-lg min-h-[120px] resize-none"
            />
          </div>
        )}

        {/* Hints Section */}
        {exercise.content.hints && exercise.content.hints.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-xl border-2 border-yellow-200 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
              </div>
              <span className="text-lg font-semibold text-yellow-800">Helpful Hints</span>
            </div>
            <ul className="space-y-2">
              {exercise.content.hints.map((hint, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2.5 flex-shrink-0"></div>
                  <span className="text-base text-yellow-700 leading-relaxed">{hint}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExerciseDisplay;
