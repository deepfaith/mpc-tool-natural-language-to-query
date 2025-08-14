import knex from 'knex';
import { initializeSupabaseClient, getSupabaseClient } from './supabaseClient.js';

let dbInstance;
let dbType;

/**
 * Initialize database connection using Supabase client and direct PostgreSQL
 */
export const initializeDatabase = async (config) => {
  dbType = 'supabase';
  console.log(`[DB Helper] Initializing Supabase connection...`);

  try {
    // Initialize Supabase client first
    const supabaseClient = getSupabaseClient();

    if (!supabaseClient) {
      console.log(`[DB Helper] Initializing Supabase client...`);
      initializeSupabaseClient(config);
    }

    // Test the Supabase connection
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Failed to initialize Supabase client');
    }

    // Test with a simple query
    const { data, error } = await client
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "table not found" which is acceptable for testing
      console.warn(`[DB Helper] ⚠️ Supabase client test query warning:`, error.message);
    } else {
      console.log(`[DB Helper] ✅ Supabase client connection successful`);
    }

    // Test if custom RPC functions are available
    try {
      // Test the main execute_sql function
      const { data: testData, error: testError } = await client.rpc('execute_sql', { sql_query: 'SELECT 1 as test' });
      if (testError) throw testError;

      console.log(`[DB Helper] ✅ RPC function 'execute_sql' is available and working`);

      // Test the test_rpc function
      const { data: rpcTest, error: rpcTestError } = await client.rpc('test_rpc');
      if (!rpcTestError && rpcTest) {
        console.log(`[DB Helper] ✅ RPC test successful: ${rpcTest.message}`);
      }

    } catch (rpcError) {
      console.warn(`[DB Helper] ⚠️ RPC functions not available. Complex queries will use query parsing.`);
      console.warn(`[DB Helper] 💡 To enable RPC support:`);
      console.warn(`[DB Helper]    1. Copy the contents of 'backend/database/rpc-setup.sql'`);
      console.warn(`[DB Helper]    2. Paste and run it in your Supabase SQL Editor`);
      console.warn(`[DB Helper]    3. Restart the application`);
      console.warn(`[DB Helper] Error details:`, rpcError.message);
    }

    // Note: We're using Supabase client exclusively
    // Direct PostgreSQL connection is no longer needed

  } catch (error) {
    console.error(`[DB Helper] ❌ Failed to connect to Supabase:`, error.message);
    throw new Error(`Supabase connection failed: ${error.message}`);
  }
};

/**
 * Initialize direct PostgreSQL connection as fallback
 */
const initializeDirectConnection = async (config) => {
  console.log(`[DB Helper] Initializing direct PostgreSQL connection as fallback...`);

  const connectionConfig = {
    client: 'pg',
    connection: {
      host: process.env.SUPABASE_HOST || config.dataSources?.supabase?.connection?.host,
      user: 'postgres',
      password: process.env.SUPABASE_PASSWORD || config.dataSources?.supabase?.connection?.password,
      database: 'postgres',
      port: 5432,
      ssl: { rejectUnauthorized: false }
    }
  };

  if (connectionConfig.connection.host && connectionConfig.connection.password) {
    try {
      dbInstance = knex(connectionConfig);
      await dbInstance.raw('SELECT 1+1 AS result');
      console.log(`[DB Helper] ✅ Direct PostgreSQL connection available as fallback`);
    } catch (error) {
      console.warn(`[DB Helper] ⚠️ Direct PostgreSQL connection failed (continuing with Supabase client only):`, error.message);
      dbInstance = null;
    }
  } else {
    console.log(`[DB Helper] ℹ️ Direct PostgreSQL credentials not provided, using Supabase client only`);
  }
};

/**
 * Validate that expected tables exist in the database
 */
const validateSchema = async () => {
  const expectedTables = ['users', 'products', 'orders'];

  for (const tableName of expectedTables) {
    try {
      const exists = await dbInstance.schema.hasTable(tableName);
      if (!exists) {
        console.warn(`[DB Helper] ⚠️ Table '${tableName}' not found in database`);
      } else {
        console.log(`[DB Helper] ✅ Table '${tableName}' found`);
      }
    } catch (error) {
      console.warn(`[DB Helper] ⚠️ Could not check table '${tableName}':`, error.message);
    }
  }
};

/**
 * Fetch schema dynamically for the Supabase database.
 */
export const getDbSchema = async () => {
  // Check if we have any database connection available
  const supabaseClient = getSupabaseClient();

  if (!dbInstance && !supabaseClient) {
    throw new Error('No database connection available. Call initializeDatabase first.');
  }

  let schema = {};

  try {
    // Use Supabase client for all schema operations
    if (supabaseClient) {
      console.log('[DB Helper] Using Supabase client for schema retrieval...');

      // Try to use custom RPC function for schema
      try {
        const { data: schemaData, error: schemaError } = await supabaseClient.rpc('get_table_schema', { schema_name: 'public' });

        if (!schemaError && schemaData) {
          console.log('[DB Helper] Retrieved schema via custom RPC function');
          schemaData.forEach(table => {
            const tableDescriptions = {
              'users': 'Customer information including contact details and location',
              'products': 'Product catalog with pricing, inventory, and categorization',
              'orders': 'Customer orders with status tracking and shipping information'
            };

            schema[table.table_name] = {
              description: tableDescriptions[table.table_name] || `Table: ${table.table_name}`,
              columns: table.columns.map(col => ({
                name: col.column_name,
                type: col.data_type,
                nullable: col.is_nullable === 'YES',
                default: col.column_default,
                maxLength: null
              }))
            };
          });
        } else {
          throw new Error('RPC schema function not available');
        }
      } catch (rpcError) {
        console.log('[DB Helper] Custom RPC schema function not available, using fallback method...');

        // Fallback: Use Supabase client to get basic schema info
        const expectedTables = ['users', 'products', 'orders'];

        for (const tableName of expectedTables) {
          try {
            // Try to get a sample record to understand structure
            const { data, error } = await supabaseClient
              .from(tableName)
              .select('*')
              .limit(1);

            if (!error && data && data.length > 0) {
              schema[tableName] = {
                description: `Table: ${tableName}`,
                columns: Object.keys(data[0]).map(key => ({
                  name: key,
                  type: typeof data[0][key],
                  nullable: true,
                  default: null,
                  maxLength: null
                }))
              };
            } else {
              schema[tableName] = {
                description: `Table: ${tableName} (empty or inaccessible)`,
                columns: []
              };
            }
          } catch (tableError) {
            console.warn(`[DB Helper] Could not access table ${tableName}:`, tableError.message);
            schema[tableName] = {
              description: `Table: ${tableName} (error accessing)`,
              columns: []
            };
          }
        }
      }
    }

    console.log(`[DB Helper] ✅ Retrieved schema for ${Object.keys(schema).length} tables`);
    return schema;

  } catch (error) {
    console.error(`[DB Helper] ❌ Failed to retrieve schema:`, error.message);
    throw new Error(`Schema retrieval failed: ${error.message}`);
  }
};

/**
 * Executes an AI-generated query using Supabase client.
 */
export const executeDbQuery = async (generatedQuery) => {
  // Clean and validate the query
  let trimmedQuery = generatedQuery.trim ? generatedQuery.trim() : generatedQuery;

  // Remove multiple semicolons and trailing semicolons
  trimmedQuery = trimmedQuery.replace(/;+$/, '').trim();

  const lowerCaseQuery = trimmedQuery.toLowerCase();

  // Security checks
  if (!lowerCaseQuery.startsWith('select'))
    throw new Error('SQL handler only supports SELECT statements for read.');
  const forbidden = ['delete', 'update', 'insert', 'drop', 'alter', 'create', 'truncate'];
  if (forbidden.some(word => lowerCaseQuery.includes(word)))
    throw new Error('SQL contains forbidden keywords for security.');

  // Additional security: check for multiple statements
  if (trimmedQuery.includes(';') && trimmedQuery.split(';').filter(s => s.trim()).length > 1) {
    throw new Error('Multiple SQL statements are not allowed for security.');
  }

  // Check if we have Supabase client available
  const supabaseClient = getSupabaseClient();

  if (!supabaseClient) {
    throw new Error('Supabase client not available. Please check your Supabase configuration and call initializeDatabase first.');
  }

  // Execute all queries via Supabase client using RPC
  console.log('[DB Helper] Executing query via Supabase client...');
  return await executeViaSupabaseRPC(trimmedQuery, supabaseClient);
};



/**
 * Execute queries using Supabase RPC or query builder
 */
const executeViaSupabaseRPC = async (query, client) => {
  try {
    // Clean the query before sending to RPC
    const cleanedQuery = query.trim().replace(/;+$/, ''); // Remove trailing semicolons
    console.log('[DB Helper] Executing SQL query via Supabase RPC:', cleanedQuery.substring(0, 100) + (cleanedQuery.length > 100 ? '...' : ''));

    // Try using the execute_sql RPC function first
    try {
      console.log('[DB Helper] Attempting execution via RPC function...');
      const { data, error } = await client.rpc('execute_sql', { sql_query: cleanedQuery });

      if (error) {
        console.log('[DB Helper] RPC execution failed:', error.message);

        // Check if it's a "function not found" error
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.log('[DB Helper] RPC function not installed, falling back to query parsing...');
          throw new Error('RPC_NOT_AVAILABLE');
        }

        // Check if it's a syntax error that might be fixed by query parsing
        if (error.message.includes('syntax error')) {
          console.log('[DB Helper] RPC syntax error, trying query parsing fallback...');
          throw new Error('RPC_SYNTAX_ERROR');
        }

        // For other RPC errors, throw them directly
        throw error;
      }

      console.log('[DB Helper] ✅ Query executed successfully via RPC');
      console.log('[DB Helper] Result type:', typeof data, 'Length:', Array.isArray(data) ? data.length : 'N/A');

      // The RPC function returns JSON, so we should return it directly
      return Array.isArray(data) ? data : (data ? [data] : []);

    } catch (rpcError) {
      // If RPC is not available or has syntax issues, fall back to query parsing
      if (rpcError.message === 'RPC_NOT_AVAILABLE' ||
          rpcError.message === 'RPC_SYNTAX_ERROR' ||
          rpcError.message.includes('function') ||
          rpcError.message.includes('does not exist') ||
          rpcError.message.includes('syntax error')) {

        console.log('[DB Helper] RPC not available or syntax issue, falling back to query parsing...');
        return await parseAndExecuteQuery(query, client);
      }

      // For other errors, re-throw them
      throw rpcError;
    }

  } catch (error) {
    console.error('[DB Helper] Supabase query execution failed:', error.message);
    throw new Error(`Query execution failed: ${error.message}`);
  }
};

/**
 * Parse and execute SQL queries using Supabase query builder
 */
const parseAndExecuteQuery = async (query, client) => {
  const lowerQuery = query.toLowerCase().trim();
  console.log('[DB Helper] Parsing query:', lowerQuery);
  console.log('[DB Helper] Original query:', query);

  // Handle simple SELECT * FROM table queries (with optional semicolon)
  console.log('[DB Helper] Testing simple SELECT pattern...');
  const simpleSelectMatch = lowerQuery.match(/^select\s+\*\s+from\s+(\w+)(?:\s+limit\s+(\d+))?(?:\s*;)?$/);
  console.log('[DB Helper] Simple SELECT match result:', simpleSelectMatch);
  if (simpleSelectMatch) {
    const tableName = simpleSelectMatch[1];
    const limit = simpleSelectMatch[2] ? parseInt(simpleSelectMatch[2]) : undefined;

    console.log(`[DB Helper] Executing simple SELECT from ${tableName}`);
    let queryBuilder = client.from(tableName).select('*');
    if (limit) {
      queryBuilder = queryBuilder.limit(limit);
    }

    const { data, error } = await queryBuilder;
    if (error) throw error;
    return data || [];
  }

  // Handle simple COUNT queries (with optional semicolon)
  const countMatch = lowerQuery.match(/^select\s+count\(\*\)\s*(?:as\s+(\w+)\s+)?from\s+(\w+)(?:\s*;)?$/);
  if (countMatch) {
    const countAlias = countMatch[1] || 'count';
    const tableName = countMatch[2];

    console.log(`[DB Helper] Executing COUNT query on ${tableName}`);
    const { count, error } = await client
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return [{ [countAlias]: count }];
  }

  // Handle simple WHERE queries with string values (with optional semicolon)
  const whereStringMatch = lowerQuery.match(/^select\s+\*\s+from\s+(\w+)\s+where\s+(\w+)\s*=\s*'([^']+)'(?:\s+limit\s+(\d+))?(?:\s*;)?$/);
  if (whereStringMatch) {
    const tableName = whereStringMatch[1];
    const column = whereStringMatch[2];
    const value = whereStringMatch[3];
    const limit = whereStringMatch[4] ? parseInt(whereStringMatch[4]) : undefined;

    console.log(`[DB Helper] Executing WHERE query: ${tableName}.${column} = '${value}'`);
    let queryBuilder = client.from(tableName).select('*').eq(column, value);
    if (limit) {
      queryBuilder = queryBuilder.limit(limit);
    }

    const { data, error } = await queryBuilder;
    if (error) throw error;
    return data || [];
  }

  // Handle WHERE queries with numeric values (with optional semicolon)
  const whereNumMatch = lowerQuery.match(/^select\s+\*\s+from\s+(\w+)\s+where\s+(\w+)\s*=\s*(\d+)(?:\s+limit\s+(\d+))?(?:\s*;)?$/);
  if (whereNumMatch) {
    const tableName = whereNumMatch[1];
    const column = whereNumMatch[2];
    const value = parseInt(whereNumMatch[3]);
    const limit = whereNumMatch[4] ? parseInt(whereNumMatch[4]) : undefined;

    console.log(`[DB Helper] Executing WHERE query: ${tableName}.${column} = ${value}`);
    let queryBuilder = client.from(tableName).select('*').eq(column, value);
    if (limit) {
      queryBuilder = queryBuilder.limit(limit);
    }

    const { data, error } = await queryBuilder;
    if (error) throw error;
    return data || [];
  }

  // Handle SELECT specific columns (with optional semicolon)
  const selectColumnsMatch = lowerQuery.match(/^select\s+([^*][^from]+)\s+from\s+(\w+)(?:\s+limit\s+(\d+))?(?:\s*;)?$/);
  if (selectColumnsMatch) {
    const columns = selectColumnsMatch[1].trim();
    const tableName = selectColumnsMatch[2];
    const limit = selectColumnsMatch[3] ? parseInt(selectColumnsMatch[3]) : undefined;

    console.log(`[DB Helper] Executing SELECT ${columns} from ${tableName}`);
    let queryBuilder = client.from(tableName).select(columns);
    if (limit) {
      queryBuilder = queryBuilder.limit(limit);
    }

    const { data, error } = await queryBuilder;
    if (error) throw error;
    return data || [];
  }

  // Handle GROUP BY queries (basic)
  const groupByMatch = lowerQuery.match(/^select\s+(\w+),\s*count\(\*\)\s*(?:as\s+(\w+))?\s+from\s+(\w+)\s+group\s+by\s+(\w+)$/);
  if (groupByMatch) {
    const groupColumn = groupByMatch[1];
    const countAlias = groupByMatch[2] || 'count';
    const tableName = groupByMatch[3];
    const groupByColumn = groupByMatch[4];

    if (groupColumn === groupByColumn) {
      console.log(`[DB Helper] Executing GROUP BY query on ${tableName}`);

      // Get all records first, then group manually (Supabase limitation)
      const { data, error } = await client.from(tableName).select(groupColumn);
      if (error) throw error;

      // Group the results manually
      const grouped = {};
      data.forEach(row => {
        const key = row[groupColumn];
        grouped[key] = (grouped[key] || 0) + 1;
      });

      return Object.entries(grouped).map(([key, count]) => ({
        [groupColumn]: key,
        [countAlias]: count
      }));
    }
  }

  // Last resort: try a very basic SELECT * pattern
  console.log('[DB Helper] Trying fallback basic SELECT pattern...');
  const basicSelectMatch = lowerQuery.match(/select.*\*.*from\s+(\w+)/);
  if (basicSelectMatch) {
    const tableName = basicSelectMatch[1];
    console.log(`[DB Helper] Executing fallback SELECT from ${tableName}`);

    const { data, error } = await client.from(tableName).select('*');
    if (error) throw error;
    return data || [];
  }

  // If no pattern matches, throw an error with helpful information
  console.warn('[DB Helper] Query pattern not recognized, cannot execute via Supabase client');
  console.warn('[DB Helper] Supported patterns:');
  console.warn('  - SELECT * FROM table');
  console.warn('  - SELECT columns FROM table');
  console.warn('  - SELECT COUNT(*) FROM table');
  console.warn('  - SELECT * FROM table WHERE column = value');
  console.warn('  - SELECT column, COUNT(*) FROM table GROUP BY column');
  console.warn('[DB Helper] All patterns support optional LIMIT and semicolon');
  console.warn('[DB Helper] For complex queries, install the RPC function from backend/database/rpc-setup.sql');

  throw new Error(`Query pattern not supported via Supabase client. Query: "${query}". Install RPC function for complex queries or check query syntax.`);
};

/**
 * Returns the currently active DB type.
 */
export const getActiveDbType = () => dbType;

/**
 * Check if database is properly initialized
 */
export const isDatabaseInitialized = () => {
  const supabaseClient = getSupabaseClient();
  return dbInstance !== null || supabaseClient !== null;
};

/**
 * Get database connection status
 */
export const getDatabaseStatus = () => {
  const supabaseClient = getSupabaseClient();
  return {
    hasDirectConnection: dbInstance !== null,
    hasSupabaseClient: supabaseClient !== null,
    dbType: dbType,
    isInitialized: dbInstance !== null || supabaseClient !== null
  };
};

/**
 * Check if RPC functions are available
 */
export const checkRpcAvailability = async () => {
  const supabaseClient = getSupabaseClient();
  if (!supabaseClient) {
    return { available: false, error: 'Supabase client not available' };
  }

  try {
    // Test the main RPC function
    const { data, error } = await supabaseClient.rpc('test_rpc');

    if (error) {
      return {
        available: false,
        error: error.message,
        suggestion: 'Run the SQL in backend/supabase-setup.sql in your Supabase SQL Editor'
      };
    }

    return {
      available: true,
      message: data?.message || 'RPC functions are working',
      timestamp: data?.timestamp
    };

  } catch (error) {
    return {
      available: false,
      error: error.message,
      suggestion: 'Install RPC functions using backend/database/rpc-setup.sql'
    };
  }
};
