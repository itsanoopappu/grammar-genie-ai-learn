-- Populate grammar_topics table with initial data
INSERT INTO grammar_topics (name, description, level, category, difficulty_score, prerequisites, learning_objectives, common_errors)
VALUES
  -- A1 Level Topics
  ('Present Simple', 'Basic present tense for habits and facts', 'A1', 'Tenses', 10, 
   '[]',
   '["Express daily routines", "Describe general facts", "Form basic statements"]',
   '["Subject-verb agreement", "Third person -s", "Auxiliary do/does in questions"]'),
   
  ('Articles', 'Usage of a, an, and the', 'A1', 'Determiners', 15,
   '[]',
   '["Use articles correctly with nouns", "Distinguish between a/an", "Recognize when to use the"]',
   '["Missing articles", "Wrong article choice", "Unnecessary article use"]'),
   
  ('Personal Pronouns', 'Subject and object pronouns', 'A1', 'Pronouns', 20,
   '[]',
   '["Use subject pronouns correctly", "Use object pronouns", "Replace nouns with pronouns"]',
   '["Wrong pronoun case", "Gender confusion", "Unnecessary pronoun repetition"]'),

  -- A2 Level Topics
  ('Past Simple', 'Regular and irregular verbs in past tense', 'A2', 'Tenses', 30,
   '["Present Simple"]',
   '["Form regular past tense", "Use irregular verbs", "Create past questions"]',
   '["Irregular verb forms", "Ed ending pronunciation", "Time marker confusion"]'),
   
  ('Comparatives', 'Comparing things using adjectives', 'A2', 'Adjectives', 35,
   '["Adjectives"]',
   '["Form comparative adjectives", "Use than in comparisons", "Compare multiple items"]',
   '["Double comparatives", "Than/then confusion", "Irregular forms"]'),

  -- B1 Level Topics
  ('Present Perfect', 'Connecting past to present', 'B1', 'Tenses', 50,
   '["Present Simple", "Past Simple"]',
   '["Use for past with present relevance", "Form perfect tense", "Choose between perfect/past"]',
   '["For/since confusion", "Perfect vs past simple", "Present perfect continuous mix-up"]'),
   
  ('Conditionals', 'Zero and first conditional', 'B1', 'Conditionals', 55,
   '["Present Simple", "Future Forms"]',
   '["Express real conditions", "Form if clauses", "Use future in main clause"]',
   '["Tense consistency", "If/when confusion", "Comma usage"]'),

  -- B2 Level Topics
  ('Passive Voice', 'All tenses in passive form', 'B2', 'Voice', 70,
   '["Present Simple", "Past Simple", "Present Perfect"]',
   '["Transform active to passive", "Choose when to use passive", "Form complex passive structures"]',
   '["Agent inclusion/omission", "Tense in passive", "By phrase position"]'),
   
  ('Reported Speech', 'Reporting statements and questions', 'B2', 'Reported Speech', 75,
   '["All Tenses", "Questions"]',
   '["Report statements", "Report questions", "Use reporting verbs"]',
   '["Tense backshift", "Pronoun changes", "Time expression changes"]'),

  -- C1 Level Topics
  ('Mixed Conditionals', 'Complex conditional structures', 'C1', 'Conditionals', 85,
   '["All Conditionals"]',
   '["Mix time references", "Express complex conditions", "Use advanced conditional structures"]',
   '["Tense combinations", "Modal perfect forms", "Mixed time references"]'),
   
  ('Inversion', 'Negative and conditional inversion', 'C1', 'Word Order', 90,
   '["Advanced Word Order", "Conditionals"]',
   '["Use negative inversion", "Form conditional inversion", "Apply emphatic inversion"]',
   '["Auxiliary verb choice", "Subject-verb agreement", "Incomplete inversion"]),

  -- C2 Level Topics
  ('Cleft Sentences', 'Complex emphasis structures', 'C2', 'Emphasis', 95,
   '["Advanced Word Order", "Relative Clauses"]',
   '["Form it-cleft sentences", "Use what-cleft structures", "Apply all-cleft patterns"]',
   '["Relative pronoun choice", "Verb agreement", "Pronoun reference"]'),
   
  ('Subjunctive', 'Formal and hypothetical uses', 'C2', 'Mood', 100,
   '["All Tenses", "Conditionals"]',
   '["Use formal subjunctive", "Apply hypothetical past", "Form advanced unreal patterns"]',
   '["Were/was usage", "Time reference", "Modal alternative forms"]');

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_grammar_topics_level ON grammar_topics(level);
CREATE INDEX IF NOT EXISTS idx_grammar_topics_category ON grammar_topics(category);
CREATE INDEX IF NOT EXISTS idx_grammar_topics_difficulty ON grammar_topics(difficulty_score);