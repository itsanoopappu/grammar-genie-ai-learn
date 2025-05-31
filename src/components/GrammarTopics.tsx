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
import { ChevronDown, ChevronRight, BookOpen, Target, Zap } from 'lucide-react';

const grammarLevels = {
  'A1': [
    'Adjectives: common and demonstrative',
    'Adverbs of frequency',
    'Comparatives and superlatives',
    'Going to',
    'How much/how many and very',
    'Common uncountable nouns',
    'I\'d like',
    'Imperatives (+/-)',
    'Intensifiers - very basic',
    'Modals: can/can\'t/could/couldn\'t',
    'Past simple of "to be"',
    'Past Simple',
    'Possessive adjectives',
    'Possessive s',
    'Prepositions, common',
    'Prepositions of place',
    'Prepositions of time, including in/on/at',
    'Present continuous',
    'Present simple',
    'Pronouns: simple, personal',
    'Questions',
    'There is/are',
    'To be, including question+negatives',
    'Verb + ing: like/hate/love'
  ],
  'A2': [
    'Adjectives – comparative, use of than and definite article',
    'Adjectives – superlative – use of definite article',
    'Adverbial phrases of time, place and frequency',
    'Adverbs of frequency',
    'Articles with countable and uncountable nouns',
    'Countables and Uncountables: much/many',
    'Future Time (will and going to)',
    'Gerunds',
    'Going to',
    'Imperatives',
    'Modals – can/could',
    'Modals – have to',
    'Modals – should',
    'Past continuous',
    'Past simple',
    'Phrasal verbs – common',
    'Possessives – use of \'s, s\'',
    'Prepositional phrases',
    'Prepositions of time: on/in/at',
    'Present continuous',
    'Present continuous for future',
    'Present perfect',
    'Questions',
    'Verb + ing/infinitive',
    'Wh-questions in past',
    'Zero and 1st conditional'
  ],
  'B1': [
    'Adverbs',
    'Broader range of intensifiers',
    'Comparatives and superlatives',
    'Complex question tags',
    'Conditionals, 2nd and 3rd',
    'Connecting words expressing cause and effect',
    'Future continuous',
    'Modals - must/can\'t deduction',
    'Modals – might, may, will, probably',
    'Modals – should have/might have/etc',
    'Modals: must/have to',
    'Past continuous',
    'Past perfect',
    'Past simple',
    'Past tense responses',
    'Phrasal verbs, extended',
    'Present perfect continuous',
    'Present perfect/past simple',
    'Reported speech',
    'Simple passive',
    'Wh- questions in the past',
    'Will and going to, for prediction'
  ],
  'B2': [
    'Adjectives and adverbs',
    'Future continuous',
    'Future perfect',
    'Future perfect continuous',
    'Mixed conditionals',
    'Modals – can\'t have, needn\'t have',
    'Modals of deduction and speculation',
    'Narrative tenses',
    'Passives',
    'Past perfect',
    'Past perfect continuous',
    'Phrasal verbs, extended',
    'Relative clauses',
    'Reported speech',
    'Will and going to, for prediction',
    'Wish',
    'Would expressing habits, in the past'
  ],
  'C1': [
    'Futures (revision)',
    'Inversion with negative adverbials',
    'Mixed conditionals in past, present and future',
    'Modals in the past',
    'Narrative tenses for experience, incl. passive',
    'Passive forms, all',
    'Phrasal verbs, especially splitting',
    'Wish/if only regrets'
  ]
};

export function GrammarTopics() {
  const [openLevel, setOpenLevel] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <span>Grammar Topics by Level</span>
          </CardTitle>
          <CardDescription>
            Comprehensive overview of English grammar from beginner to advanced levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(grammarLevels).map(([level, topics]) => (
              <Card key={level} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      Level {level}
                    </Badge>
                    <Badge variant="outline">
                      {topics.length} topics
                    </Badge>
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
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                          {topics.map((topic) => (
                            <div
                              key={topic}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
                            >
                              <span className="text-sm">{topic}</span>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => {
                                    // Navigate to practice tab with this topic
                                    document.querySelector('[data-state="inactive"][value="drills"]')?.click();
                                  }}
                                >
                                  <Target className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => {
                                    // Navigate to chat tab with this topic
                                    document.querySelector('[data-state="inactive"][value="chat"]')?.click();
                                  }}
                                >
                                  <Zap className="h-4 w-4" />
                                </Button>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}