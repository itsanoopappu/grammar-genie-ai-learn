-- Populate grammar_topics table with initial data
INSERT INTO grammar_topics (name, description, level, category, difficulty_score, prerequisites, learning_objectives, common_errors)
VALUES
  -- A1 Level Topics
  ('Present Simple', 'Basic present tense for habits and facts', 'A1', 'Tenses', 10, 
   '[]'::jsonb,
   '["Express daily routines", "Describe general facts", "Form basic statements"]'::jsonb,
   '["Subject-verb agreement", "Third person -s", "Auxiliary do/does in questions"]'::jsonb),
   
  ('Articles', 'Usage of a, an, and the', 'A1', 'Determiners', 15,
   '[]'::jsonb,
   '["Use articles correctly with nouns", "Distinguish between a/an", "Recognize when to use the"]'::jsonb,
   '["Missing articles", "Wrong article choice", "Unnecessary article use"]'::jsonb),
   
  ('Personal Pronouns', 'Subject and object pronouns', 'A1', 'Pronouns', 20,
   '[]'::jsonb,
   '["Use subject pronouns correctly", "Use object pronouns", "Replace nouns with pronouns"]'::jsonb,
   '["Wrong pronoun case", "Gender confusion", "Unnecessary pronoun repetition"]'::jsonb),

  -- A2 Level Topics
  ('Past Simple', 'Regular and irregular verbs in past tense', 'A2', 'Tenses', 30,
   '["Present Simple"]'::jsonb,
   '["Form regular past tense", "Use irregular verbs", "Create past questions"]'::jsonb,
   '["Irregular verb forms", "Ed ending pronunciation", "Time marker confusion"]'::jsonb),
   
  ('Comparatives', 'Comparing things using adjectives', 'A2', 'Adjectives', 35,
   '["Adjectives"]'::jsonb,
   '["Form comparative adjectives", "Use than in comparisons", "Compare multiple items"]'::jsonb,
   '["Double comparatives", "Than/then confusion", "Irregular forms"]'::jsonb),

  -- B1 Level Topics
  ('Present Perfect', 'Connecting past to present', 'B1', 'Tenses', 50,
   '["Present Simple", "Past Simple"]'::jsonb,
   '["Use for past with present relevance", "Form perfect tense", "Choose between perfect/past"]'::jsonb,
   '["For/since confusion", "Perfect vs past simple", "Present perfect continuous mix-up"]'::jsonb),
   
  ('Conditionals', 'Zero and first conditional', 'B1', 'Conditionals', 55,
   '["Present Simple", "Future Forms"]'::jsonb,
   '["Express real conditions", "Form if clauses", "Use future in main clause"]'::jsonb,
   '["Tense consistency", "If/when confusion", "Comma usage"]'::jsonb),

  -- B2 Level Topics
  ('Passive Voice', 'All tenses in passive form', 'B2', 'Voice', 70,
   '["Present Simple", "Past Simple", "Present Perfect"]'::jsonb,
   '["Transform active to passive", "Choose when to use passive", "Form complex passive structures"]'::jsonb,
   '["Agent inclusion/omission", "Tense in passive", "By phrase position"]'::jsonb),
   
  ('Reported Speech', 'Reporting statements and questions', 'B2', 'Reported Speech', 75,
   '["All Tenses", "Questions"]'::jsonb,
   '["Report statements", "Report questions", "Use reporting verbs"]'::jsonb,
   '["Tense backshift", "Pronoun changes", "Time expression changes"]'::jsonb),

  -- C1 Level Topics
  ('Mixed Conditionals', 'Complex conditional structures', 'C1', 'Conditionals', 85,
   '["All Conditionals"]'::jsonb,
   '["Mix time references", "Express complex conditions", "Use advanced conditional structures"]'::jsonb,
   '["Tense combinations", "Modal perfect forms", "Mixed time references"]'::jsonb),
   
  ('Inversion', 'Negative and conditional inversion', 'C1', 'Word Order', 90,
   '["Advanced Word Order", "Conditionals"]'::jsonb,
   '["Use negative inversion", "Form conditional inversion", "Apply emphatic inversion"]'::jsonb,
   '["Auxiliary verb choice", "Subject-verb agreement", "Incomplete inversion"]'::jsonb),

  -- C2 Level Topics
  ('Cleft Structures', 'Complex emphasis structures', 'C2', 'Emphasis', 95,
   '["Advanced Word Order", "Relative Clauses"]'::jsonb,
   '["Form it-cleft sentences", "Use what-cleft structures", "Apply all-cleft patterns"]'::jsonb,
   '["Relative pronoun choice", "Verb agreement", "Pronoun reference"]'::jsonb),
   
  ('Subjunctive Mood', 'Formal and hypothetical uses', 'C2', 'Mood', 100,
   '["All Tenses", "Conditionals"]'::jsonb,
   '["Use formal subjunctive", "Apply hypothetical past", "Form advanced unreal patterns"]'::jsonb,
   '["Were/was usage", "Time reference", "Modal alternative forms"]'::jsonb);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_grammar_topics_level ON grammar_topics(level);
CREATE INDEX IF NOT EXISTS idx_grammar_topics_category ON grammar_topics(category);
CREATE INDEX IF NOT EXISTS idx_grammar_topics_difficulty ON grammar_topics(difficulty_score);