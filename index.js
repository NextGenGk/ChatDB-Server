
// index.js - Main application server
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");
const openrouter = require("./openrouter");

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database
db.connect().catch(err => {
  console.error("Failed to connect to database:", err);
  process.exit(1);
});

// Root Endpoint
app.get("/", (req, res) => {
  res.send("✅ MCP PostgreSQL Server is running...");
});

// Fetch all users
app.get("/data", async (req, res) => {
  try {
    const result = await db.client.query("SELECT * FROM users;");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching data:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add a new user manually
app.post("/add-user", async (req, res) => {
  const { name, email, age } = req.body;
  if (!name || !email || !age) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check if the email already exists
    const existingUser = await db.client.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const result = await db.client.query(
      "INSERT INTO users (name, email, age) VALUES ($1, $2, $3) RETURNING *",
      [name, email, age]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error inserting user:", err);
    res.status(500).json({ error: "Could not insert user" });
  }
});

// Create a new database
app.post("/create-database", async (req, res) => {
  const { dbName, tables } = req.body;
  
  if (!dbName) {
    return res.status(400).json({ error: "Database name is required" });
  }
  
  // Validate tables format if provided
  if (tables && !Array.isArray(tables)) {
    return res.status(400).json({ 
      error: "Tables must be an array of SQL statements",
      example: {
        dbName: "example_db",
        tables: ["CREATE TABLE table1 (id SERIAL PRIMARY KEY, name VARCHAR(255));"]
      }
    });
  }
  
  const result = await db.createDatabase(dbName, tables);
  
  if (result.success) {
    res.json({ message: result.message });
  } else {
    res.status(400).json({ 
      error: result.error || "Could not create database",
      message: result.message
    });
  }
});

// 🧠 Enhanced Natural Language to SQL via OpenRouter
app.post("/natural-language", async (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({ error: "Natural language command is required." });
  }

  try {
    // Get database schema for better context
    const schemaInfo = await db.getSchemaInfo();
    
    // Generate SQL from natural language
    const sqlResult = await openrouter.generateSql(command, schemaInfo);
    
    if (!sqlResult.success) {
      return res.status(500).json({ 
        error: "Could not generate SQL from natural language command",
        details: sqlResult.error
      });
    }
    
    const sql = sqlResult.sql;
    
    // Check for CREATE DATABASE command
    if (openrouter.containsCreateDatabase(sql)) {
      return res.status(400).json({
        error: "CREATE DATABASE command detected",
        details: "CREATE DATABASE cannot be executed through this endpoint. Please use the /create-database endpoint instead.",
        sql: sql,
        suggestion: "Use POST /create-database with a JSON body containing {dbName: 'your_db_name'}"
      });
    }

    // Identify SQL operation type
    const operationType = openrouter.getSqlOperationType(sql);
    console.log("Operation type:", operationType);

    // Execute the SQL
    const queryResult = await db.executeQuery(sql);
    
    if (!queryResult.success) {
      return res.status(500).json({ 
        error: "Could not execute the SQL query.", 
        details: queryResult.error,
        sql: sql
      });
    }
    
    const result = queryResult.result;

    // Prepare the response based on the operation type
    const response_data = {
      sql: sql,
      operationType: operationType
    };
    
    if (operationType === "read") {
      response_data.result = result.rows;
      response_data.rowCount = result.rowCount;
    } else if (operationType === "write" || operationType === "ddl") {
      response_data.affectedRows = result.rowCount;
      response_data.message = `Operation completed successfully. ${result.rowCount || 0} rows affected.`;
    } else {
      response_data.result = result;
    }

    res.json(response_data);
    
  } catch (err) {
    console.error("❌ Error with natural language command:", err);
    res.status(500).json({ 
      error: "Could not process the natural language command.",
      details: err.message
    });
  }
});

// Helper endpoint to extract table creation statements from CREATE DATABASE command
app.post("/extract-create-tables", async (req, res) => {
  const { sql } = req.body;
  
  const result = db.extractTableStatements(sql);
  
  if (result.success) {
    res.json({
      dbName: result.dbName,
      tables: result.tables,
      message: result.message
    });
  } else {
    res.status(400).json({ error: result.error });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));