#!/bin/bash

# MySQL Database Setup Script
# This script sets up the test database with sample data

echo "Setting up MySQL database for MCP SQL Vue App..."

# Check if MySQL is installed and running
if ! command -v mysql &> /dev/null; then
    echo "Error: MySQL is not installed or not in PATH"
    echo "Please install MySQL first:"
    echo "  - Ubuntu/Debian: sudo apt-get install mysql-server"
    echo "  - macOS: brew install mysql"
    echo "  - Windows: Download from https://dev.mysql.com/downloads/mysql/"
    exit 1
fi

# Check if MySQL service is running
if ! pgrep -x "mysqld" > /dev/null; then
    echo "MySQL service is not running. Please start it:"
    echo "  - Ubuntu/Debian: sudo systemctl start mysql"
    echo "  - macOS: brew services start mysql"
    echo "  - Windows: Start MySQL service from Services panel"
    exit 1
fi

# Prompt for MySQL credentials
echo "Please enter your MySQL credentials:"
read -p "MySQL host (default: localhost): " MYSQL_HOST
MYSQL_HOST=${MYSQL_HOST:-localhost}

read -p "MySQL port (default: 3306): " MYSQL_PORT
MYSQL_PORT=${MYSQL_PORT:-3306}

read -p "MySQL username (default: root): " MYSQL_USER
MYSQL_USER=${MYSQL_USER:-root}

read -s -p "MySQL password: " MYSQL_PASS
echo

# Test MySQL connection
echo "Testing MySQL connection..."
mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASS" -e "SELECT 1;" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "Error: Could not connect to MySQL with provided credentials"
    exit 1
fi

echo "MySQL connection successful!"

# Execute the schema file
echo "Creating database and tables..."
mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASS" < schema.sql

if [ $? -eq 0 ]; then
    echo "Database setup completed successfully!"
    echo ""
    echo "Database: test_db"
    echo "Tables created:"
    echo "  - users (10 sample records)"
    echo "  - products (10 sample records)"
    echo "  - orders (10 sample records)"
    echo ""
    echo "You can now update your .env file with these credentials:"
    echo "MYSQL_HOST=$MYSQL_HOST"
    echo "MYSQL_PORT=$MYSQL_PORT"
    echo "MYSQL_USER=$MYSQL_USER"
    echo "MYSQL_PASS=$MYSQL_PASS"
    echo "MYSQL_DB=test_db"
else
    echo "Error: Database setup failed"
    exit 1
fi
