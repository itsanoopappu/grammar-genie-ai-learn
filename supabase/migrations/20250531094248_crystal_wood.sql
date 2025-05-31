-- Create enums for sender and test_type
CREATE TYPE chat_sender_type AS ENUM ('user', 'ai');
CREATE TYPE test_type AS ENUM ('standard', 'adaptive');

-- Update existing data to match new enum values
UPDATE chat_messages 
SET sender = LOWER(sender)
WHERE sender IS NOT NULL;

UPDATE placement_tests
SET test_type = LOWER(test_type)
WHERE test_type IS NOT NULL;

-- Add temporary columns with new types
ALTER TABLE chat_messages 
ADD COLUMN sender_new chat_sender_type;

ALTER TABLE placement_tests
ADD COLUMN test_type_new test_type;

-- Convert existing data to new enum types
UPDATE chat_messages 
SET sender_new = sender::text::chat_sender_type
WHERE sender IS NOT NULL;

UPDATE placement_tests
SET test_type_new = test_type::text::test_type
WHERE test_type IS NOT NULL;

-- Drop old columns and rename new ones (fixed syntax)
ALTER TABLE chat_messages 
DROP COLUMN sender;

ALTER TABLE chat_messages
RENAME COLUMN sender_new TO sender;

ALTER TABLE placement_tests
DROP COLUMN test_type;

ALTER TABLE placement_tests
RENAME COLUMN test_type_new TO test_type;

-- Add NOT NULL constraints
ALTER TABLE chat_messages
ALTER COLUMN sender SET NOT NULL;

ALTER TABLE placement_tests
ALTER COLUMN test_type SET NOT NULL;