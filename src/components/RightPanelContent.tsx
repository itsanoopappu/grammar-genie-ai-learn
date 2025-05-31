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
    displayedUiElements,
    currentActiveUiElementId,
    handleTestAnswer,
    advanceTestQuestion
  } = useChatContext();

  // Render the active feature component
  const renderActiveFeature = () => {
    switch (activeFeature) {
      case 'smart-practice':
        return <SmartPractice onSelectTopic={() => {}} />;
      case 'grammar-topics':
        return <GrammarPractice />;
      case 'assessment':
        return <PlacementTest />;
      case 'progress':
        return <MyProgress />;
      case 'chat':
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-700 mb-2">Welcome to GrammarAI</h2>
              <p className="text-gray-600">
                Start a conversation with your AI tutor to learn grammar concepts and test your knowledge.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Only show the active feature if there are no UI elements or if we're not in chat mode */}
      {(displayedUiElements.length === 0 || activeFeature !== 'chat') && renderActiveFeature()}
      
      {/* Render all UI elements in chronological order */}
      {displayedUiElements.map((element) => {
        if (element.type === 'grammarCard') {
          return (
            <GrammarCardDisplay
              key={element.id}
              topic={element.data.name}
              level={element.data.level}
              explanation={element.data.description}
              examples={element.data.examples}
              situations={element.data.situations}
              rulesChange={element.data.rulesChange}
            />
          );
        } else if (element.type === 'testQuestion') {
          // For test questions, we need to handle different states
          const isActive = element.id === currentActiveUiElementId;
          
          return (
            <ChatTestQuestion
              key={element.id}
              question={element.data.question}
              type={element.data.type}
              options={element.data.options}
              correctAnswer={element.data.correctAnswer}
              explanation={element.data.explanation}
              onAnswer={(answer) => handleTestAnswer(answer)}
              onComplete={() => advanceTestQuestion(element.id)}
              initialAnswer={element.data.userAnswer}
              initialIsCorrect={element.data.isCorrect}
              initialFeedback={element.data.feedback}
              disabled={!isActive && element.status !== 'active'}
              status={element.status}
            />
          );
        }
        return null;
      })}
    </div>
  );
};

export default RightPanelContent;