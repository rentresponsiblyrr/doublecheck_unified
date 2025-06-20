
-- Enable the HTTP extension for making HTTP requests from database functions
CREATE EXTENSION IF NOT EXISTS http;

-- Verify the extension is properly enabled
SELECT extname FROM pg_extension WHERE extname = 'http';
