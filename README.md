# PostgreSQL Natural Language Query API

This project provides a RESTful API service that allows users to query PostgreSQL databases using natural language. The system leverages AI to transform natural language requests into valid SQL queries.

## Features

- 🔍 Query PostgreSQL databases using natural language
- 🗄️ Create databases and tables via dedicated endpoints
- 👥 User management functionality (CRUD operations)
- 🧠 AI-powered natural language to SQL conversion via OpenRouter API
- 📊 Schema introspection for context-aware SQL generation

## Prerequisites

- Node.js (v14+)
- PostgreSQL server
- OpenRouter API key

## Installation

### Step 1: Clone the repository

```bash
git clone https://github.com/yourusername/postgres-nl-query-api.git
cd postgres-nl-query-api
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Set up environment variables

Create a `.env` file in the project root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your database credentials and API key:

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

### Step 4: Start the server

```bash
node index.js
```

The server will start on port 5000 (or the port specified in your `.env` file).

## Project Structure

```
├── index.js           # Main application entry point
├── db.js              # Database connection and operations
├── openrouter.js      # OpenRouter API integration
├── .env               # Environment variables (create from .env.example)
├── .env.example       # Environment variables template
└── README.md          # Project documentation
```

## API Endpoints

### Base URL

```
http://localhost:5000
```

### Basic Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | / | Check if the server is running |
| GET | /data | Fetch all users from the database |
| POST | /add-user | Add a new user to the database |

### Natural Language Query

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /natural-language | Execute a natural language query |

**Request Body:**
```json
{
  "command": "Show me all users older than 25"
}
```

**Response:**
```json
{
  "sql": "SELECT * FROM users WHERE age > 25;",
  "operationType": "read",
  "result": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "age": 30
    }
  ],
  "rowCount": 1
}
```

### Database Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /create-database | Create a new database with optional tables |
| POST | /extract-create-tables | Extract table creation statements from SQL |

**Request Body for /create-database:**
```json
{
  "dbName": "analysis",
  "tables": [
    "CREATE TABLE market (id SERIAL PRIMARY KEY, name VARCHAR(255), value NUMERIC);"
  ]
}
```

**Response:**
```json
{
  "message": "Database 'analysis' created successfully with specified tables"
}
```

## Usage Examples

### Creating a Database with Tables

```bash
curl -X POST http://localhost:5000/create-database \
  -H "Content-Type: application/json" \
  -d '{"dbName": "analytics", "tables": ["CREATE TABLE metrics (id SERIAL PRIMARY KEY, name VARCHAR(255), value NUMERIC);"]}'
```

### Querying with Natural Language

```bash
curl -X POST http://localhost:5000/natural-language \
  -H "Content-Type: application/json" \
  -d '{"command": "Find all users with gmail email addresses"}'
```

### Adding a New User

```bash
curl -X POST http://localhost:5000/add-user \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Smith", "email": "jane@example.com", "age": 28}'
```

## Implementation Notes

### Database Operations (db.js)

The `db.js` module handles all database-related operations:

- Creating database connections
- Executing SQL queries
- Retrieving schema information
- Creating databases and tables

### OpenRouter Integration (openrouter.js)

The `openrouter.js` module manages interactions with the OpenRouter API:

- Converting natural language to SQL
- Analyzing SQL query types
- Detecting unsupported operations (like CREATE DATABASE within transactions)

### Main Application (index.js)

The `index.js` file sets up the Express server and API routes:

- Configuring middleware
- Managing HTTP requests and responses
- Coordinating between the database and OpenRouter services

## Error Handling

The API provides detailed error messages to help diagnose issues:

- Database connection problems
- SQL execution errors
- Natural language processing failures
- Input validation errors

## Limitations

- CREATE DATABASE commands cannot be executed within transactions in PostgreSQL
- Complex joins or very specialized SQL features might need manual refinement
- Performance depends on the OpenRouter API response time

## License

MIT