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

-- Add temporary columns with new types
ALTER TABLE chat_messages 
ADD COLUMN sender_new chat_sender_type;

ALTER TABLE placement_tests
ADD COLUMN test_type_new test_type;

-- Convert existing data to new enum types
UPDATE chat_messages 
SET sender_new = (CASE 
    WHEN LOWER(sender::text) = 'user' THEN 'user'::chat_sender_type
    ELSE 'ai'::chat_sender_type
END)
WHERE sender IS NOT NULL;

UPDATE placement_tests
SET test_type_new = (CASE 
    WHEN LOWER(test_type::text) = 'standard' THEN 'standard'::test_type
    ELSE 'adaptive'::test_type
END)
WHERE test_type IS NOT NULL;

-- Drop old columns and add new ones with correct types
ALTER TABLE chat_messages 
DROP COLUMN sender;

ALTER TABLE chat_messages
ADD COLUMN sender chat_sender_type;

UPDATE chat_messages
SET sender = sender_new;

ALTER TABLE chat_messages
DROP COLUMN sender_new;

ALTER TABLE placement_tests
DROP COLUMN test_type;

ALTER TABLE placement_tests
ADD COLUMN test_type test_type;

UPDATE placement_tests
SET test_type = test_type_new;

ALTER TABLE placement_tests
DROP COLUMN test_type_new;

-- Add NOT NULL constraints
ALTER TABLE chat_messages
ALTER COLUMN sender SET NOT NULL;

ALTER TABLE placement_tests
ALTER COLUMN test_type SET NOT NULL;