-- Create enums for sender and test_type if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chat_sender_type') THEN
        CREATE TYPE chat_sender_type AS ENUM ('user', 'ai');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'test_type') THEN
        CREATE TYPE test_type AS ENUM ('standard', 'adaptive');
    END IF;
END $$;

-- Add temporary text columns to store the converted values
ALTER TABLE chat_messages 
ADD COLUMN sender_text text;

ALTER TABLE placement_tests
ADD COLUMN test_type_text text;

-- Copy the existing data to text columns
UPDATE chat_messages 
SET sender_text = LOWER(sender::text)
WHERE sender IS NOT NULL;

UPDATE placement_tests
SET test_type_text = LOWER(test_type::text)
WHERE test_type IS NOT NULL;

-- Drop the original columns
ALTER TABLE chat_messages 
DROP COLUMN sender;

ALTER TABLE placement_tests
DROP COLUMN test_type;

-- Add new columns with enum types
ALTER TABLE chat_messages
ADD COLUMN sender chat_sender_type;

ALTER TABLE placement_tests
ADD COLUMN test_type test_type;

-- Convert text to enum types
UPDATE chat_messages
SET sender = sender_text::chat_sender_type
WHERE sender_text IS NOT NULL;

UPDATE placement_tests
SET test_type = test_type_text::test_type
WHERE test_type_text IS NOT NULL;

-- Drop temporary text columns
ALTER TABLE chat_messages
DROP COLUMN sender_text;

ALTER TABLE placement_tests
DROP COLUMN test_type_text;

-- Add NOT NULL constraints
ALTER TABLE chat_messages
ALTER COLUMN sender SET NOT NULL;

ALTER TABLE placement_tests
ALTER COLUMN test_type SET NOT NULL;