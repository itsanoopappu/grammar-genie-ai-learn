import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';

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

export function GrammarSidebar() {
  const [openLevel, setOpenLevel] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  return (
    <div className="w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center border-b px-4">
        <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
        <h2 className="font-semibold">Grammar Topics</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-3.5rem)]">
        <div className="p-2">
          {Object.entries(grammarLevels).map(([level, topics]) => (
            <Collapsible
              key={level}
              open={openLevel === level}
              onOpenChange={() => setOpenLevel(openLevel === level ? null : level)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between"
                >
                  <span className="font-semibold">Level {level}</span>
                  {openLevel === level ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pl-4 py-2">
                  {topics.map((topic) => (
                    <Button
                      key={topic}
                      variant="ghost"
                      className={`w-full justify-start text-sm ${
                        selectedTopic === topic ? 'bg-accent' : ''
                      }`}
                      onClick={() => setSelectedTopic(topic)}
                    >
                      {topic}
                    </Button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}