# API Reference

This document provides detailed specifications for all endpoints available in the PostgreSQL Natural Language Query API.

## Base URL

All endpoints are relative to the base URL:

```
http://localhost:5000
```

## Authentication

This version of the API does not include authentication. It's recommended to implement authentication before deploying to production.

## Status Codes

The API uses standard HTTP status codes:

- `200 OK`: The request was successful
- `400 Bad Request`: The request was invalid or cannot be served
- `500 Internal Server Error`: An error occurred on the server

## Endpoints

### Status Check

```
GET /
```

Returns a message indicating the server is running.

#### Response

```
✅ MCP PostgreSQL Server is running...
```

### Get All Users

```
GET /data
```

Retrieves all users from the database.

#### Response

```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  },
  {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "age": 28
  }
]
```

### Add User

```
POST /add-user
```

Adds a new user to the database.

#### Request Body

| Field | Type | Description |
|-------|------|-------------|
| name | string | User's full name |
| email | string | User's email address (must be unique) |
| age | number | User's age |

```json
{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "age": 35
}
```

#### Response

```json
{
  "id": 3,
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "age": 35
}
```

#### Error Responses

```json
{
  "error": "All fields are required"
}
```

```json
{
  "error": "Email already exists"
}
```

### Natural Language Query

```
POST /natural-language
```

Converts a natural language command to SQL and executes it against the database.

#### Request Body

| Field | Type | Description |
|-------|------|-------------|
| command | string | Natural language query command |

```json
{
  "command": "Find users older than 30 and sort by name"
}
```

#### Response for READ Operations

```json
{
  "sql": "SELECT * FROM users WHERE age > 30 ORDER BY name;",
  "operationType": "read",
  "result": [
    {
      "id": 3,
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "age": 35
    }
  ],
  "rowCount": 1
}
```

#### Response for WRITE/DDL Operations

```json
{
  "sql": "CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(255), price NUMERIC);",
  "operationType": "ddl",
  "affectedRows": 0,
  "message": "Operation completed successfully. 0 rows affected."
}
```

#### Error Responses

```json
{
  "error": "Natural language command is required."
}
```

```json
{
  "error": "Could not execute the SQL query.",
  "details": "relation \"products\" already exists",
  "sql": "CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(255), price NUMERIC);"
}
```

```json
{
  "error": "CREATE DATABASE command detected",
  "details": "CREATE DATABASE cannot be executed through this endpoint. Please use the /create-database endpoint instead.",
  "sql": "CREATE DATABASE sales;",
  "suggestion": "Use POST /create-database with a JSON body containing {dbName: 'your_db_name'}"
}
```

### Create Database

```
POST /create-database
```

Creates a new PostgreSQL database with optional tables.

#### Request Body

| Field | Type | Description |
|-------|------|-------------|
| dbName | string | Name of the database to create |
| tables | array | (Optional) Array of SQL CREATE TABLE statements |

```json
{
  "dbName": "analytics",
  "tables": [
    "CREATE TABLE metrics (id SERIAL PRIMARY KEY, name VARCHAR(255), value NUMERIC);",
    "CREATE TABLE dimensions (id SERIAL PRIMARY KEY, name VARCHAR(255));"
  ]
}
```

#### Response

```json
{
  "message": "Database 'analytics' created successfully with specified tables"
}
```

#### Error Responses

```json
{
  "error": "Database name is required"
}
```

```json
{
  "error": "Database 'analytics' already exists"
}
```

```json
{
  "error": "Tables must be an array of SQL statements",
  "example": {
    "dbName": "example_db",
    "tables": ["CREATE TABLE table1 (id SERIAL PRIMARY KEY, name VARCHAR(255));"]
  }
}
```

```json
{
  "error": "Could not create database",
  "message": "Database 'analytics' created, but error creating tables",
  "details": "syntax error at or near \"c\""
}
```

### Extract Table Creation Statements

```
POST /extract-create-tables
```

Extracts database name and table creation statements from a complete SQL script.

#### Request Body

| Field | Type | Description |
|-------|------|-------------|
| sql | string | SQL script containing CREATE DATABASE and CREATE TABLE statements |

```json
{
  "sql": "CREATE DATABASE sales;\n\nCREATE TABLE customers (id SERIAL PRIMARY KEY, name VARCHAR(255));\nCREATE TABLE orders (id SERIAL PRIMARY KEY, customer_id INTEGER);"
}
```

#### Response

```json
{
  "dbName": "sales",
  "tables": [
    "CREATE TABLE customers (id SERIAL PRIMARY KEY, name VARCHAR(255));",
    "CREATE TABLE orders (id SERIAL PRIMARY KEY, customer_id INTEGER);"
  ],
  "message": "Found 2 table creation statements"
}
```

#### Error Responses

```json
{
  "error": "SQL statement is required"
}
```

```json
{
  "error": "No CREATE DATABASE statement found"
}
```

```json
{
  "error": "Could not extract database name"
}
```

## Data Types

### User Object

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Unique identifier (auto-generated) |
| name | string | User's full name |
| email | string | User's email address (unique) |
| age | integer | User's age |

## SQL Operation Types

The API classifies SQL operations into the following types:

| Type | Description | Examples |
|------|-------------|----------|
| read | Queries that retrieve data | SELECT |
| write | Queries that modify data | INSERT, UPDATE, DELETE |
| ddl | Data Definition Language operations | CREATE TABLE, ALTER TABLE, DROP TABLE |
| other | Other SQL operations | SET, BEGIN, COMMIT |

## Response Formats

Based on the operation type, the API formats responses differently:

### Read Operations

```json
{
  "sql": "SQL statement that was executed",
  "operationType": "read",
  "result": [
    {
      "column1": "value1",
      "column2": "value2"
    }
  ],
  "rowCount": 1
}
```

### Write Operations

```json
{
  "sql": "SQL statement that was executed",
  "operationType": "write",
  "affectedRows": 1,
  "message": "Operation completed successfully. 1 rows affected."
}
```

### DDL Operations

```json
{
  "sql": "SQL statement that was executed",
  "operationType": "ddl",
  "affectedRows": 0,
  "message": "Operation completed successfully. 0 rows affected."
}
```

## Rate Limiting

This API currently does not implement rate limiting. Consider adding rate limiting for production deployments.

## Versioning

This documentation applies to API v1. The API is currently unversioned in the URL path.