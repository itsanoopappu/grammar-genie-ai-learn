import { Suspense, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, CheckCircle, Target, BookOpen } from 'lucide-react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorBoundary } from 'react-error-boundary';
import { useAtom } from 'jotai';
import { activeTabAtom } from '@/hooks/useGlobalUIState';

// Lazy load components
const AuthPage = lazy(() => import('@/components/AuthPage'));
const ChatInterface = lazy(() => import('@/components/ChatInterface'));
const PlacementTest = lazy(() => import('@/components/PlacementTest'));
const DrillRecommendations = lazy(() => import('@/components/DrillRecommendations'));
const GrammarTopics = lazy(() => import('@/components/GrammarTopics'));

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  // Safely convert error message to string and provide a fallback
  const errorMessage = error?.message ? String(error.message) : 'An unexpected error occurred';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="text-center p-8 rounded-lg bg-white shadow-lg">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
        <p className="text-gray-600 mb-4">{errorMessage}</p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <AuthPage onAuthSuccess={() => window.location.reload()} />
      </Suspense>
    );
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

          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <TabsContent value="chat">
              <Suspense fallback={<LoadingSpinner />}>
                <ChatInterface />
              </Suspense>
            </TabsContent>

            <TabsContent value="test">
              <Suspense fallback={<LoadingSpinner />}>
                <PlacementTest />
              </Suspense>
            </TabsContent>

            <TabsContent value="drills">
              <Suspense fallback={<LoadingSpinner />}>
                <DrillRecommendations />
              </Suspense>
            </TabsContent>

            <TabsContent value="topics">
              <Suspense fallback={<LoadingSpinner />}>
                <GrammarTopics />
              </Suspense>
            </TabsContent>
          </ErrorBoundary>
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