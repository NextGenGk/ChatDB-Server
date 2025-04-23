// openrouter.js - OpenRouter API integration
require("dotenv").config();
const axios = require("axios");

// Generate SQL from natural language using OpenRouter API
const generateSql = async (command, schemaInfo) => {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-r1:free", // Change model if necessary
        messages: [
          {
            role: "system",
            content: `You are an assistant that translates natural language into SQL. Only respond with the raw SQL query. The database is PostgreSQL and has the following structure:

${schemaInfo}

You can generate any valid PostgreSQL SQL, including but not limited to:
- SELECT queries (with JOINs, GROUP BY, HAVING, ORDER BY, LIMIT)
- INSERT, UPDATE, DELETE operations
- CREATE TABLE, ALTER TABLE, DROP TABLE statements
- CREATE INDEX, constraints, triggers
- Complex aggregations, window functions
- Common Table Expressions (CTEs)

Important: Do NOT generate CREATE DATABASE commands as they cannot be executed within a transaction. For database creation, the user should use the dedicated /create-database endpoint instead.

Focus on generating clean, efficient, and correct SQL that follows PostgreSQL syntax.
DO NOT include any explanations or markdown formatting in your response.
ONLY return the raw SQL query without any backticks, comments, or explanations.`,
          },
          {
            role: "user",
            content: command,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let sql = response.data.choices[0].message.content.trim();

    // Remove the "```sql" block if it exists
    if (sql.startsWith("```sql") || sql.startsWith("```")) {
      sql = sql.replace(/```sql|```/g, "").trim();
    }

    console.log("Generated SQL:", sql);
    
    return { success: true, sql };
  } catch (err) {
    console.error("❌ Error with OpenRouter API:", err.response?.data || err.message);
    return { 
      success: false, 
      error: err.response?.data?.error || err.message 
    };
  }
};

// Determine SQL operation type
const getSqlOperationType = (sql) => {
  if (!sql) return "unknown";
  
  const sqlLower = sql.toLowerCase();
  
  if (sqlLower.startsWith("select")) {
    return "read";
  } else if (sqlLower.startsWith("insert")) {
    return "write";
  } else if (sqlLower.startsWith("update")) {
    return "write";
  } else if (sqlLower.startsWith("delete")) {
    return "write";
  } else if (sqlLower.startsWith("create")) {
    return "ddl";  // Data Definition Language
  } else if (sqlLower.startsWith("alter")) {
    return "ddl";
  } else if (sqlLower.startsWith("drop")) {
    return "ddl";
  } else {
    return "other";
  }
};

// Check if SQL contains CREATE DATABASE command
const containsCreateDatabase = (sql) => {
  if (!sql) return false;
  return sql.toLowerCase().includes('create database');
};

module.exports = {
  generateSql,
  getSqlOperationType,
  containsCreateDatabase
};