# Supabase Setup Guide

This guide will help you set up a Supabase project and configure the database for the MySQL Search Application.

## Step 1: Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `mcp-sql-vue-app` (or any name you prefer)
   - **Database Password**: Choose a strong password
   - **Region**: Select the region closest to you
5. Click "Create new project"
6. Wait for the project to be created (this may take a few minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-ref.supabase.co`)
   - **anon public** key (the `anon` key under "Project API keys")

## Step 3: Configure Environment Variables

1. In your project, copy the environment template:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Edit `backend/.env` and add your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   PORT=3001
   NODE_ENV=development
   ```

## Step 4: Set Up the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the contents of `database/schema.sql` into the editor
4. Click "Run" to execute the SQL

This will create:
- `users` table with sample user data
- `products` table with sample product data
- `orders` table with sample order data
- Helper functions (`get_table_names`, `get_table_structure`) for the API
- Proper indexes for search performance
- PostgreSQL functions and triggers

**Important**: The helper functions are required for the application to work properly. They allow the backend to query table metadata through Supabase's RPC interface.

## Step 5: Verify the Setup

1. Go to **Table Editor** in your Supabase dashboard
2. You should see three tables: `users`, `products`, and `orders`
3. Each table should contain 10 sample records

## Step 6: Configure Row Level Security (Optional)

For production use, you should enable Row Level Security (RLS):

1. Go to **Authentication** > **Policies**
2. Enable RLS for each table
3. Create policies based on your security requirements

For this demo, RLS is disabled to allow public access to the data.

## Step 7: Test the Connection

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Test the health endpoint:
   ```bash
   curl http://localhost:3001/api/health
   ```

You should see a response indicating that Supabase is connected.

## Troubleshooting

### Connection Issues
- Verify your `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check that your Supabase project is active and not paused
- Ensure you're using the correct API key (anon, not service_role for client-side)

### Permission Issues
- Make sure RLS is disabled for demo purposes
- Check that the tables were created successfully
- Verify the anon key has the necessary permissions

### Schema Issues
- If tables already exist, you may need to drop them first
- Check the SQL Editor for any error messages
- Ensure all SQL commands executed successfully

## Next Steps

Once your Supabase database is set up:

1. Install dependencies: `npm run install-all`
2. Start the development servers: `npm run dev`
3. Open http://localhost:3000 to use the application

The application will now use PostgreSQL via Supabase instead of MySQL!
