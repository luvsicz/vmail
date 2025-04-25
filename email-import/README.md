# Email Import Tool

This tool imports email data from JSON files into a PostgreSQL database. It was created to migrate data from Turso SQLite to PostgreSQL.

## Setup

1. Make sure you have Node.js installed
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with your PostgreSQL connection string:
   ```
   DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
   DATABASE_TYPE=pg
   ```

## Usage

### Basic Import

To import a single JSON file:

```bash
node import-emails.js
```

This will import the `emails.json` file in the current directory.

### Batch Import

The batch import script provides more detailed output and can process multiple JSON files:

```bash
# Import the default emails.json file
node import-emails-batch.js

# Import a specific JSON file
node import-emails-batch.js /path/to/emails.json

# Import all JSON files in a directory
node import-emails-batch.js /path/to/directory
```

## Features

- Handles both single files and directories of JSON files
- Transforms data to match the PostgreSQL schema
- Provides detailed progress and summary information
- Skips duplicate entries (using ON CONFLICT DO NOTHING)
- Handles errors gracefully
- Uses transactions for data integrity

## JSON Data Format

The JSON data should be an array of email objects with the following structure:

```json
[
  {
    "id": "unique-id",
    "message_from": "sender@example.com",
    "message_to": "recipient@example.com",
    "headers": "[{\"key\":\"header-key\",\"value\":\"header-value\"}]",
    "from": "{\"address\":\"sender@example.com\",\"name\":\"Sender Name\"}",
    "to": "[{\"address\":\"recipient@example.com\",\"name\":\"Recipient Name\"}]",
    "subject": "Email Subject",
    "html": "<p>Email content</p>",
    "created_at": 1745516731,
    "updated_at": 1745516731
    // ... other fields
  }
]
```

## Database Schema

The script is designed to work with the following PostgreSQL schema:

```sql
CREATE TABLE emails (
  id TEXT PRIMARY KEY,
  message_from TEXT NOT NULL,
  message_to TEXT NOT NULL,
  headers JSONB NOT NULL,
  "from" JSONB NOT NULL,
  sender JSONB,
  reply_to JSONB NOT NULL,
  delivered_to TEXT,
  return_path TEXT,
  "to" JSONB NOT NULL,
  cc JSONB NOT NULL,
  bcc JSONB NOT NULL,
  subject TEXT,
  message_id TEXT NOT NULL,
  in_reply_to TEXT,
  "references" TEXT,
  date TEXT,
  html TEXT,
  text TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
