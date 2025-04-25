const fs = require('fs');
const { Client } = require('pg');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

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
    console.error(`Error reading or parsing JSON file ${filePath}:`, error);
    throw error;
  }
}

// Function to transform data to match database schema
function transformEmailData(email) {
  // Parse string JSON fields
  const headers = typeof email.headers === 'string' ? JSON.parse(email.headers) : email.headers;
  const from = typeof email.from === 'string' ? JSON.parse(email.from) : email.from;
  const to = typeof email.to === 'string' ? JSON.parse(email.to) : email.to;
  const cc = typeof email.cc === 'string' ? JSON.parse(email.cc) : email.cc || [];
  const bcc = typeof email.bcc === 'string' ? JSON.parse(email.bcc) : email.bcc || [];
  const replyTo = typeof email.reply_to === 'string' ? JSON.parse(email.reply_to) : email.reply_to || [];
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
async function insertEmails(emails, client) {
  let insertedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const email of emails) {
    try {
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
        RETURNING id
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
      
      const result = await client.query(query, values);
      
      if (result.rowCount > 0) {
        insertedCount++;
        process.stdout.write(`\rInserted: ${insertedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
      } else {
        skippedCount++;
        process.stdout.write(`\rInserted: ${insertedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
      }
    } catch (error) {
      errorCount++;
      console.error(`\nError inserting email with ID ${email.id}:`, error.message);
      process.stdout.write(`\rInserted: ${insertedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
    }
  }
  
  console.log('\nImport summary:');
  console.log(`- Inserted: ${insertedCount}`);
  console.log(`- Skipped (already exists): ${skippedCount}`);
  console.log(`- Errors: ${errorCount}`);
  
  return { insertedCount, skippedCount, errorCount };
}

// Function to find all JSON files in a directory
async function findJsonFiles(directory) {
  const files = await readdir(directory);
  const jsonFiles = [];
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    const fileStat = await stat(filePath);
    
    if (fileStat.isFile() && path.extname(file).toLowerCase() === '.json') {
      jsonFiles.push(filePath);
    }
  }
  
  return jsonFiles;
}

// Main function
async function main() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Process single file or directory based on command line arguments
    const targetPath = process.argv[2] || path.join(__dirname, 'emails.json');
    
    let totalInserted = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    
    const targetStat = await stat(targetPath);
    
    if (targetStat.isDirectory()) {
      // Process all JSON files in directory
      console.log(`Processing all JSON files in directory: ${targetPath}`);
      const jsonFiles = await findJsonFiles(targetPath);
      console.log(`Found ${jsonFiles.length} JSON files`);
      
      for (const [index, jsonFile] of jsonFiles.entries()) {
        console.log(`\nProcessing file ${index + 1}/${jsonFiles.length}: ${jsonFile}`);
        const emails = await loadJsonData(jsonFile);
        console.log(`Loaded ${emails.length} emails from ${jsonFile}`);
        
        const { insertedCount, skippedCount, errorCount } = await insertEmails(emails, client);
        
        totalInserted += insertedCount;
        totalSkipped += skippedCount;
        totalErrors += errorCount;
      }
    } else {
      // Process single file
      console.log(`Processing single file: ${targetPath}`);
      const emails = await loadJsonData(targetPath);
      console.log(`Loaded ${emails.length} emails from ${targetPath}`);
      
      const { insertedCount, skippedCount, errorCount } = await insertEmails(emails, client);
      
      totalInserted += insertedCount;
      totalSkipped += skippedCount;
      totalErrors += errorCount;
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('\nOverall import summary:');
    console.log(`- Total inserted: ${totalInserted}`);
    console.log(`- Total skipped: ${totalSkipped}`);
    console.log(`- Total errors: ${totalErrors}`);
    console.log('Email import completed successfully');
  } catch (error) {
    await client.query('ROLLBACK').catch(err => console.error('Error during rollback:', err));
    console.error('Error in import process:', error);
    process.exit(1);
  } finally {
    await client.end().catch(err => console.error('Error closing client:', err));
  }
}

// Run the main function
main();
