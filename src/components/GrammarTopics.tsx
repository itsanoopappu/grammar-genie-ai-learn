import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, BookOpen, Target, MessageCircle, Leaf, Sprout, Trees as Tree, CheckCircle, Clock } from 'lucide-react';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useAtom } from 'jotai';
import { activeTabAtom, topicToDrillAtom } from '@/hooks/useGlobalUIState';

const grammarStructure = {
  beginner: {
    icon: Sprout,
    title: '🌱 Beginner Level (A1–A2 CEFR)',
    description: 'Build basic sentence structures and foundational grammar.',
    sections: [
      {
        title: '1. Parts of Speech Introduction',
        topics: [
          'Nouns: singular/plural, countable/uncountable',
          'Pronouns: subject, object, possessive, reflexive',
          'Verbs: base form, "to be", simple present',
          'Adjectives: basic description, order of adjectives',
          'Adverbs: of time, place, manner',
          'Prepositions: in, on, at, under, next to',
          'Articles: a, an, the',
          'Conjunctions: and, but, or'
        ]
      },
      {
        title: '2. Sentence Basics',
        topics: [
          'Subject-verb-object structure',
          'Affirmative and negative sentences',
          'Question formation with "do/does"',
          'Capitalization and punctuation'
        ]
      },
      {
        title: '3. Tenses – Basic',
        topics: [
          'Simple Present',
          'Present Continuous',
          'Simple Past',
          'Past Continuous'
        ]
      },
      {
        title: '4. Noun & Verb Agreement',
        topics: [
          'Singular/plural subject-verb agreement',
          'Irregular verbs list (basic)'
        ]
      },
      {
        title: '5. Questions & Negations',
        topics: [
          'Yes/No questions',
          'WH-questions',
          'Negative sentences with do/does/did'
        ]
      }
    ]
  },
  intermediate: {
    icon: Leaf,
    title: '🌿 Intermediate Level (B1–B2 CEFR)',
    description: 'Improve sentence complexity, variety, and accuracy.',
    sections: [
      {
        title: '1. Tenses – Intermediate',
        topics: [
          'Present Perfect',
          'Present Perfect Continuous',
          'Past Perfect',
          'Future: will / going to / present continuous',
          'Mixed tense usage'
        ]
      },
      {
        title: '2. Complex Sentences',
        topics: [
          'Compound & complex sentence formation',
          'Use of subordinating conjunctions: because, although, since, unless'
        ]
      },
      {
        title: '3. Modals',
        topics: [
          'Can, could, may, might, must, should, shall, would',
          'Modals for advice, obligation, possibility, permission'
        ]
      },
      {
        title: '4. Conditionals',
        topics: [
          'Zero, First, Second Conditionals',
          'Introduction to Third Conditional'
        ]
      },
      {
        title: '5. Comparatives and Superlatives',
        topics: [
          'Regular and irregular adjectives',
          'Using "more" and "most"'
        ]
      },
      {
        title: '6. Passive Voice',
        topics: [
          'Simple present and past',
          'Intro to passive with other tenses'
        ]
      },
      {
        title: '7. Gerunds and Infinitives',
        topics: [
          'Verb + -ing',
          'Verb + to + base verb',
          'Common verb patterns'
        ]
      }
    ]
  },
  advanced: {
    icon: Tree,
    title: '🌳 Advanced Level (C1–C2 CEFR)',
    description: 'Polish grammar for fluency, precision, and nuance.',
    sections: [
      {
        title: '1. All Tenses Mastery',
        topics: [
          'Advanced usage of all 12 tenses',
          'Perfect and perfect continuous forms',
          'Future perfect and future perfect continuous'
        ]
      },
      {
        title: '2. Advanced Modals & Conditionals',
        topics: [
          'Third Conditional (regrets)',
          'Mixed Conditionals',
          'Modal verbs in the past (should have, might have)'
        ]
      },
      {
        title: '3. Complex Structures',
        topics: [
          'Inversion (Never have I seen…)',
          'Emphatic structures (It is you who…)',
          'Ellipsis and substitution'
        ]
      },
      {
        title: '4. Reported Speech',
        topics: [
          'Statements, questions, and commands',
          'Changes in pronouns, tenses, time expressions'
        ]
      },
      {
        title: '5. Relative Clauses',
        topics: [
          'Defining and non-defining',
          'Use of who, which, that, whose'
        ]
      },
      {
        title: '6. Advanced Passive',
        topics: [
          'Passive in all tenses',
          'Passive with modals',
          'Passive with reporting verbs'
        ]
      },
      {
        title: '7. Phrasal Verbs & Idioms',
        topics: [
          'Separable and inseparable phrasal verbs',
          'Idiomatic expressions by context (business, casual, academic)'
        ]
      },
      {
        title: '8. Nominalization & Formal Grammar',
        topics: [
          'Turning verbs/adjectives into nouns',
          'Use in academic/formal writing'
        ]
      }
    ]
  }
};

export function GrammarTopics() {
  const [openLevel, setOpenLevel] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const { getTopicMasteryStatus } = useUserProgress();
  const [_, setActiveTab] = useAtom(activeTabAtom);
  const [__, setTopicToDrill] = useAtom(topicToDrillAtom);

  const handlePractice = (topic: string) => {
    setTopicToDrill(topic);
    setActiveTab('drills');
  };

  const handleDiscuss = (topic: string) => {
    setTopicToDrill(topic);
    setActiveTab('chat');
  };

  const getMasteryBadge = (topic: string, level: string) => {
    const status = getTopicMasteryStatus(topic, level);
    switch (status) {
      case 'mastered':
        return (
          <Badge variant="secondary\" className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Mastered
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <span>English Grammar Topics</span>
          </CardTitle>
          <CardDescription>
            Comprehensive guide from beginner to advanced levels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(grammarStructure).map(([level, { icon: Icon, title, description, sections }]) => (
            <Card key={level} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Icon className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="text-sm text-gray-600">{description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Collapsible
                  open={openLevel === level}
                  onOpenChange={() => setOpenLevel(openLevel === level ? null : level)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between mb-2"
                    >
                      <span>View Topics</span>
                      {openLevel === level ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-4">
                        {sections.map((section) => (
                          <div key={section.title} className="space-y-2">
                            <h4 className="font-semibold text-blue-600">{section.title}</h4>
                            <div className="pl-4 space-y-2">
                              {section.topics.map((topic) => (
                                <div
                                  key={topic}
                                  className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm">{topic}</span>
                                    {getMasteryBadge(topic, level.toUpperCase())}
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0"
                                      onClick={() => handlePractice(topic)}
                                    >
                                      <Target className="h-4 w-4" />
                                      <span className="sr-only">Practice</span>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0"
                                      onClick={() => handleDiscuss(topic)}
                                    >
                                      <MessageCircle className="h-4 w-4" />
                                      <span className="sr-only">Discuss</span>
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}