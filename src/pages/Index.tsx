import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, CheckCircle, Target, BookOpen, TrendingUp } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
import PlacementTest from '@/components/PlacementTest';
import DrillRecommendations from '@/components/DrillRecommendations';
import AuthPage from '@/components/AuthPage';
import { Header } from '@/components/Header';
import { GrammarTopics } from '@/components/GrammarTopics';
import TopicRecommendations from '@/components/TopicRecommendations';
import IntelligentPractice from '@/components/IntelligentPractice';
import MyProgress from '@/components/MyProgress';
import { AuthProvider, useAuth } from '@/hooks/useAuth';

const AppContent = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('recommendations');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthSuccess={() => {}} />;
  }

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopicId(topicId);
    setActiveTab('practice');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      <main className="container mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-8">
            <TabsTrigger value="recommendations" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Smart Practice</span>
            </TabsTrigger>
            <TabsTrigger value="practice" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Practice</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span>AI Tutor</span>
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Assessment</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>My Progress</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations">
            <TopicRecommendations onSelectTopic={handleTopicSelect} />
          </TabsContent>

          <TabsContent value="practice">
            <IntelligentPractice topicId={selectedTopicId || undefined} />
          </TabsContent>

          <TabsContent value="chat">
            <ChatInterface />
          </TabsContent>

          <TabsContent value="test">
            <PlacementTest />
          </TabsContent>

          <TabsContent value="progress">
            <MyProgress />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;