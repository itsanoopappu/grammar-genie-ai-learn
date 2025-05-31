
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Loader2 } from 'lucide-react';
import { useTopics } from '@/hooks/useTopics';
import { useIntelligentTutor } from '@/hooks/useIntelligentTutor';
import { PracticeCard } from '@/components/ui/practice-card';
import GrammarTopicFilters from './GrammarTopicFilters';
import LoadingState from './LoadingState';
import ErrorDisplay from './ErrorDisplay';

interface OptimizedGrammarTopicsProps {
  onTopicSelect: (topicId: string) => void;
}

interface FilterState {
  search: string;
  levels: string[];
  categories: string[];
  difficulty: string;
  sortBy: string;
}

const OptimizedGrammarTopics: React.FC<OptimizedGrammarTopicsProps> = ({ onTopicSelect }) => {
  const { data: topics = [], isLoading, error, refetch } = useTopics();
  const { topicRecommendations } = useIntelligentTutor();
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    levels: [],
    categories: [],
    difficulty: 'all',
    sortBy: 'name'
  });

  // Get unique categories from topics
  const availableCategories = useMemo(() => {
    return Array.from(new Set(topics.map(topic => topic.category))).sort();
  }, [topics]);

  // Filter and sort topics
  const filteredTopics = useMemo(() => {
    let filtered = [...topics];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(topic =>
        topic.name.toLowerCase().includes(searchLower) ||
        topic.description?.toLowerCase().includes(searchLower)
      );
    }

    // Level filter
    if (filters.levels.length > 0) {
      filtered = filtered.filter(topic => filters.levels.includes(topic.level));
    }

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(topic => filters.categories.includes(topic.category));
    }

    // Difficulty filter
    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(topic => {
        const difficulty = topic.difficulty_score;
        switch (filters.difficulty) {
          case 'easy': return difficulty <= 30;
          case 'medium': return difficulty > 30 && difficulty <= 70;
          case 'hard': return difficulty > 70;
          default: return true;
        }
      });
    }

    // Sort topics
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'difficulty':
          return a.difficulty_score - b.difficulty_score;
        case 'level':
          const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
          return levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level);
        case 'recommended':
          const aRecommended = topicRecommendations.some(rec => rec.id === a.id);
          const bRecommended = topicRecommendations.some(rec => rec.id === b.id);
          if (aRecommended && !bRecommended) return -1;
          if (!aRecommended && bRecommended) return 1;
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [topics, filters, topicRecommendations]);

  const getDifficultyLevel = (score: number): 'Easy' | 'Medium' | 'Hard' => {
    if (score <= 30) return 'Easy';
    if (score <= 70) return 'Medium';
    return 'Hard';
  };

  const getEstimatedTime = (difficultyScore: number): number => {
    // Base time on difficulty: easier topics = less time
    if (difficultyScore <= 30) return 15;
    if (difficultyScore <= 70) return 25;
    return 35;
  };

  const isTopicRecommended = (topicId: string): boolean => {
    return topicRecommendations.some(rec => rec.id === topicId);
  };

  const getTopicPriority = (topicId: string): 'high' | 'normal' | 'low' => {
    const recommendation = topicRecommendations.find(rec => rec.id === topicId);
    return recommendation?.priority || 'normal';
  };

  const getTopicReason = (topicId: string): string | undefined => {
    const recommendation = topicRecommendations.find(rec => rec.id === topicId);
    return recommendation?.reason;
  };

  if (isLoading) {
    return <LoadingState message="Loading grammar topics..." />;
  }

  if (error) {
    return <ErrorDisplay error={error.message} onRetry={refetch} />;
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
          {filteredTopics.map((topic) => {
            const isRecommended = isTopicRecommended(topic.id);
            const priority = getTopicPriority(topic.id);
            const reason = getTopicReason(topic.id);
            
            return (
              <PracticeCard
                key={topic.id}
                title={topic.name}
                description={topic.description || ''}
                level={topic.level}
                difficulty={getDifficultyLevel(topic.difficulty_score)}
                estimatedTime={getEstimatedTime(topic.difficulty_score)}
                priority={priority}
                recommended={isRecommended}
                reason={reason}
                variant={isRecommended ? 'ai' : 'topic'}
                onAction={() => onTopicSelect(topic.id)}
                actionLabel="Start Practice"
                className="h-full"
              />
            );
          })}
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

export default OptimizedGrammarTopics;
