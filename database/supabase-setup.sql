-- Supabase RPC Setup SQL for AI Data Query Assistant
-- =====================================================
-- Run this ENTIRE file in your Supabase SQL Editor to enable RPC support
-- This allows the application to execute any SELECT query via RPC

-- 1. Create the main execute_sql function
-- This is the primary function that executes SQL queries safely
CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
    query_lower text;
    cleaned_query text;
    row_count integer;
BEGIN
    -- Input validation
    IF sql_query IS NULL OR trim(sql_query) = '' THEN
        RAISE EXCEPTION 'SQL query cannot be empty';
    END IF;

    -- Clean the query: remove trailing semicolons and extra whitespace
    cleaned_query := trim(sql_query);
    cleaned_query := regexp_replace(cleaned_query, ';+$', '');
    cleaned_query := trim(cleaned_query);

    -- Convert query to lowercase for security checks
    query_lower := lower(cleaned_query);

    -- Security checks: only allow SELECT statements
    IF NOT query_lower LIKE 'select%' THEN
        RAISE EXCEPTION 'Only SELECT statements are allowed. Received: %', left(sql_query, 50);
    END IF;

    -- Block dangerous keywords (comprehensive list)
    IF query_lower ~ '\b(delete|update|insert|drop|alter|create|truncate|grant|revoke|exec|execute|call|declare|set|use|show|describe|explain)\b' THEN
        RAISE EXCEPTION 'Query contains forbidden keywords: %', sql_query;
    END IF;

    -- Additional security: block semicolons followed by other statements
    IF query_lower ~ ';.*\w' THEN
        RAISE EXCEPTION 'Multiple statements not allowed';
    END IF;

    -- Execute the cleaned query and return results as JSON
    EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (%s) t', cleaned_query) INTO result;

    -- Return empty array if no results
    IF result IS NULL THEN
        result := '[]'::json;
    END IF;

    -- Log successful execution (optional - remove in production if needed)
    RAISE NOTICE 'Successfully executed query: %', left(cleaned_query, 100);

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error for debugging
        RAISE NOTICE 'Query execution failed: % - Query: %', SQLERRM, left(cleaned_query, 100);
        RAISE EXCEPTION 'Query execution failed: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION execute_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql(text) TO anon;

-- 2. Create a test function to verify RPC is working
CREATE OR REPLACE FUNCTION test_rpc()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN json_build_object(
        'status', 'success',
        'message', 'RPC functions are working correctly',
        'timestamp', now(),
        'version', '1.0'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION test_rpc() TO authenticated;
GRANT EXECUTE ON FUNCTION test_rpc() TO anon;

-- Create a simpler function for basic queries (alternative approach)
CREATE OR REPLACE FUNCTION query_data(
    table_name text,
    columns text DEFAULT '*',
    where_clause text DEFAULT '',
    order_clause text DEFAULT '',
    limit_count integer DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    query_text text;
BEGIN
    -- Build the query
    query_text := format('SELECT %s FROM %I', columns, table_name);

    -- Add WHERE clause if provided
    IF where_clause != '' THEN
        query_text := query_text || ' WHERE ' || where_clause;
    END IF;

    -- Add ORDER BY clause if provided
    IF order_clause != '' THEN
        query_text := query_text || ' ORDER BY ' || order_clause;
    END IF;

    -- Add LIMIT if provided
    IF limit_count IS NOT NULL THEN
        query_text := query_text || format(' LIMIT %s', limit_count);
    END IF;

    -- Execute the query and return results as JSON
    EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (%s) t', query_text) INTO result;

    -- Return empty array if no results
    IF result IS NULL THEN
        result := '[]'::json;
    END IF;

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Query execution failed: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION query_data(text, text, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION query_data(text, text, text, text, integer) TO anon;

-- Test the functions (optional - you can run these to verify)
-- SELECT execute_sql('SELECT COUNT(*) as count FROM users');
-- SELECT execute_sql('SELECT * FROM users LIMIT 3');
-- SELECT query_data('users', '*', '', 'created_at DESC', 5);

-- Create a function to get table schema information
CREATE OR REPLACE FUNCTION get_table_schema(schema_name text DEFAULT 'public')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_agg(
        json_build_object(
            'table_name', table_name,
            'columns', columns
        )
    )
    INTO result
    FROM (
        SELECT
            t.table_name,
            json_agg(
                json_build_object(
                    'column_name', c.column_name,
                    'data_type', c.data_type,
                    'is_nullable', c.is_nullable,
                    'column_default', c.column_default
                )
                ORDER BY c.ordinal_position
            ) as columns
        FROM information_schema.tables t
        JOIN information_schema.columns c ON t.table_name = c.table_name
        WHERE t.table_schema = schema_name
        AND t.table_type = 'BASE TABLE'
        AND c.table_schema = schema_name
        GROUP BY t.table_name
        ORDER BY t.table_name
    ) schema_info;

    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_table_schema(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_schema(text) TO anon;

-- Create indexes for better performance (optional)
-- These are examples - adjust based on your actual queries
-- CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
-- CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
-- CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
-- CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- 3. Create a function to get query statistics
CREATE OR REPLACE FUNCTION get_query_stats(table_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    table_exists boolean;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = get_query_stats.table_name
    ) INTO table_exists;

    IF NOT table_exists THEN
        RETURN json_build_object(
            'error', 'Table does not exist',
            'table_name', table_name
        );
    END IF;

    -- Get basic statistics
    EXECUTE format('
        SELECT json_build_object(
            ''table_name'', %L,
            ''total_rows'', COUNT(*),
            ''has_data'', COUNT(*) > 0
        ) FROM %I
    ', table_name, table_name) INTO result;

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'error', SQLERRM,
            'table_name', table_name
        );
END;
$$;

GRANT EXECUTE ON FUNCTION get_query_stats(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_query_stats(text) TO anon;

-- Add comments for documentation
COMMENT ON FUNCTION execute_sql(text) IS 'Safely execute SELECT SQL queries and return results as JSON';
COMMENT ON FUNCTION test_rpc() IS 'Test function to verify RPC functionality is working';
COMMENT ON FUNCTION get_query_stats(text) IS 'Get basic statistics for a table';
COMMENT ON FUNCTION query_data(text, text, text, text, integer) IS 'Execute parameterized queries on tables';
COMMENT ON FUNCTION get_table_schema(text) IS 'Get schema information for tables in the specified schema';

-- Create a view to show all available RPC functions
CREATE OR REPLACE VIEW available_rpc_functions AS
SELECT
    routine_name as function_name,
    routine_type as type,
    data_type as return_type,
    routine_definition as definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('execute_sql', 'test_rpc', 'get_query_stats', 'query_data', 'get_table_schema')
ORDER BY routine_name;

-- Grant access to the view
GRANT SELECT ON available_rpc_functions TO authenticated;
GRANT SELECT ON available_rpc_functions TO anon;

-- Final setup verification
DO $$
BEGIN
    RAISE NOTICE '=== Supabase RPC Setup Complete ===';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '  - execute_sql(text): Execute any SELECT query';
    RAISE NOTICE '  - test_rpc(): Test RPC functionality';
    RAISE NOTICE '  - get_query_stats(text): Get table statistics';
    RAISE NOTICE '  - query_data(...): Parameterized queries';
    RAISE NOTICE '  - get_table_schema(text): Get schema info';
    RAISE NOTICE '';
    RAISE NOTICE 'Test the setup by running:';
    RAISE NOTICE '  SELECT test_rpc();';
    RAISE NOTICE '  SELECT execute_sql(''SELECT 1 as test'');';
    RAISE NOTICE '';
    RAISE NOTICE 'Your AI Data Query Assistant can now use RPC for complex queries!';
END $$;
