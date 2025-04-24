// db.js - Database connection and operations
require("dotenv").config();
const { Client } = require("pg");

// Create main database client
const createClient = (database = process.env.DB_NAME) => {
  return new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: database,
    ssl: {
      rejectUnauthorized: true,
    },
  });
};

// Main client instance
const client = createClient();

// Connect to the database
const connect = async () => {
  try {
    await client.connect();
    console.log("✅ Connected to PostgreSQL");
    return true;
  } catch (err) {
    console.error("❌ PostgreSQL Connection Error:", err.message);
    return false;
  }
};

// Get database schema information
const getSchemaInfo = async () => {
  try {
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const tables = await client.query(tablesQuery);
    let schemaInfo = "";
    
    for (const table of tables.rows) {
      const tableName = table.table_name;
      
      const columnsQuery = `
        SELECT column_name, data_type 
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `;
      
      const columns = await client.query(columnsQuery, [tableName]);
      
      schemaInfo += `Table '${tableName}' with columns: \n`;
      columns.rows.forEach(col => {
        schemaInfo += `- ${col.column_name} (${col.data_type})\n`;
      });
      schemaInfo += "\n";
    }
    
    return schemaInfo || "Table 'users' with columns: id (SERIAL PRIMARY KEY), name (VARCHAR), email (VARCHAR), age (INTEGER)";
  } catch (err) {
    console.error("❌ Error getting schema info:", err);
    return "Table 'users' with columns: id (SERIAL PRIMARY KEY), name (VARCHAR), email (VARCHAR), age (INTEGER)";
  }
};

// Create a new database
const createDatabase = async (dbName, tables = []) => {
  // Create a new client connected to the default postgres database
  const adminClient = createClient('postgres');
  
  try {
    await adminClient.connect();
    console.log(`✅ Connected to default PostgreSQL database for DDL operations`);
    
    // Check if database already exists
    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
    const dbExists = await adminClient.query(checkDbQuery, [dbName]);
    
    if (dbExists.rows.length > 0) {
      await adminClient.end();
      return { success: false, error: `Database '${dbName}' already exists` };
    }
    
    // Create the database
    await adminClient.query(`CREATE DATABASE ${dbName}`);
    console.log(`✅ Database '${dbName}' created successfully`);
    
    // Close the admin connection
    await adminClient.end();
    
    // If tables are specified, connect to the new database and create them
    if (tables && tables.length > 0) {
      const newDbClient = createClient(dbName);
      
      try {
        await newDbClient.connect();
        console.log(`✅ Connected to new database '${dbName}' for table creation`);
        
        // Execute each table creation statement
        for (const tableQuery of tables) {
          await newDbClient.query(tableQuery);
        }
        
        console.log(`✅ Tables created in database '${dbName}'`);
        await newDbClient.end();
        
        return { 
          success: true, 
          message: `Database '${dbName}' created successfully with specified tables` 
        };
      } catch (tableErr) {
        console.error(`❌ Error creating tables in new database:`, tableErr);
        await newDbClient.end();
        return { 
          success: false, 
          message: `Database '${dbName}' created, but error creating tables`,
          error: tableErr.message
        };
      }
    }
    
    return { 
      success: true, 
      message: `Database '${dbName}' created successfully` 
    };
  } catch (err) {
    console.error(`❌ Error creating database:`, err);
    await adminClient.end();
    return { success: false, error: err.message };
  }
};

// Execute SQL query
const executeQuery = async (sql) => {
  try {
    const result = await client.query(sql);
    console.log("SQL executed successfully");
    return { success: true, result };
  } catch (err) {
    console.error("❌ Error executing SQL:", err);
    return { 
      success: false, 
      error: err.message 
    };
  }
};

// Extract table creation statements from SQL
const extractTableStatements = (sql) => {
  if (!sql) {
    return { success: false, error: "SQL statement is required" };
  }
  
  try {
    const sqlLower = sql.toLowerCase();
    
    // Check if it contains CREATE DATABASE
    if (!sqlLower.includes('create database')) {
      return { success: false, error: "No CREATE DATABASE statement found" };
    }
    
    // Extract database name
    const dbNameMatch = sql.match(/CREATE\s+DATABASE\s+([a-zA-Z0-9_]+)/i);
    const dbName = dbNameMatch ? dbNameMatch[1] : null;
    
    if (!dbName) {
      return { success: false, error: "Could not extract database name" };
    }
    
    // Extract CREATE TABLE statements
    const tableStatements = [];
    const tableRegex = /CREATE\s+TABLE\s+([^;]+;)/gi;
    let match;
    
    while ((match = tableRegex.exec(sql)) !== null) {
      tableStatements.push(match[0]);
    }
    
    return {
      success: true,
      dbName,
      tables: tableStatements,
      message: `Found ${tableStatements.length} table creation statements`
    };
  } catch (err) {
    console.error("❌ Error extracting table statements:", err);
    return { success: false, error: err.message };
  }
};

module.exports = {
  client,
  connect,
  getSchemaInfo,
  createDatabase,
  executeQuery,
  extractTableStatements
};