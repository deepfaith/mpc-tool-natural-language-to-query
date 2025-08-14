# AI Data Query Assistant - Backend

This is the backend service for the AI-powered data query assistant that allows users to interact with Supabase databases using natural language queries. It leverages OpenAI to translate human language into SQL queries, execute them against Supabase PostgreSQL, and summarize the results.

## 🎯 Features

- **Natural Language to SQL**: Convert plain English questions into executable PostgreSQL queries
- **AI-Powered Summarization**: Get concise, human-readable summaries using OpenAI
- **Supabase Integration**: Direct connection to Supabase PostgreSQL databases
- **RPC Support**: Execute complex SQL queries via Supabase RPC functions
- **MCP Integration**: Exposes tools via Model Context Protocol for AI agents
- **Security**: Read-only queries with comprehensive SQL injection protection
- **Interactive Testing**: Multiple testing interfaces for development and debugging

## 🛠️ Technologies

- **Node.js** (ES modules)
- **@modelcontextprotocol/sdk** (MCP server)
- **@supabase/supabase-js** (Supabase client)
- **Knex.js** (PostgreSQL connection fallback)
- **Zod** (schema validation)
- **Axios** (HTTP client for AI APIs)
- **OpenAI** (AI provider)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file or set environment variables:

```bash
# Required: Supabase Configuration
export SUPABASE_URL="https://your-project-ref.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"

# Required: OpenAI Configuration
export OPENAI_API_KEY="your-openai-api-key"

# Optional: Direct PostgreSQL Connection
export SUPABASE_HOST="db.your-project-ref.supabase.co"
export SUPABASE_PASSWORD="your-database-password"
```

### 3. Database Setup

Create the required tables in your Supabase database:

```sql
-- Users table
CREATE TABLE public.users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  email VARCHAR NOT NULL UNIQUE,
  phone VARCHAR,
  city VARCHAR,
  country VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE public.products (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR,
  price NUMERIC NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  sku VARCHAR UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TYPE order_status AS ENUM ('pending', 'shipped', 'delivered', 'cancelled');

CREATE TABLE public.orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.users(id),
  order_number VARCHAR NOT NULL UNIQUE,
  total_amount NUMERIC NOT NULL,
  status order_status DEFAULT 'pending',
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shipping_address TEXT
);
```

### 4. Enable RPC Functions (Recommended)

For complex SQL queries, install RPC functions:

```bash
# Test and setup RPC automatically
npm run setup-rpc
```

Or manually:
1. Copy contents of `database/rpc-setup.sql`
2. Run in your Supabase SQL Editor
3. Test with `npm run setup-rpc`

### 5. Test Your Setup

```bash
# Test database connection
npm run test-db

# Test RPC functionality
npm run setup-rpc

# Test simple queries
npm run test-simple

# Interactive testing
npm run test-live
```

## 📊 Usage

### Available Scripts

```bash
# Development
npm run dev              # Start with nodemon
npm run start            # Start production server
npm run http             # Start with HTTP API for frontend testing
npm run dev-http         # Development with HTTP API

# Testing
npm run test-db          # Test database connection
npm run test-helpers     # Test database helpers
npm run test-simple      # Test simple query patterns
npm run test-live        # Interactive query testing
npm run test-mcp         # Interactive MCP tool testing
npm run setup-rpc        # Setup and test RPC functions
npm run test-semicolon   # Test semicolon handling
npm run debug-query      # Debug specific query issues

# Utilities
npm run interactive      # Interactive MCP testing
npm run setup-guide      # Show setup instructions
```

### MCP Server Usage

The server runs in stdio mode by default for AI agents:

```bash
# Start MCP server
npm run start

# Or with HTTP API for frontend testing
npm run dev-http
```

### Interactive Testing

```bash
# Start interactive query tester
npm run test-live
```

Example session:
```
🤖 Query> Show all users from California

🔍 Executing: "Show all users from California"
✅ Query executed successfully!
📊 Results (3 records):
   1. {"id": 1, "first_name": "John", "city": "California"}
   2. {"id": 5, "first_name": "Alice", "city": "California"}
🤖 Summary: Found 3 users located in California.
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Your Supabase anon/public key |
| `OPENAI_API_KEY` | Yes | Your OpenAI API key |
| `SUPABASE_HOST` | No | Direct database host for fallback |
| `SUPABASE_PASSWORD` | No | Direct database password |
| `PORT` | No | HTTP server port (default: 3001) |
| `HTTP_MODE` | No | Enable HTTP API (true/false) |

### Config File

Alternatively, update `config.json`:

```json
{
  "openaiApiKey": "YOUR_OPENAI_API_KEY",
  "supabaseUrl": "https://your-project-ref.supabase.co",
  "supabaseKey": "your-anon-key"
}
```

## 🔒 Security Features

- **Read-Only Queries**: Only SELECT statements allowed
- **Keyword Filtering**: Blocks dangerous SQL operations
- **Input Validation**: Comprehensive security checks
- **SQL Injection Protection**: Parameterized queries and validation
- **Multiple Statement Prevention**: Blocks multiple SQL statements
- **RPC Security**: Server-side validation in RPC functions

## 📈 Query Capabilities

### With RPC Functions (Recommended)

✅ Any SELECT query  
✅ Complex JOINs across multiple tables  
✅ Subqueries and CTEs (Common Table Expressions)  
✅ Window functions and advanced aggregations  
✅ Full PostgreSQL feature set  

Example complex queries:
```sql
-- Multi-table JOIN with aggregation
SELECT 
    u.city,
    COUNT(DISTINCT u.id) as users,
    COUNT(o.id) as orders,
    AVG(o.total_amount) as avg_order
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.city
ORDER BY orders DESC;

-- Subquery with ranking
SELECT 
    name, price, category,
    RANK() OVER (PARTITION BY category ORDER BY price DESC) as rank
FROM products
WHERE price > (SELECT AVG(price) FROM products);
```

### Without RPC Functions (Fallback)

✅ `SELECT * FROM table`  
✅ `SELECT columns FROM table`  
✅ `SELECT COUNT(*) FROM table`  
✅ Basic WHERE clauses  
✅ Simple GROUP BY  
❌ Complex JOINs  
❌ Subqueries  

## 🧪 Testing & Development

### Interactive Testing Commands

```bash
# Test specific functionality
npm run debug-query      # Debug query parsing
npm run test-semicolon   # Test semicolon handling
npm run test-simple      # Test basic patterns

# Interactive interfaces
npm run test-live        # Live query testing
npm run interactive      # MCP tool testing
```

### Example Test Queries

```bash
# Simple queries
"Show all users"
"Count total products"
"List recent orders"

# Filtered queries
"Show users from New York"
"Find products under $50"
"List pending orders"

# Complex queries (with RPC)
"Show users who have placed orders with their order count"
"Find the average order value by user city"
"List top selling products by category"
```

## 🚨 Troubleshooting

### Common Issues

**"Supabase client not available"**
- Check `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Verify credentials in Supabase dashboard
- Ensure project is not paused

**"Complex query not supported"**
- Install RPC functions: `npm run setup-rpc`
- Copy `database/rpc-setup.sql` to Supabase SQL Editor
- Verify functions exist with `SELECT test_rpc();`

**"Query execution failed: syntax error"**
- Check SQL syntax
- Ensure only SELECT statements
- Test with `npm run debug-query`

**"Table does not exist"**
- Create required tables (users, products, orders)
- Check table names are correct
- Verify tables are in `public` schema

### Debug Commands

```bash
npm run test-db          # Test database connection
npm run setup-rpc        # Test RPC setup
npm run debug-query      # Debug specific queries
npm run test-helpers     # Test database helpers
```

## 🔄 API Endpoints (HTTP Mode)

When running with `--http` flag:

```bash
# Health check
GET http://localhost:3001/health

# Execute natural language query
POST http://localhost:3001/api/mcp/query
{
  "nl_query": "Show all users from New York",
  "language": "English",
  "tone": "neutral"
}

# Get available tools
GET http://localhost:3001/api/mcp/tools
```

## 📁 Project Structure

```
src/
├── controllers/         # Request handlers
├── database/           # SQL setup files
│   ├── rpc-setup.sql  # RPC functions for complex queries
│   └── sample-data.sql # Sample data (if exists)
├── routes/             # API routes
├── utils/              # Utility functions
│   ├── aiHelpers.js   # OpenAI integration
│   ├── aiPrompts.js   # AI prompt templates
│   ├── dbHelpers.js   # Database operations
│   └── supabaseClient.js # Supabase client setup
├── test-*.js          # Testing scripts
├── config.json        # Configuration file
└── package.json       # Dependencies and scripts
```

## 🎯 Next Steps

1. **Set up your Supabase database** with the required tables
2. **Install RPC functions** for complex query support
3. **Test the setup** with `npm run setup-rpc`
4. **Try interactive testing** with `npm run test-live`
5. **Integrate with frontend** using HTTP mode
6. **Connect AI agents** via MCP protocol

For more help, run `npm run setup-rpc` for automated testing and setup guidance.
