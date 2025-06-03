
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { User, Award, TrendingUp, Calendar, Target, Zap, BookOpen } from 'lucide-react';

interface UserProfileProps {
  userData: {
    username: string;
    level: string;
    xp: number;
    streak: number;
    totalLessons: number;
    completedLessons: number;
  };
  achievements: Array<{
    id: number;
    name: string;
    icon: string;
    unlocked: boolean;
  }>;
}

const UserProfile = ({ userData, achievements }: UserProfileProps) => {
  const progressData = [
    { topic: 'Grammar', progress: 75, color: 'bg-blue-500' },
    { topic: 'Vocabulary', progress: 60, color: 'bg-green-500' },
    { topic: 'Reading', progress: 85, color: 'bg-purple-500' },
    { topic: 'Writing', progress: 70, color: 'bg-orange-500' }
  ];

  const recentActivity = [
    { date: '2024-01-15', activity: 'Completed Present Perfect drill', xp: 50 },
    { date: '2024-01-14', activity: 'Placement test retaken', xp: 100 },
    { date: '2024-01-13', activity: 'Chat session with AI tutor', xp: 25 },
    { date: '2024-01-12', activity: 'Conditional sentences practice', xp: 75 },
    { date: '2024-01-11', activity: 'Vocabulary quiz completed', xp: 40 }
  ];

  const levelProgress = ((userData.xp % 1000) / 1000) * 100;
  const nextLevelXP = Math.ceil(userData.xp / 1000) * 1000;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="h-10 w-10 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold">{userData.username}</h2>
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Level {userData.level}
                </Badge>
                <div className="flex items-center space-x-1 text-gray-600">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span>{userData.xp} XP</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-600">
                  <Target className="h-4 w-4 text-orange-500" />
                  <span>{userData.streak} day streak</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Progress to next level</span>
                  <span>{userData.xp % 1000}/{1000} XP</span>
                </div>
                <Progress value={levelProgress} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Learning Progress</span>
            </CardTitle>
            <CardDescription>Your performance across different areas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {progressData.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.topic}</span>
                  <span className="text-sm text-gray-600">{item.progress}%</span>
                </div>
                <Progress value={item.progress} className="h-2" />
              </div>
            ))}
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{userData.completedLessons}</div>
                <div className="text-sm text-gray-600">Lessons Completed</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Target className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {Math.round((userData.completedLessons / userData.totalLessons) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Course Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <span>Achievements</span>
            </CardTitle>
            <CardDescription>Your learning milestones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border ${
                  achievement.unlocked
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <div className="font-medium">{achievement.name}</div>
                  {achievement.unlocked && (
                    <Badge variant="secondary" className="mt-1 bg-green-100 text-green-700">
                      Unlocked
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              View All Achievements
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-purple-500" />
            <span>Recent Activity</span>
          </CardTitle>
          <CardDescription>Your learning activity over the past week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{activity.activity}</div>
                  <div className="text-sm text-gray-600">{activity.date}</div>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                  +{activity.xp} XP
                </Badge>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            View Full Activity History
          </Button>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Customize your learning experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline">Edit Profile</Button>
            <Button variant="outline">Learning Preferences</Button>
            <Button variant="outline">Notification Settings</Button>
            <Button variant="outline">Privacy Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
