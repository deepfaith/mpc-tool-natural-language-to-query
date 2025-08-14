import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;

/**
 * Initialize Supabase client
 */
export const initializeSupabaseClient = (config) => {
  const supabaseUrl = process.env.SUPABASE_URL || config.supabaseUrl;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || config.supabaseKey;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and Key are required. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables or update config.json');
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
    console.log('[Supabase Client] ✅ Supabase client initialized');
    return supabaseClient;
  } catch (error) {
    console.error('[Supabase Client] ❌ Failed to initialize:', error.message);
    throw error;
  }
};

/**
 * Initialize and validate Supabase connection for MCP server
 */
export const initializeSupabaseForMCP = async (config) => {
  console.log('[Supabase] Initializing Supabase connection...');

  // Initialize the client
  const client = initializeSupabaseClient(config);

  // Test the connection
  await testSupabaseConnection();

  // Validate schema
  await validateSupabaseSchema();

  console.log('[Supabase] ✅ Supabase fully initialized and validated');
  return client;
};

/**
 * Validate that expected tables exist in Supabase
 */
export const validateSupabaseSchema = async () => {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized');
  }

  const expectedTables = ['users', 'products', 'orders'];
  console.log('[Supabase] Validating database schema...');

  for (const tableName of expectedTables) {
    try {
      // Try to query the table to see if it exists
      const { data, error } = await supabaseClient
        .from(tableName)
        .select('count', { count: 'exact', head: true });

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.warn(`[Supabase] ⚠️ Table '${tableName}' not found in database`);
        } else {
          console.warn(`[Supabase] ⚠️ Could not access table '${tableName}':`, error.message);
        }
      } else {
        console.log(`[Supabase] ✅ Table '${tableName}' found and accessible`);
      }
    } catch (error) {
      console.warn(`[Supabase] ⚠️ Error checking table '${tableName}':`, error.message);
    }
  }
};

/**
 * Get the current Supabase client instance
 */
export const getSupabaseClient = () => {
  return supabaseClient;
};

/**
 * Test Supabase client connection
 */
export const testSupabaseConnection = async () => {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized');
  }

  try {
    // Test with a simple query
    const { data, error } = await supabaseClient
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    console.log('[Supabase Client] ✅ Connection test successful');
    return true;
  } catch (error) {
    console.error('[Supabase Client] ❌ Connection test failed:', error.message);
    throw error;
  }
};

/**
 * Execute a query using Supabase client (alternative to direct SQL)
 */
export const executeSupabaseQuery = async (tableName, options = {}) => {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized');
  }

  try {
    let query = supabaseClient.from(tableName);

    // Apply select
    if (options.select) {
      query = query.select(options.select);
    } else {
      query = query.select('*');
    }

    // Apply filters
    if (options.filters) {
      options.filters.forEach(filter => {
        const { column, operator, value } = filter;
        query = query.filter(column, operator, value);
      });
    }

    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy.column, { 
        ascending: options.orderBy.ascending !== false 
      });
    }

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('[Supabase Client] Query failed:', error.message);
    throw error;
  }
};

/**
 * Get table schema using Supabase (alternative method)
 */
export const getSupabaseSchema = async () => {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized');
  }

  try {
    // This is a simplified schema - for full schema we still use direct SQL
    const tables = ['users', 'products', 'orders'];
    const schema = {};

    for (const tableName of tables) {
      try {
        // Get a sample record to understand structure
        const { data, error } = await supabaseClient
          .from(tableName)
          .select('*')
          .limit(1);

        if (!error && data && data.length > 0) {
          schema[tableName] = {
            description: `Table: ${tableName}`,
            columns: Object.keys(data[0]).map(key => ({
              name: key,
              type: typeof data[0][key]
            }))
          };
        } else {
          schema[tableName] = {
            description: `Table: ${tableName} (empty or inaccessible)`,
            columns: []
          };
        }
      } catch (tableError) {
        console.warn(`[Supabase Client] Could not access table ${tableName}:`, tableError.message);
        schema[tableName] = {
          description: `Table: ${tableName} (error accessing)`,
          columns: []
        };
      }
    }

    return schema;
  } catch (error) {
    console.error('[Supabase Client] Schema retrieval failed:', error.message);
    throw error;
  }
};
