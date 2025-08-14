-- Sample data for the AI Data Query Assistant
-- Run this in your Supabase SQL Editor after creating the tables

-- Insert sample users
INSERT INTO public.users (first_name, last_name, email, phone, city, country) VALUES
('John', 'Doe', 'john.doe@email.com', '+1-555-0101', 'New York', 'USA'),
('Jane', 'Smith', 'jane.smith@email.com', '+1-555-0102', 'Los Angeles', 'USA'),
('Bob', 'Johnson', 'bob.johnson@email.com', '+1-555-0103', 'Chicago', 'USA'),
('Alice', 'Williams', 'alice.williams@email.com', '+1-555-0104', 'Houston', 'USA'),
('Charlie', 'Brown', 'charlie.brown@email.com', '+1-555-0105', 'Phoenix', 'USA'),
('Diana', 'Davis', 'diana.davis@email.com', '+1-555-0106', 'Philadelphia', 'USA'),
('Eve', 'Miller', 'eve.miller@email.com', '+1-555-0107', 'San Antonio', 'USA'),
('Frank', 'Wilson', 'frank.wilson@email.com', '+1-555-0108', 'San Diego', 'USA'),
('Grace', 'Moore', 'grace.moore@email.com', '+1-555-0109', 'Dallas', 'USA'),
('Henry', 'Taylor', 'henry.taylor@email.com', '+1-555-0110', 'San Jose', 'USA'),
('Ivy', 'Anderson', 'ivy.anderson@email.com', '+1-555-0111', 'Austin', 'USA'),
('Jack', 'Thomas', 'jack.thomas@email.com', '+1-555-0112', 'Jacksonville', 'USA'),
('Kate', 'Jackson', 'kate.jackson@email.com', '+1-555-0113', 'Fort Worth', 'USA'),
('Liam', 'White', 'liam.white@email.com', '+1-555-0114', 'Columbus', 'USA'),
('Mia', 'Harris', 'mia.harris@email.com', '+1-555-0115', 'Charlotte', 'USA'),
('Noah', 'Martin', 'noah.martin@email.com', '+1-555-0116', 'San Francisco', 'USA'),
('Olivia', 'Garcia', 'olivia.garcia@email.com', '+1-555-0117', 'Indianapolis', 'USA'),
('Paul', 'Rodriguez', 'paul.rodriguez@email.com', '+1-555-0118', 'Seattle', 'USA'),
('Quinn', 'Lewis', 'quinn.lewis@email.com', '+1-555-0119', 'Denver', 'USA'),
('Ruby', 'Lee', 'ruby.lee@email.com', '+1-555-0120', 'Boston', 'USA');

-- Insert sample products
INSERT INTO public.products (name, description, category, price, stock_quantity, sku) VALUES
('Wireless Headphones', 'High-quality wireless headphones with noise cancellation', 'Electronics', 199.99, 50, 'WH-001'),
('Smartphone', 'Latest model smartphone with advanced camera', 'Electronics', 699.99, 30, 'SP-001'),
('Laptop', 'High-performance laptop for work and gaming', 'Electronics', 1299.99, 20, 'LP-001'),
('Coffee Maker', 'Automatic coffee maker with programmable timer', 'Appliances', 89.99, 25, 'CM-001'),
('Running Shoes', 'Comfortable running shoes for daily exercise', 'Sports', 129.99, 40, 'RS-001'),
('Backpack', 'Durable backpack for travel and daily use', 'Accessories', 59.99, 35, 'BP-001'),
('Tablet', '10-inch tablet with high-resolution display', 'Electronics', 399.99, 15, 'TB-001'),
('Desk Chair', 'Ergonomic office chair with lumbar support', 'Furniture', 249.99, 12, 'DC-001'),
('Water Bottle', 'Insulated water bottle keeps drinks cold/hot', 'Accessories', 24.99, 60, 'WB-001'),
('Bluetooth Speaker', 'Portable speaker with excellent sound quality', 'Electronics', 79.99, 45, 'BS-001'),
('Yoga Mat', 'Non-slip yoga mat for exercise and meditation', 'Sports', 39.99, 30, 'YM-001'),
('Kitchen Knife Set', 'Professional knife set for cooking', 'Kitchen', 149.99, 18, 'KS-001'),
('Monitor', '27-inch 4K monitor for work and entertainment', 'Electronics', 349.99, 22, 'MN-001'),
('Fitness Tracker', 'Smart fitness tracker with heart rate monitor', 'Electronics', 159.99, 28, 'FT-001'),
('Desk Lamp', 'LED desk lamp with adjustable brightness', 'Furniture', 69.99, 33, 'DL-001'),
('Wireless Mouse', 'Ergonomic wireless mouse for computers', 'Electronics', 49.99, 55, 'WM-001'),
('Cookbook', 'Collection of healthy recipes for home cooking', 'Books', 29.99, 40, 'CB-001'),
('Plant Pot', 'Ceramic plant pot for indoor gardening', 'Home & Garden', 19.99, 50, 'PP-001'),
('Phone Case', 'Protective case for smartphones', 'Accessories', 14.99, 80, 'PC-001'),
('Sunglasses', 'UV protection sunglasses with stylish design', 'Accessories', 89.99, 25, 'SG-001');

-- Insert sample orders
INSERT INTO public.orders (user_id, order_number, total_amount, status, shipping_address) VALUES
(1, 'ORD-2024-001', 199.99, 'delivered', '123 Main St, New York, NY 10001'),
(2, 'ORD-2024-002', 729.98, 'delivered', '456 Oak Ave, Los Angeles, CA 90210'),
(3, 'ORD-2024-003', 89.99, 'shipped', '789 Pine St, Chicago, IL 60601'),
(4, 'ORD-2024-004', 1299.99, 'delivered', '321 Elm St, Houston, TX 77001'),
(5, 'ORD-2024-005', 189.98, 'pending', '654 Maple Ave, Phoenix, AZ 85001'),
(1, 'ORD-2024-006', 349.99, 'shipped', '123 Main St, New York, NY 10001'),
(6, 'ORD-2024-007', 129.99, 'delivered', '987 Cedar St, Philadelphia, PA 19101'),
(7, 'ORD-2024-008', 399.99, 'delivered', '147 Birch Ave, San Antonio, TX 78201'),
(8, 'ORD-2024-009', 249.99, 'shipped', '258 Spruce St, San Diego, CA 92101'),
(2, 'ORD-2024-010', 104.98, 'delivered', '456 Oak Ave, Los Angeles, CA 90210'),
(9, 'ORD-2024-011', 79.99, 'pending', '369 Willow St, Dallas, TX 75201'),
(10, 'ORD-2024-012', 159.99, 'delivered', '741 Aspen Ave, San Jose, CA 95101'),
(11, 'ORD-2024-013', 69.99, 'shipped', '852 Poplar St, Austin, TX 78701'),
(3, 'ORD-2024-014', 179.98, 'delivered', '789 Pine St, Chicago, IL 60601'),
(12, 'ORD-2024-015', 49.99, 'pending', '963 Hickory Ave, Jacksonville, FL 32201'),
(13, 'ORD-2024-016', 29.99, 'delivered', '159 Walnut St, Fort Worth, TX 76101'),
(14, 'ORD-2024-017', 19.99, 'delivered', '357 Chestnut Ave, Columbus, OH 43201'),
(4, 'ORD-2024-018', 104.98, 'shipped', '321 Elm St, Houston, TX 77001'),
(15, 'ORD-2024-019', 89.99, 'delivered', '468 Sycamore St, Charlotte, NC 28201'),
(16, 'ORD-2024-020', 729.98, 'pending', '579 Magnolia Ave, San Francisco, CA 94101');

-- Display summary
SELECT 'Sample data inserted successfully!' as message;
SELECT 
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM products) as products_count,
  (SELECT COUNT(*) FROM orders) as orders_count;
