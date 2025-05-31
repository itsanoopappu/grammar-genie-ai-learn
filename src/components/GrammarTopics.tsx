
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PracticeCard } from '@/components/ui/practice-card';
import GrammarTopicFilters from './GrammarTopicFilters';

interface GrammarTopic {
  id: string;
  name: string;
  description: string;
  level: string;
  category: string;
  difficulty_score: number;
  prerequisites: string[];
  learning_objectives: string[];
  common_errors: string[];
}

interface GrammarTopicsProps {
  onTopicSelect: (topicId: string) => void;
}

interface FilterState {
  search: string;
  levels: string[];
  categories: string[];
  difficulty: string;
  sortBy: string;
}

const GrammarTopics: React.FC<GrammarTopicsProps> = ({ onTopicSelect }) => {
  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    levels: [],
    categories: [],
    difficulty: 'all',
    sortBy: 'name'
  });

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('grammar-topics', {
        body: { action: 'get_topics' }
      });

      if (error) throw error;
      setTopics(data.topics);
    } catch (err) {
      setError('Failed to load grammar topics');
      console.error('Error fetching topics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories from topics
  const availableCategories = Array.from(new Set(topics.map(topic => topic.category))).sort();

  // Filter and sort topics
  const filteredTopics = topics.filter(topic => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!topic.name.toLowerCase().includes(searchLower) && 
          !topic.description?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Level filter
    if (filters.levels.length > 0 && !filters.levels.includes(topic.level)) {
      return false;
    }

    // Category filter
    if (filters.categories.length > 0 && !filters.categories.includes(topic.category)) {
      return false;
    }

    // Difficulty filter
    if (filters.difficulty !== 'all') {
      const difficulty = topic.difficulty_score;
      switch (filters.difficulty) {
        case 'easy': return difficulty <= 30;
        case 'medium': return difficulty > 30 && difficulty <= 70;
        case 'hard': return difficulty > 70;
        default: return true;
      }
    }

    return true;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'difficulty':
        return a.difficulty_score - b.difficulty_score;
      case 'level':
        const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        return levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level);
      default:
        return 0;
    }
  });

  const getDifficultyLevel = (score: number): 'Easy' | 'Medium' | 'Hard' => {
    if (score <= 30) return 'Easy';
    if (score <= 70) return 'Medium';
    return 'Hard';
  };

  const getEstimatedTime = (difficultyScore: number): number => {
    if (difficultyScore <= 30) return 15;
    if (difficultyScore <= 70) return 25;
    return 35;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <span>Grammar Topics Practice</span>
          </CardTitle>
          <CardDescription>
            Choose from comprehensive grammar topics and start practicing with personalized exercises.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <GrammarTopicFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalTopics={topics.length}
        filteredCount={filteredTopics.length}
        availableCategories={availableCategories}
      />

      {/* Topics Grid */}
      {filteredTopics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic) => (
            <PracticeCard
              key={topic.id}
              title={topic.name}
              description={topic.description || ''}
              level={topic.level}
              difficulty={getDifficultyLevel(topic.difficulty_score)}
              estimatedTime={getEstimatedTime(topic.difficulty_score)}
              priority="normal"
              variant="topic"
              onAction={() => onTopicSelect(topic.id)}
              actionLabel="Start Practice"
              className="h-full"
            />
          ))}
        </div>
      ) : (
        <Card className="text-center p-12">
          <div className="text-gray-500">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">No Topics Found</h3>
            <p className="mb-4">
              No grammar topics match your current filters. Try adjusting your search criteria.
            </p>
            <Badge variant="outline" className="text-gray-600">
              {topics.length} total topics available
            </Badge>
          </div>
        </Card>
      )}
    </div>
  );
};

export default GrammarTopics;
