
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, MessageCircle, User, CheckCircle, Trophy, Zap, Target } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
import PlacementTest from '@/components/PlacementTest';
import UserProfile from '@/components/UserProfile';
import DrillRecommendations from '@/components/DrillRecommendations';
import AuthPage from '@/components/AuthPage';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

const AppContent = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (authLoading || profileLoading) {
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

  const achievements = [
    { id: 1, name: 'Grammar Guru', icon: '🎯', unlocked: (profile?.xp || 0) >= 100 },
    { id: 2, name: 'Week Warrior', icon: '🔥', unlocked: (profile?.streak || 0) >= 7 },
    { id: 3, name: 'Vocabulary Master', icon: '📚', unlocked: false },
    { id: 4, name: 'Perfect Score', icon: '💯', unlocked: false }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                GrammarAI
              </h1>
              <p className="text-gray-600">Your AI-powered grammar learning companion</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                Level {profile?.level || 'A1'}
              </Badge>
              <div className="flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-sm">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="font-semibold">{profile?.xp || 0} XP</span>
              </div>
              <div className="flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-sm">
                <Target className="h-4 w-4 text-orange-500" />
                <span className="font-semibold">{profile?.streak || 0} day streak</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span>AI Tutor</span>
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Placement Test</span>
            </TabsTrigger>
            <TabsTrigger value="drills" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Drills</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Welcome Card */}
              <Card className="lg:col-span-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <CardHeader>
                  <CardTitle className="text-2xl">Welcome back, {profile?.username || 'Student'}! 🎉</CardTitle>
                  <CardDescription className="text-blue-100">
                    You're doing great! Keep up the momentum with your daily practice.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-3xl font-bold">{profile?.completed_lessons || 0}</div>
                      <div className="text-sm text-blue-100">Lessons Completed</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">
                        {Math.round(((profile?.completed_lessons || 0) / (profile?.total_lessons || 45)) * 100)}%
                      </div>
                      <div className="text-sm text-blue-100">Overall Progress</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Progress 
                      value={((profile?.completed_lessons || 0) / (profile?.total_lessons || 45)) * 100} 
                      className="bg-blue-400" 
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Jump into learning</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab('chat')}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat with AI Tutor
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('test')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Take Assessment
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('drills')}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Practice Drills
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span>Achievements</span>
                </CardTitle>
                <CardDescription>Your learning milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                        achievement.unlocked
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="text-3xl mb-2">{achievement.icon}</div>
                      <div className="text-sm font-medium text-center">{achievement.name}</div>
                      {achievement.unlocked && (
                        <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700">
                          Unlocked
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Progress</CardTitle>
                <CardDescription>Your learning activity this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { topic: 'Present Perfect Tense', score: 85, date: '2 days ago' },
                    { topic: 'Conditional Sentences', score: 92, date: '3 days ago' },
                    { topic: 'Passive Voice', score: 78, date: '5 days ago' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{item.topic}</div>
                        <div className="text-sm text-gray-600">{item.date}</div>
                      </div>
                      <Badge variant={item.score >= 85 ? 'default' : 'secondary'}>
                        {item.score}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <ChatInterface />
          </TabsContent>

          <TabsContent value="test">
            <PlacementTest />
          </TabsContent>

          <TabsContent value="drills">
            <DrillRecommendations />
          </TabsContent>

          <TabsContent value="profile">
            <UserProfile userData={profile} achievements={achievements} />
          </TabsContent>
        </Tabs>
      </div>
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
