import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, CheckCircle, Target, BookOpen } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
import PlacementTest from '@/components/PlacementTest';
import DrillRecommendations from '@/components/DrillRecommendations';
import AuthPage from '@/components/AuthPage';
import { Header } from '@/components/Header';
import { GrammarTopics } from '@/components/GrammarTopics';
import { AuthProvider, useAuth } from '@/hooks/useAuth';

const AppContent = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('chat');

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
    return <AuthPage onAuthSuccess={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      <main className="container mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-8">
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span>AI Tutor</span>
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Assessment</span>
            </TabsTrigger>
            <TabsTrigger value="drills" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Practice</span>
            </TabsTrigger>
            <TabsTrigger value="topics" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>All Topics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <ChatInterface />
          </TabsContent>

          <TabsContent value="test">
            <PlacementTest />
          </TabsContent>

          <TabsContent value="drills">
            <DrillRecommendations />
          </TabsContent>

          <TabsContent value="topics">
            <GrammarTopics />
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