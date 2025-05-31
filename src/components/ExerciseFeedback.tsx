
import React from 'react';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';

interface FeedbackData {
  isCorrect: boolean;
  feedback?: {
    message?: string;
    tip?: string;
    explanation?: string;
  };
  correctAnswer?: string;
  explanation?: string;
}

interface ExerciseFeedbackProps {
  feedback: FeedbackData;
}

const ExerciseFeedback: React.FC<ExerciseFeedbackProps> = ({ feedback }) => {
  if (!feedback) return null;

  return (
    <div className={`p-4 rounded-lg ${feedback.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
      <div className="flex items-center space-x-2 mb-2">
        {feedback.isCorrect ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
        <span className={feedback.isCorrect ? 'text-green-800' : 'text-red-800'}>
          {feedback.isCorrect ? 'Correct!' : 'Not quite right'}
        </span>
      </div>
      
      {feedback.feedback?.message && (
        <p className={feedback.isCorrect ? 'text-green-700' : 'text-red-700'}>
          {feedback.feedback.message}
        </p>
      )}
      
      {!feedback.isCorrect && feedback.correctAnswer && (
        <p className="text-blue-700 mt-2">
          <strong>Correct answer:</strong> {feedback.correctAnswer}
        </p>
      )}
      
      {(feedback.feedback?.tip || feedback.explanation) && (
        <p className="text-blue-700 mt-2">
          <Lightbulb className="h-4 w-4 inline mr-1" />
          {feedback.feedback?.tip || feedback.explanation}
        </p>
      )}
    </div>
  );
};

export default ExerciseFeedback;
