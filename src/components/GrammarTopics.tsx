import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookOpen, ChevronRight, MessageCircle, Target } from 'lucide-react';

const grammarStructure = {
  A1: {
    'Verbs & tenses': [
      'Present simple of "be"',
      'There is/are',
      'Present simple',
      'Present continuous',
      'Past simple of "be"',
      'Past simple for regular verbs',
      'Past simple for irregular verbs'
    ],
    'Clauses & questions': [
      'Questions – closed',
      'Questions – open',
      'Because clauses'
    ],
    'Modal verbs': [
      'Would like',
      'Ability – can / can\'t / could / couldn\'t'
    ],
    'Nonfinite verbs': [
      'Like / hate / love + gerund'
    ],
    'Nouns': [
      'Subject & object pronouns',
      'Demonstrative pronouns – this / that / these / those',
      'Possessive case – \'s',
      'Irregular plural nouns',
      'How much / many + noun'
    ],
    'Adjectives': [
      'Demonstrative adjectives – this / that / these / those',
      'Adjectives as complements of "be"',
      'Adjectives before nouns',
      'Possessive adjectives'
    ],
    'Adverbs': [
      'Adverbs of time & indefinite frequency',
      'Adverbs of frequency',
      'Adverbs of degree – very / really / too'
    ],
    'Other parts of speech': [
      'Parts of speech',
      'Coordinating conjunctions',
      'Indefinite article – a / an',
      'Definite article – the',
      'Prepositions of time',
      'Prepositions of place'
    ]
  },
  A2: {
    'Verbs & tenses': [
      'Past continuous',
      'Future – will vs going to',
      'Future – present tenses for the future',
      'Present perfect',
      'Imperative',
      'Stative verbs'
    ],
    'Clauses & questions': [
      'Conditionals – zero',
      'Conditionals – 1st',
      'Adverb clauses of time – when / while',
      'Questions – subject'
    ],
    'Modal verbs': [
      'Ability – be able to',
      'Advice – should',
      'Possibility – might / may / could',
      'Obligation & prohibition – must / have to / don\'t have to',
      'Requests – can / could / will / would',
      'Imagined situations – would',
      'Permission – can / can\'t',
      'Suggestion – could / let\'s / shall',
      'General truths & facts'
    ],
    'Nonfinite verbs': [
      'Want / need + to-infinitive'
    ],
    'Nouns': [
      'Countable & uncountable nouns',
      'Someone / anyone / no one / everyone',
      'Something / anything / nothing / everything'
    ],
    'Adjectives': [
      'Adjective order',
      'Comparatives & superlatives',
      'Comparatives for equality',
      'Expressing similarity – same / like / alike',
      'Irregular adjectives'
    ],
    'Adverbs': [
      'Adverb placement',
      'Adverbs of degree & intensity',
      'Adverbs of manner',
      'Comparative adverbs'
    ],
    'Other parts of speech': [
      'Zero article (no article)',
      'Some / any / none / every / all',
      'Quantifiers'
    ]
  },
  B1: {
    'Verbs & tenses': [
      'Subject-verb agreement',
      'Past habits',
      'Used to / be used to / get used to',
      'Present perfect continuous',
      'Past perfect',
      'Past perfect continuous',
      'Passive voice – simple tenses',
      'Phrasal verbs'
    ],
    'Clauses & questions': [
      'Relative clauses',
      'Adverb clauses of time',
      'Adverb clauses of reason / purpose / contrast',
      'Conditionals – 2nd',
      'Conditionals – 3rd',
      'Reported speech – say & tell',
      'Noun clauses – "that" vs "WH" clauses',
      'Questions – tag',
      'Questions – indirect / embedded'
    ],
    'Modal verbs': [
      'Permission & requests – might / may',
      'Possibility & deduction (in the present)',
      'Suggestion expressions'
    ],
    'Nonfinite verbs': [
      'Gerunds & infinitives as subjects',
      'Gerunds & infinitives as objects',
      'Gerunds & infinitives as objects (different meanings)',
      'Gerunds & infinitives for purpose'
    ],
    'Nouns': [
      'Reflexive & reciprocal pronouns'
    ],
    'Adjectives': [
      'Adjectives ending in "-ing" and "-ed"'
    ],
    'Adverbs': [
      'Conjunctive adverbs',
      'Adverbs of time for perfect tenses'
    ],
    'Other parts of speech': [
      'Dependent prepositions'
    ]
  },
  B2: {
    'Verbs & tenses': [
      'Future time expressions with "be"',
      'Future in the past',
      'Future continuous',
      'Future perfect',
      'Future perfect continuous',
      'Passive voice – other tenses & modals',
      'Passive voice – gerunds & infinitives',
      'Causative verbs',
      'Verbs of the senses'
    ],
    'Clauses & questions': [
      'Relative clauses – possessive (whose)',
      'Relative clauses – relative adverbs',
      'Relative clauses – prepositions',
      'Relative clauses – sentential',
      'Relative clauses – reduced',
      'Conditionals – "if" alternatives',
      'Conditionals – "would" alternatives',
      'Conditionals – mixed',
      'Participle clauses',
      'Reported speech – questions / requests / commands',
      'Questions – past for politeness',
      'Questions – negative (including uncontracted)'
    ],
    'Modal verbs': [
      'Certainty expressions',
      'Obligation expressions',
      'Possibility & deduction (in the past)',
      'Regret & unreality',
      'Ideal situations',
      'Expectations – should / might / may + be + continuous'
    ],
    'Nonfinite verbs': [
      'To-infinitives as adverbs & adjectives'
    ],
    'Other parts of speech': [
      'Emphasis – do / did'
    ]
  },
  'C1+': {
    'Verbs & tenses': [
      'Subjunctive mood',
      'Imperative – 3rd person (let) / don\'t you / pointing'
    ],
    'Clauses & questions': [
      'Cleft sentences',
      'Conditionals – imperatives',
      'Conditionals – reduced & inverted',
      'Inversion – structure',
      'Inversion – negative adverbials',
      'Inversion – restrictive adverbials',
      'Relative clauses – some of which / many of which',
      'Adverb clauses for focus – whatever / wherever / however',
      'Nonfinite clauses (advanced)',
      'Passive voice clauses for sentence focus',
      'Wide range of reporting verbs – academic use',
      'Emphasis expressions',
      'Fronting for emphasis'
    ],
    'Modal verbs': [
      'Dare',
      'Expressions to give opinions',
      'Criticism & disapproval'
    ],
    'Adjectives': [
      'Comparatives & superlatives with intensifiers',
      'Superlatives with postmodifiers',
      'Compound adjectives',
      'Adjectives after nouns'
    ],
    'Adverbs': [
      'Adverbs with prepositional phrases',
      'Extreme adverbs to modify non-gradable adjectives'
    ],
    'Other parts of speech': [
      'Conjunctions – and yet / in that / either…or / neither…nor',
      'Discourse markers',
      'Distancing',
      'Hedging',
      'Ellipsis & substitution'
    ]
  }
};

const GrammarTopics = () => {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleTopicClick = (topic: string) => {
    // Navigate to practice or trigger practice mode
    console.log('Selected topic:', topic);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {Object.entries(grammarStructure).map(([level, categories]) => (
        <Card key={level} className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span>Level {level}</span>
            </CardTitle>
            <CardDescription>
              {level === 'A1' || level === 'A2' ? 'Basic/Elementary Level' :
               level === 'B1' || level === 'B2' ? 'Intermediate Level' :
               'Advanced Level'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ScrollArea className="h-full pr-4">
              {Object.entries(categories).map(([category, topics]) => (
                <div key={category} className="mb-6 last:mb-0">
                  <h3 className="text-lg font-semibold text-blue-700 mb-3">{category}</h3>
                  <div className="grid gap-2">
                    {topics.map((topic) => (
                      <Card 
                        key={topic}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleTopicClick(topic)}
                      >
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{topic}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Navigate to practice
                              }}
                            >
                              <Target className="h-4 w-4" />
                              <span className="sr-only">Practice</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Open chat with context
                              }}
                            >
                              <MessageCircle className="h-4 w-4" />
                              <span className="sr-only">Discuss</span>
                            </Button>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <Separator className="my-6" />
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default GrammarTopics;