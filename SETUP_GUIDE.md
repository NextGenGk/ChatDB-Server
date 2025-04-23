# Step-by-Step Implementation Guide

This guide will walk you through setting up and implementing the PostgreSQL Natural Language Query API from scratch.

## Setup Phase

### Step 1: Initialize project and install dependencies

Create a new directory for your project and initialize it:

```bash
mkdir postgres-nl-query-api
cd postgres-nl-query-api
npm init -y
```

Install required dependencies:

```bash
npm install express cors pg axios dotenv
```

### Step 2: Create environment variables template

Create a `.env.example` file with the following content:

```
# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=your_default_database

# API Keys
OPENROUTER_API_KEY=your_openrouter_api_key

# Server Configuration
PORT=5000
```

Then create your actual `.env` file with your real credentials:

```bash
cp .env.example .env
# Now edit .env with your actual values
```

## Implementation Phase

### Step 3: Create the database module (db.js)

Create `db.js` with the following sections:

1. **Setup and Configuration**:
   - Import required packages
   - Configure database client creation function

2. **Core Functions**:
   - Database connection
   - Schema information retrieval
   - SQL query execution

3. **Database Management**:
   - Database creation
   - Table extraction and validation

4. **Export the module**:
   - Export all functions for use in other files

### Step 4: Create the OpenRouter integration (openrouter.js)

Create `openrouter.js` with the following sections:

1. **API Integration**:
   - Configure API request functionality
   - Handle natural language to SQL conversion

2. **SQL Analysis**:
   - Determine SQL operation types
   - Validate SQL for prohibited operations

3. **Export the module**:
   - Export functions for use in the main application

### Step 5: Create the main application (index.js)

Create `index.js` with the following sections:

1. **Server Setup**:
   - Configure Express
   - Set up middleware
   - Connect to database

2. **Basic Endpoints**:
   - Root endpoint for status check
   - Data retrieval endpoint
   - User creation endpoint

3. **Advanced Endpoints**:
   - Natural language query processing
   - Database creation
   - SQL analysis helpers

4. **Server Initialization**:
   - Start the server on configured port

## Testing Phase

### Step 6: Start the server

Start your application:

```bash
node index.js
```

You should see:
```
✅ Connected to PostgreSQL
🚀 Server running on port 5000
```

### Step 7: Test basic endpoints

Use curl or a tool like Postman to test:

1. **Check server status**:
   ```bash
   curl http://localhost:5000/
   ```

2. **Get all users**:
   ```bash
   curl http://localhost:5000/data
   ```

3. **Add a user**:
   ```bash
   curl -X POST http://localhost:5000/add-user \
     -H "Content-Type: application/json" \
     -d '{"name": "Jane Smith", "email": "jane@example.com", "age": 28}'
   ```

### Step 8: Test natural language queries

Try converting natural language to SQL:

```bash
curl -X POST http://localhost:5000/natural-language \
  -H "Content-Type: application/json" \
  -d '{"command": "Get all users older than 30"}'
```

### Step 9: Test database creation

Create a new database with tables:

```bash
curl -X POST http://localhost:5000/create-database \
  -H "Content-Type: application/json" \
  -d '{"dbName": "analytics", "tables": ["CREATE TABLE metrics (id SERIAL PRIMARY KEY, name VARCHAR(255), value NUMERIC);"]}'
```

## Troubleshooting Common Issues

### Database Connection Issues

If you see "PostgreSQL Connection Error":

1. Check if PostgreSQL is running
2. Verify credentials in `.env` file
3. Ensure network accessibility to database

### OpenRouter API Issues

If natural language queries fail:

1. Check your OpenRouter API key
2. Examine API response logs for error details
3. Verify internet connectivity

### SQL Execution Errors

For "Could not execute the SQL query" errors:

1. Check the generated SQL in the response
2. Verify table structure matches the query
3. Look for syntax errors in the SQL

## Advanced Configuration

### Customizing the OpenRouter Model

To change the AI model used for SQL generation, modify the `model` parameter in `openrouter.js`:

```javascript
// In openrouter.js
const response = await axios.post(
  "https://openrouter.ai/api/v1/chat/completions",
  {
    model: "another-model", // Change from "deepseek/deepseek-r1:free"
    // rest of configuration...
  },
  // ...
);
```

### Database Schema Customization

For better SQL generation with complex schemas, you can enhance the schema context in `db.js`:

```javascript
// In getSchemaInfo function of db.js
// Add additional schema information like foreign keys or indexes
const relationshipsQuery = `
  SELECT
    tc.table_name, kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
  FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
  WHERE constraint_type = 'FOREIGN KEY';
`;

// Process and add this to schemaInfo
```

## Next Steps

Once the basic system is working, consider these enhancements:

1. Add authentication for API security
2. Implement query history tracking
3. Add visualization capabilities for query results
4. Create a web interface for easier interaction
5. Implement user roles and permissions for database operations