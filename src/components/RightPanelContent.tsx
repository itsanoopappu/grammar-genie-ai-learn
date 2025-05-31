import { useChatContext } from '@/contexts/ChatContext';
import SmartPractice from '@/components/SmartPractice';
import GrammarPractice from '@/components/GrammarPractice';
import PlacementTest from '@/components/PlacementTest';
import MyProgress from '@/components/MyProgress';
import GrammarCardDisplay from '@/components/chat/GrammarCardDisplay';
import ChatTestQuestion from '@/components/chat/ChatTestQuestion';

interface RightPanelContentProps {
  activeFeature: string;
}

const RightPanelContent = ({ activeFeature }: RightPanelContentProps) => {
  const { 
    currentTopic, 
    currentQuestion, 
    isTesting,
    handleTestAnswer,
    completeTest
  } = useChatContext();

  // Chat-related content takes precedence
  if (isTesting && currentQuestion) {
    return (
      <ChatTestQuestion
        question={currentQuestion.question}
        type={currentQuestion.type}
        options={currentQuestion.options}
        correctAnswer={currentQuestion.correctAnswer}
        explanation={currentQuestion.explanation}
        onAnswer={handleTestAnswer}
        onComplete={completeTest}
      />
    );
  }

  if (currentTopic) {
    return (
      <GrammarCardDisplay
        topic={currentTopic.name}
        level={currentTopic.level}
        explanation={currentTopic.description}
        examples={currentTopic.examples}
        situations={currentTopic.situations}
        rulesChange={currentTopic.rulesChange}
      />
    );
  }

  // If no chat-related content, show the selected feature
  switch (activeFeature) {
    case 'smart-practice':
      return <SmartPractice onSelectTopic={() => {}} />;
    case 'grammar-topics':
      return <GrammarPractice />;
    case 'assessment':
      return <PlacementTest />;
    case 'progress':
      return <MyProgress />;
    default:
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Welcome to GrammarAI</h2>
            <p className="text-gray-600">
              Start a conversation with your AI tutor or select a feature from the sidebar.
            </p>
          </div>
        </div>
      );
  }
};

export default RightPanelContent;