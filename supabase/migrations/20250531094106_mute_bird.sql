-- Create enums for sender and test_type
CREATE TYPE chat_sender_type AS ENUM ('User', 'AI');
CREATE TYPE test_type AS ENUM ('Standard', 'Adaptive');

-- Modify existing tables to use enums
ALTER TABLE chat_messages 
  ALTER COLUMN sender TYPE chat_sender_type 
  USING sender::chat_sender_type;

ALTER TABLE placement_tests
  ALTER COLUMN test_type TYPE test_type
  USING test_type::test_type;

-- Add constraints
ALTER TABLE chat_messages
  ADD CONSTRAINT chat_messages_sender_check 
  CHECK (sender IN ('User', 'AI'));

ALTER TABLE placement_tests
  ADD CONSTRAINT placement_tests_test_type_check 
  CHECK (test_type IN ('Standard', 'Adaptive'));