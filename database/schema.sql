-- PostgreSQL Database Schema for Search Application (Supabase)
-- Creates sample tables and data for the search application

-- Enable Row Level Security (RLS) - Supabase best practice
-- Note: For this demo, we'll disable RLS to allow public access
-- In production, you should configure proper RLS policies

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    city VARCHAR(50),
    country VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    sku VARCHAR(50) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order status type
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status order_status DEFAULT 'pending',
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    shipping_address TEXT
);

-- Insert sample data into users table
INSERT INTO users (first_name, last_name, email, phone, city, country) VALUES
('John', 'Doe', 'john.doe@email.com', '+1-555-0101', 'New York', 'USA'),
('Jane', 'Smith', 'jane.smith@email.com', '+1-555-0102', 'Los Angeles', 'USA'),
('Mike', 'Johnson', 'mike.johnson@email.com', '+1-555-0103', 'Chicago', 'USA'),
('Sarah', 'Williams', 'sarah.williams@email.com', '+1-555-0104', 'Houston', 'USA'),
('David', 'Brown', 'david.brown@email.com', '+1-555-0105', 'Phoenix', 'USA'),
('Lisa', 'Davis', 'lisa.davis@email.com', '+1-555-0106', 'Philadelphia', 'USA'),
('Tom', 'Wilson', 'tom.wilson@email.com', '+1-555-0107', 'San Antonio', 'USA'),
('Emma', 'Garcia', 'emma.garcia@email.com', '+1-555-0108', 'San Diego', 'USA'),
('James', 'Martinez', 'james.martinez@email.com', '+1-555-0109', 'Dallas', 'USA'),
('Anna', 'Anderson', 'anna.anderson@email.com', '+1-555-0110', 'San Jose', 'USA');

-- Insert sample data into products table
INSERT INTO products (name, description, category, price, stock_quantity, sku) VALUES
('Laptop Pro 15"', 'High-performance laptop with 16GB RAM and 512GB SSD', 'Electronics', 1299.99, 25, 'LAP-PRO-15'),
('Wireless Mouse', 'Ergonomic wireless mouse with precision tracking', 'Electronics', 29.99, 150, 'MSE-WRL-001'),
('Mechanical Keyboard', 'RGB backlit mechanical keyboard with blue switches', 'Electronics', 89.99, 75, 'KBD-MCH-RGB'),
('USB-C Hub', '7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader', 'Electronics', 49.99, 100, 'HUB-USC-7IN1'),
('Bluetooth Headphones', 'Noise-cancelling over-ear headphones with 30-hour battery', 'Electronics', 199.99, 50, 'HPH-BT-NC30'),
('Smartphone Case', 'Protective case for latest smartphone models', 'Accessories', 19.99, 200, 'CSE-SPH-PROT'),
('Portable Charger', '10000mAh portable battery pack with fast charging', 'Electronics', 39.99, 80, 'CHG-PORT-10K'),
('Webcam HD', '1080p HD webcam with auto-focus and built-in microphone', 'Electronics', 69.99, 60, 'CAM-HD-1080'),
('Monitor Stand', 'Adjustable monitor stand with storage compartment', 'Accessories', 34.99, 40, 'STD-MON-ADJ'),
('Cable Organizer', 'Desktop cable management system with multiple slots', 'Accessories', 14.99, 120, 'ORG-CBL-DESK');

-- Insert sample data into orders table
INSERT INTO orders (user_id, order_number, total_amount, status, shipping_address) VALUES
(1, 'ORD-2024-001', 1329.98, 'delivered', '123 Main St, New York, NY 10001'),
(2, 'ORD-2024-002', 89.99, 'shipped', '456 Oak Ave, Los Angeles, CA 90210'),
(3, 'ORD-2024-003', 249.97, 'processing', '789 Pine St, Chicago, IL 60601'),
(4, 'ORD-2024-004', 69.99, 'delivered', '321 Elm St, Houston, TX 77001'),
(5, 'ORD-2024-005', 159.98, 'pending', '654 Maple Dr, Phoenix, AZ 85001'),
(1, 'ORD-2024-006', 49.99, 'shipped', '123 Main St, New York, NY 10001'),
(6, 'ORD-2024-007', 34.99, 'delivered', '987 Cedar Ln, Philadelphia, PA 19101'),
(7, 'ORD-2024-008', 199.99, 'processing', '147 Birch Rd, San Antonio, TX 78201'),
(8, 'ORD-2024-009', 119.98, 'shipped', '258 Spruce St, San Diego, CA 92101'),
(9, 'ORD-2024-010', 14.99, 'delivered', '369 Willow Way, Dallas, TX 75201');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_users_name ON users(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);

-- Create text search indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_users_search ON users USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || email || ' ' || COALESCE(city, '') || ' ' || COALESCE(country, '')));
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(category, '') || ' ' || COALESCE(sku, '')));

-- Create helper functions for the Natural Language to SQL API

-- Function to get table names
CREATE OR REPLACE FUNCTION get_table_names()
RETURNS TABLE(table_name text) AS $$
BEGIN
  RETURN QUERY
  SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table structure
CREATE OR REPLACE FUNCTION get_table_structure(table_name text)
RETURNS TABLE(
  column_name text,
  data_type text,
  is_nullable text,
  column_default text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    c.column_default::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = $1
  ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute dynamic SQL (for advanced use cases)
-- Note: This is disabled by default for security. Enable only if needed.
-- CREATE OR REPLACE FUNCTION execute_sql(query text)
-- RETURNS TABLE(result jsonb) AS $$
-- BEGIN
--   -- This would require careful validation and is not recommended
--   -- for production use without proper security measures
--   RETURN QUERY EXECUTE 'SELECT to_jsonb(t) FROM (' || query || ') t';
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disable RLS for demo purposes (enable in production with proper policies)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Show tables and their row counts (for verification)
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'products' as table_name, COUNT(*) as row_count FROM products
UNION ALL
SELECT 'orders' as table_name, COUNT(*) as row_count FROM orders;
