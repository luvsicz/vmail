const fs = require('fs');
const { Client } = require('pg');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Function to parse JSON data
async function loadJsonData(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading or parsing JSON file:', error);
    throw error;
  }
}

// Function to transform data to match database schema
function transformEmailData(email) {
  // Parse string JSON fields
  const headers = typeof email.headers === 'string' ? JSON.parse(email.headers) : email.headers;
  const from = typeof email.from === 'string' ? JSON.parse(email.from) : email.from;
  const to = typeof email.to === 'string' ? JSON.parse(email.to) : email.to;
  const cc = typeof email.cc === 'string' ? JSON.parse(email.cc) : email.cc;
  const bcc = typeof email.bcc === 'string' ? JSON.parse(email.bcc) : email.bcc;
  const replyTo = typeof email.reply_to === 'string' ? JSON.parse(email.reply_to) : email.reply_to;
  const sender = email.sender && typeof email.sender === 'string' ? JSON.parse(email.sender) : email.sender;

  // Convert timestamps to ISO format if they are numbers
  const createdAt = typeof email.created_at === 'number' 
    ? new Date(email.created_at * 1000).toISOString() 
    : email.created_at;
  
  const updatedAt = typeof email.updated_at === 'number' 
    ? new Date(email.updated_at * 1000).toISOString() 
    : email.updated_at;

  return {
    id: email.id,
    message_from: email.message_from,
    message_to: email.message_to,
    headers: headers,
    from: from,
    sender: sender,
    reply_to: replyTo,
    delivered_to: email.delivered_to,
    return_path: email.return_path,
    to: to,
    cc: cc,
    bcc: bcc,
    subject: email.subject,
    message_id: email.message_id,
    in_reply_to: email.in_reply_to,
    references: email.references,
    date: email.date,
    html: email.html,
    text: email.text,
    created_at: createdAt,
    updated_at: updatedAt
  };
}

// Function to insert data into PostgreSQL
async function insertEmails(emails) {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    await client.connect();
    await client.query('BEGIN');
    
    for (const email of emails) {
      const transformedEmail = transformEmailData(email);
      
      const query = `
        INSERT INTO emails (
          id, message_from, message_to, headers, "from", sender, reply_to, 
          delivered_to, return_path, "to", cc, bcc, subject, message_id, 
          in_reply_to, "references", date, html, text, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
          $15, $16, $17, $18, $19, $20, $21
        ) ON CONFLICT (id) DO NOTHING
      `;
      
      const values = [
        transformedEmail.id,
        transformedEmail.message_from,
        transformedEmail.message_to,
        JSON.stringify(transformedEmail.headers),
        JSON.stringify(transformedEmail.from),
        transformedEmail.sender ? JSON.stringify(transformedEmail.sender) : null,
        JSON.stringify(transformedEmail.reply_to),
        transformedEmail.delivered_to,
        transformedEmail.return_path,
        JSON.stringify(transformedEmail.to),
        JSON.stringify(transformedEmail.cc),
        JSON.stringify(transformedEmail.bcc),
        transformedEmail.subject,
        transformedEmail.message_id,
        transformedEmail.in_reply_to,
        transformedEmail.references,
        transformedEmail.date,
        transformedEmail.html,
        transformedEmail.text,
        transformedEmail.created_at,
        transformedEmail.updated_at
      ];
      
      await client.query(query, values);
      console.log(`Inserted email with ID: ${transformedEmail.id}`);
    }
    
    await client.query('COMMIT');
    console.log(`Successfully imported ${emails.length} emails`);
  } catch (error) {
    await client.query('ROLLBACK').catch(err => console.error('Error during rollback:', err));
    console.error('Error inserting emails:', error);
    throw error;
  } finally {
    await client.end().catch(err => console.error('Error closing client:', err));
  }
}

// Main function
async function main() {
  try {
    console.log('Starting email import process...');
    
    // Load JSON data
    const jsonFilePath = path.join(__dirname, 'emails.json');
    const emails = await loadJsonData(jsonFilePath);
    console.log(`Loaded ${emails.length} emails from JSON file`);
    
    // Insert emails into PostgreSQL
    await insertEmails(emails);
    
    console.log('Email import completed successfully');
  } catch (error) {
    console.error('Error in import process:', error);
    process.exit(1);
  }
}

// Run the main function
main();
