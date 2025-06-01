
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, CheckCircle, Target, BookOpen, TrendingUp } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
import PlacementTest from '@/components/PlacementTest';
import GrammarPractice from '@/components/GrammarPractice';
import AuthPage from '@/components/AuthPage';
import { Header } from '@/components/Header';
import SmartPractice from '@/components/SmartPractice';
import MyProgress from '@/components/MyProgress';
import { AuthProvider, useAuth } from '@/hooks/useAuth';

const AppContent = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('smart-practice');

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
      <main className="container mx-auto p-4 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-8 bg-white/80 backdrop-blur-sm shadow-lg border border-white/20">
            <TabsTrigger value="smart-practice" className="flex items-center space-x-2 flex-1">
              <Target className="h-4 w-4" />
              <span>Smart Practice</span>
            </TabsTrigger>
            <TabsTrigger value="grammar-topics" className="flex items-center space-x-2 flex-1">
              <BookOpen className="h-4 w-4" />
              <span>Grammar Topics</span>
            </TabsTrigger>
            <TabsTrigger value="assessment" className="flex items-center space-x-2 flex-1">
              <CheckCircle className="h-4 w-4" />
              <span>Assessment</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center space-x-2 flex-1">
              <MessageCircle className="h-4 w-4" />
              <span>AI Tutor</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center space-x-2 flex-1">
              <TrendingUp className="h-4 w-4" />
              <span>My Progress</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="smart-practice" className="mt-0">
            <SmartPractice onSelectTopic={() => setActiveTab('grammar-topics')} />
          </TabsContent>

          <TabsContent value="grammar-topics" className="mt-0">
            <GrammarPractice />
          </TabsContent>

          <TabsContent value="assessment" className="mt-0">
            <PlacementTest />
          </TabsContent>

          <TabsContent value="chat" className="mt-0">
            <ChatInterface />
          </TabsContent>

          <TabsContent value="progress" className="mt-0">
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
