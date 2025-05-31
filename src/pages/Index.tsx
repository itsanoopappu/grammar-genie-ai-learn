import { useState } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import AuthPage from '@/components/AuthPage';
import { Header } from '@/components/Header';
import MainLayout from '@/components/MainLayout';

const AppContent = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeFeature, setActiveFeature] = useState('smart-practice');

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
      <MainLayout defaultFeature={activeFeature} />
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