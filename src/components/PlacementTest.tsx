
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, BookOpen, Award } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  topic: string;
  level: string;
}

const PlacementTest = () => {
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [answers, setAnswers] = useState<number[]>([]);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const questions: Question[] = [
    {
      id: 1,
      question: "Choose the correct form: 'I _____ to the store yesterday.'",
      options: ["go", "went", "going", "goes"],
      correctAnswer: 1,
      topic: "Past Tense",
      level: "A2"
    },
    {
      id: 2,
      question: "Which sentence is correct?",
      options: [
        "She have been working here for five years.",
        "She has been working here for five years.",
        "She is been working here for five years.",
        "She was been working here for five years."
      ],
      correctAnswer: 1,
      topic: "Present Perfect Continuous",
      level: "B1"
    },
    {
      id: 3,
      question: "Complete the sentence: 'If I _____ rich, I would travel the world.'",
      options: ["am", "was", "were", "will be"],
      correctAnswer: 2,
      topic: "Conditional Sentences",
      level: "B2"
    },
    {
      id: 4,
      question: "Choose the correct passive voice: 'The teacher explains the lesson.'",
      options: [
        "The lesson explains by the teacher.",
        "The lesson is explained by the teacher.",
        "The lesson was explained by the teacher.",
        "The lesson has explained by the teacher."
      ],
      correctAnswer: 1,
      topic: "Passive Voice",
      level: "B1"
    },
    {
      id: 5,
      question: "Which sentence uses the subjunctive mood correctly?",
      options: [
        "I suggest that he studies harder.",
        "I suggest that he study harder.",
        "I suggest that he will study harder.",
        "I suggest that he studying harder."
      ],
      correctAnswer: 1,
      topic: "Subjunctive Mood",
      level: "C1"
    }
  ];

  const handleStartTest = () => {
    setTestStarted(true);
    setCurrentQuestion(0);
    setAnswers([]);
    setTestCompleted(false);
  };

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value);
  };

  const handleNextQuestion = () => {
    const newAnswers = [...answers, parseInt(selectedAnswer)];
    setAnswers(newAnswers);
    setSelectedAnswer('');

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Test completed
      const score = newAnswers.reduce((acc, answer, index) => {
        return acc + (answer === questions[index].correctAnswer ? 1 : 0);
      }, 0);
      
      const percentage = (score / questions.length) * 100;
      let level = 'A1';
      if (percentage >= 90) level = 'C1';
      else if (percentage >= 75) level = 'B2';
      else if (percentage >= 60) level = 'B1';
      else if (percentage >= 45) level = 'A2';

      setTestResults({
        score,
        total: questions.length,
        percentage,
        level,
        weakAreas: questions.filter((q, i) => newAnswers[i] !== q.correctAnswer).map(q => q.topic),
        strongAreas: questions.filter((q, i) => newAnswers[i] === q.correctAnswer).map(q => q.topic)
      });
      setTestCompleted(true);
    }
  };

  const resetTest = () => {
    setTestStarted(false);
    setCurrentQuestion(0);
    setSelectedAnswer('');
    setAnswers([]);
    setTestCompleted(false);
    setTestResults(null);
  };

  if (!testStarted) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2 text-2xl">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <span>Grammar Placement Test</span>
            </CardTitle>
            <CardDescription>
              Discover your current grammar level and get personalized learning recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <div className="font-semibold">15 Minutes</div>
                <div className="text-sm text-gray-600">Estimated time</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <BookOpen className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="font-semibold">{questions.length} Questions</div>
                <div className="text-sm text-gray-600">Mixed difficulty</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Award className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <div className="font-semibold">CEFR Level</div>
                <div className="text-sm text-gray-600">A1 to C2 assessment</div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Test Instructions:</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Choose the best answer for each question</li>
                <li>• Take your time - there's no time limit</li>
                <li>• Your results will help us recommend the best learning path</li>
                <li>• You can retake the test anytime to track your progress</li>
              </ul>
            </div>

            <div className="text-center">
              <Button onClick={handleStartTest} size="lg" className="px-8">
                Start Placement Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (testCompleted && testResults) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Test Results</CardTitle>
            <CardDescription>Your grammar assessment is complete!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-4">
                <Award className="h-12 w-12 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                Your Level: {testResults.level}
              </div>
              <div className="text-lg text-gray-600">
                Score: {testResults.score}/{testResults.total} ({testResults.percentage}%)
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-green-600">Strong Areas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {testResults.strongAreas.map((area: string, index: number) => (
                      <Badge key={index} variant="secondary" className="bg-green-100 text-green-700">
                        {area}
                      </Badge>
                    ))}
                    {testResults.strongAreas.length === 0 && (
                      <p className="text-gray-500">Keep practicing to build your strengths!</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-orange-600">Areas to Improve</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {testResults.weakAreas.map((area: string, index: number) => (
                      <Badge key={index} variant="outline" className="border-orange-200 text-orange-700">
                        {area}
                      </Badge>
                    ))}
                    {testResults.weakAreas.length === 0 && (
                      <p className="text-gray-500">Excellent! You got everything right!</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center space-x-4">
              <Button onClick={resetTest} variant="outline">
                Retake Test
              </Button>
              <Button>
                View Personalized Recommendations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Question {currentQuestion + 1} of {questions.length}
            </CardTitle>
            <Badge variant="outline">
              {questions[currentQuestion].level} Level
            </Badge>
          </div>
          <Progress value={((currentQuestion + 1) / questions.length) * 100} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {questions[currentQuestion].question}
            </h3>
            
            <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
              {questions[currentQuestion].options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex justify-between">
            <Badge variant="secondary">
              Topic: {questions[currentQuestion].topic}
            </Badge>
            <Button 
              onClick={handleNextQuestion} 
              disabled={!selectedAnswer}
            >
              {currentQuestion === questions.length - 1 ? 'Finish Test' : 'Next Question'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlacementTest;
