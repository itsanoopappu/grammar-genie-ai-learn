import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { BookOpen, ChevronRight, Target, Brain, Star } from 'lucide-react';
import IntelligentPractice from './IntelligentPractice';

interface GrammarTopic {
  id: string;
  name: string;
  description: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  category: string;
  subtopics?: string[];
  examples?: string[];
}

const grammarStructure = {
  beginner: {
    title: '🌱 Beginner Level (A1–A2 CEFR)',
    description: 'Build basic sentence structures and foundational grammar.',
    sections: [
      {
        title: '1. Parts of Speech Introduction',
        topics: [
          { id: 'nouns', name: 'Nouns', description: 'Singular/plural, countable/uncountable', level: 'A1', category: 'Parts of Speech' },
          { id: 'pronouns', name: 'Pronouns', description: 'Subject, object, possessive, reflexive', level: 'A1', category: 'Parts of Speech' },
          { id: 'verbs-basic', name: 'Verbs', description: 'Base form, "to be", simple present', level: 'A1', category: 'Parts of Speech' },
          { id: 'adjectives', name: 'Adjectives', description: 'Basic description, order of adjectives', level: 'A1', category: 'Parts of Speech' },
          { id: 'adverbs', name: 'Adverbs', description: 'Time, place, manner', level: 'A1', category: 'Parts of Speech' },
          { id: 'prepositions', name: 'Prepositions', description: 'In, on, at, under, next to', level: 'A1', category: 'Parts of Speech' },
          { id: 'articles', name: 'Articles', description: 'A, an, the', level: 'A1', category: 'Parts of Speech' },
          { id: 'conjunctions', name: 'Conjunctions', description: 'And, but, or', level: 'A1', category: 'Parts of Speech' }
        ]
      },
      {
        title: '2. Sentence Basics',
        topics: [
          { id: 'svo-structure', name: 'Subject-verb-object structure', description: 'Basic sentence patterns', level: 'A1', category: 'Sentence Structure' },
          { id: 'affirmative-negative', name: 'Affirmative and negative sentences', description: 'Making positive and negative statements', level: 'A1', category: 'Sentence Structure' },
          { id: 'questions-do-does', name: 'Question formation with "do/does"', description: 'Basic question structures', level: 'A1', category: 'Questions' },
          { id: 'punctuation', name: 'Capitalization and punctuation', description: 'Basic writing mechanics', level: 'A1', category: 'Writing' }
        ]
      },
      {
        title: '3. Tenses – Basic',
        topics: [
          { id: 'simple-present', name: 'Simple Present', description: 'Regular actions and states', level: 'A1', category: 'Tenses' },
          { id: 'present-continuous', name: 'Present Continuous', description: 'Actions happening now', level: 'A1', category: 'Tenses' },
          { id: 'simple-past', name: 'Simple Past', description: 'Completed actions', level: 'A2', category: 'Tenses' },
          { id: 'past-continuous', name: 'Past Continuous', description: 'Past actions in progress', level: 'A2', category: 'Tenses' }
        ]
      }
    ]
  },
  intermediate: {
    title: '🌿 Intermediate Level (B1–B2 CEFR)',
    description: 'Improve sentence complexity, variety, and accuracy.',
    sections: [
      {
        title: '1. Tenses – Intermediate',
        topics: [
          { id: 'present-perfect', name: 'Present Perfect', description: 'Past actions with present relevance', level: 'B1', category: 'Tenses' },
          { id: 'present-perfect-continuous', name: 'Present Perfect Continuous', description: 'Ongoing actions until now', level: 'B1', category: 'Tenses' },
          { id: 'past-perfect', name: 'Past Perfect', description: 'Earlier past actions', level: 'B1', category: 'Tenses' },
          { id: 'future-forms', name: 'Future Forms', description: 'Will, going to, present continuous', level: 'B1', category: 'Tenses' }
        ]
      },
      {
        title: '2. Complex Sentences',
        topics: [
          { id: 'compound-complex', name: 'Compound & Complex Sentences', description: 'Joining clauses', level: 'B1', category: 'Sentence Structure' },
          { id: 'subordinating-conjunctions', name: 'Subordinating Conjunctions', description: 'Because, although, since, unless', level: 'B1', category: 'Conjunctions' }
        ]
      }
    ]
  },
  advanced: {
    title: '🌳 Advanced Level (C1–C2 CEFR)',
    description: 'Polish grammar for fluency, precision, and nuance.',
    sections: [
      {
        title: '1. All Tenses Mastery',
        topics: [
          { id: 'advanced-tenses', name: 'Advanced Tenses Usage', description: 'All 12 tenses mastery', level: 'C1', category: 'Tenses' },
          { id: 'perfect-continuous', name: 'Perfect and Continuous Forms', description: 'Complex time expressions', level: 'C1', category: 'Tenses' },
          { id: 'future-perfect', name: 'Future Perfect Forms', description: 'Future perfect and continuous', level: 'C1', category: 'Tenses' }
        ]
      }
    ]
  }
};

const GrammarPractice = () => {
  const [selectedTopic, setSelectedTopic] = useState<GrammarTopic | null>(null);

  const renderTopicCard = (topic: GrammarTopic) => (
    <Card 
      key={topic.id}
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setSelectedTopic(topic)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-medium">{topic.name}</h4>
            <p className="text-sm text-gray-600">{topic.description}</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline">{topic.level}</Badge>
              <Badge variant="secondary">{topic.category}</Badge>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );

  if (selectedTopic) {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedTopic(null)}
          className="mb-4"
        >
          ← Back to Topics
        </Button>
        <IntelligentPractice topicId={selectedTopic.id} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(grammarStructure).map(([level, { title, description, sections }]) => (
        <Card key={level}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <span>{title}</span>
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-full">
              <div className="space-y-6">
                {sections.map((section, index) => (
                  <div key={index}>
                    <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
                    <div className="grid gap-4">
                      {section.topics.map((topic) => renderTopicCard(topic))}
                    </div>
                    {index < sections.length - 1 && <Separator className="my-6" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default GrammarPractice;