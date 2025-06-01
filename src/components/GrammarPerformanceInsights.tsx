
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp, TrendingDown, Target, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface GrammarPerformance {
  grammar_category: string;
  grammar_topic: string;
  level: string;
  correct_count: number;
  incorrect_count: number;
  total_attempts: number;
  accuracy_rate: number;
  proficiency_score: number;
  last_practiced: string;
}

const GrammarPerformanceInsights = () => {
  const [grammarPerformance, setGrammarPerformance] = useState<GrammarPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchGrammarPerformance();
    }
  }, [user]);

  const fetchGrammarPerformance = async () => {
    try {
      const { data, error } = await supabase
        .from('user_grammar_performance')
        .select('*')
        .eq('user_id', user?.id)
        .order('proficiency_score', { ascending: false });

      if (error) throw error;
      setGrammarPerformance(data || []);
    } catch (error) {
      console.error('Error fetching grammar performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (accuracy: number) => {
    if (accuracy >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (accuracy >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getPerformanceIcon = (accuracy: number) => {
    if (accuracy >= 0.8) return <TrendingUp className="h-4 w-4" />;
    if (accuracy >= 0.6) return <Target className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  const categoryStats = grammarPerformance.reduce((acc, item) => {
    if (!acc[item.grammar_category]) {
      acc[item.grammar_category] = {
        totalAttempts: 0,
        totalCorrect: 0,
        topics: 0,
        avgProficiency: 0
      };
    }
    
    acc[item.grammar_category].totalAttempts += item.total_attempts;
    acc[item.grammar_category].totalCorrect += item.correct_count;
    acc[item.grammar_category].topics += 1;
    acc[item.grammar_category].avgProficiency += item.proficiency_score;
    
    return acc;
  }, {} as Record<string, any>);

  // Calculate averages
  Object.keys(categoryStats).forEach(category => {
    const stats = categoryStats[category];
    stats.accuracy = stats.totalAttempts > 0 ? stats.totalCorrect / stats.totalAttempts : 0;
    stats.avgProficiency = stats.topics > 0 ? stats.avgProficiency / stats.topics : 0;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <span>Grammar Performance Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (grammarPerformance.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <span>Grammar Performance Insights</span>
          </CardTitle>
          <CardDescription>
            Take an assessment to see your grammar performance insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No grammar performance data available yet.</p>
            <p className="text-sm text-gray-500 mt-2">
              Complete assessments or practice sessions to see detailed grammar insights.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <span>Grammar Category Performance</span>
          </CardTitle>
          <CardDescription>
            Your performance across different grammar categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(categoryStats).map(([category, stats]) => (
              <div key={category} className="p-4 rounded-lg border bg-gradient-to-r from-purple-50 to-indigo-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800 capitalize">{category.replace('_', ' ')}</h4>
                  <Badge variant="outline" className={getPerformanceColor(stats.accuracy)}>
                    {Math.round(stats.accuracy * 100)}%
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Topics practiced: {stats.topics}</span>
                    <span>Total attempts: {stats.totalAttempts}</span>
                  </div>
                  <Progress value={stats.accuracy * 100} className="h-2" />
                  <div className="flex items-center space-x-1 text-sm">
                    {getPerformanceIcon(stats.accuracy)}
                    <span className="text-gray-600">
                      Proficiency: {Math.round(stats.avgProficiency * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Topic Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-500" />
            <span>Detailed Topic Performance</span>
          </CardTitle>
          <CardDescription>
            Performance breakdown by specific grammar topics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {grammarPerformance.slice(0, 10).map((item, index) => (
              <div key={`${item.grammar_category}-${item.grammar_topic}-${item.level}`} 
                   className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h5 className="font-medium text-gray-800">{item.grammar_topic}</h5>
                    <Badge variant="outline" className="text-xs">
                      {item.level}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {item.grammar_category}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.correct_count}/{item.total_attempts} correct • 
                    Last practiced: {new Date(item.last_practiced).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      item.accuracy_rate >= 0.8 ? 'text-green-600' :
                      item.accuracy_rate >= 0.6 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {Math.round(item.accuracy_rate * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round(item.proficiency_score * 100)}% prof.
                    </div>
                  </div>
                  {getPerformanceIcon(item.accuracy_rate)}
                </div>
              </div>
            ))}
          </div>
          
          {grammarPerformance.length > 10 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Showing top 10 topics. {grammarPerformance.length - 10} more topics available.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Improvement Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-orange-500" />
            <span>Improvement Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Topics needing improvement */}
            {grammarPerformance
              .filter(item => item.accuracy_rate < 0.7)
              .slice(0, 5)
              .map((item, index) => (
                <div key={index} className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-orange-800">
                      Focus on: {item.grammar_topic}
                    </span>
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                      {item.level}
                    </Badge>
                  </div>
                  <p className="text-sm text-orange-700">
                    Current accuracy: {Math.round(item.accuracy_rate * 100)}% • 
                    Practice more {item.grammar_category} exercises to improve
                  </p>
                </div>
              ))}
            
            {grammarPerformance.filter(item => item.accuracy_rate < 0.7).length === 0 && (
              <div className="text-center py-4">
                <Award className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-green-700 font-medium">Great job!</p>
                <p className="text-sm text-green-600">
                  You're performing well across all practiced grammar topics.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GrammarPerformanceInsights;
