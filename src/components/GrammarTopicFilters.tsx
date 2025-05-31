
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Filter, SortAsc } from 'lucide-react';

interface FilterState {
  search: string;
  levels: string[];
  categories: string[];
  difficulty: string;
  sortBy: string;
}

interface GrammarTopicFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  totalTopics: number;
  filteredCount: number;
  availableCategories: string[];
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const DIFFICULTY_RANGES = [
  { label: 'All Difficulties', value: 'all' },
  { label: 'Easy (1-30)', value: 'easy' },
  { label: 'Medium (31-70)', value: 'medium' },
  { label: 'Hard (71-100)', value: 'hard' }
];
const SORT_OPTIONS = [
  { label: 'Alphabetical', value: 'name' },
  { label: 'Difficulty', value: 'difficulty' },
  { label: 'Level', value: 'level' },
  { label: 'Recommended', value: 'recommended' }
];

const GrammarTopicFilters: React.FC<GrammarTopicFiltersProps> = ({
  filters,
  onFiltersChange,
  totalTopics,
  filteredCount,
  availableCategories
}) => {
  const updateFilters = (updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleLevel = (level: string) => {
    const newLevels = filters.levels.includes(level)
      ? filters.levels.filter(l => l !== level)
      : [...filters.levels, level];
    updateFilters({ levels: newLevels });
  };

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    updateFilters({ categories: newCategories });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      levels: [],
      categories: [],
      difficulty: 'all',
      sortBy: 'name'
    });
  };

  const hasActiveFilters = filters.search || filters.levels.length > 0 || 
    filters.categories.length > 0 || filters.difficulty !== 'all';

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search grammar topics..."
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Filter Controls Row */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Level Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Level</label>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map(level => (
              <Badge
                key={level}
                variant={filters.levels.includes(level) ? "default" : "outline"}
                className="cursor-pointer hover:bg-blue-50"
                onClick={() => toggleLevel(level)}
              >
                {level}
              </Badge>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Category</label>
          <div className="flex flex-wrap gap-2 max-w-md">
            {availableCategories.map(category => (
              <Badge
                key={category}
                variant={filters.categories.includes(category) ? "default" : "outline"}
                className="cursor-pointer hover:bg-blue-50 text-xs"
                onClick={() => toggleCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Difficulty Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Difficulty</label>
          <Select value={filters.difficulty} onValueChange={(value) => updateFilters({ difficulty: value })}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_RANGES.map(range => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Sort By</label>
          <Select value={filters.sortBy} onValueChange={(value) => updateFilters({ sortBy: value })}>
            <SelectTrigger className="w-40">
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Summary & Clear Filters */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="text-sm text-gray-600">
          Showing {filteredCount} of {totalTopics} topics
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All Filters
          </Button>
        )}
      </div>

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilters({ search: '' })} />
            </Badge>
          )}
          {filters.levels.map(level => (
            <Badge key={level} variant="secondary" className="gap-1">
              {level}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleLevel(level)} />
            </Badge>
          ))}
          {filters.categories.map(category => (
            <Badge key={category} variant="secondary" className="gap-1">
              {category}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleCategory(category)} />
            </Badge>
          ))}
          {filters.difficulty !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {DIFFICULTY_RANGES.find(r => r.value === filters.difficulty)?.label}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilters({ difficulty: 'all' })} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default GrammarTopicFilters;
