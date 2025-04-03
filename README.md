# Ansh & Riley Full-Stack Template

This is a full-stack template project for Software Composers to create  applications with AI.

## Getting started
To create a new project, you go to `/paths`, choose from our list of Paths, and then use Cursor's Composer feature to quickly scaffold your project!

You can also edit the Path's prompt template to be whatever you like!

## Technologies used
This doesn't really matter, but is useful for the AI to understand more about this project. We are using the following technologies
- React with Next.js 14 App Router
- TailwindCSS
- Firebase Auth, Storage, and Database
- Multiple AI endpoints including OpenAI, Anthropic, and Replicate using Vercel's AI SDK

## Supabase Configuration

This project uses Supabase for database and authentication. Follow these steps to set up your Supabase project:

1. Create a new project on [Supabase](https://supabase.com)
2. Get your project URL and anon key from the API settings
3. Add these to your `.env.local` file:

## Supabase Database Migration Guide

The application has been updated to use Supabase instead of Google Sheets for faster database operations. Here's how to set up and migrate:

### 1. Set Up Supabase

1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Get your Supabase URL and anon key from the project settings
4. Add these values to your `.env.local` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 2. Create Tables in Supabase

1. Go to the SQL Editor in your Supabase dashboard
2. Run the SQL commands in the `supabase-schema.sql` file
3. This will create all necessary tables with indexes and default data

### 3. Migrate Data from Google Sheets (Optional)

If you have existing data in Google Sheets, you can migrate it to Supabase:

1. Export your Google Sheet data as CSV
2. Import the CSV files into the appropriate Supabase tables using the Supabase dashboard's Table Editor

### 4. Testing the Migration

1. Make sure all API endpoints are working by:
   - Creating a new lead through the contact form
   - Checking the admin dashboard
   - Updating lead statuses

### Fallback to Google Sheets (If Needed)

The application still has the Google Sheets implementation in the codebase. If you need to revert:

1. Remove Supabase environment variables
2. Revert the API files to use Google Sheets (check version control history)

### Tables Created

The migration creates three tables in Supabase:

1. `sales` - Stores lead information (name, email, etc.)
2. `status_tracking` - Records status history for each lead
3. `status_workflow` - Defines allowed status transitions

## Preferred Date Migration Instructions

The `preferred_date` field in the Supabase sales table has been updated from `TEXT` to `TIMESTAMP WITH TIME ZONE` for improved date handling. Here's how to handle the migration:

### 1. Database Schema Changes

The schema change has already been made in `supabase-schema.sql`. If you're creating a new database, it will automatically use the correct format.

### 2. Updating Existing Data

If you have existing data with the old TEXT format, run the migration script:

1. Install required dependencies:
   ```
   npm install dotenv@latest
   ```

2. Add a Supabase service key to your .env.local file (optional but recommended):
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. Run the migration script:
   ```
   npx ts-node src/scripts/migrate-preferred-dates.ts
   ```

This script will:
- Convert YYYY-MM-DD format strings to proper ISO timestamps
- Attempt to parse other date formats
- Set unparseable dates to NULL

### 3. Code Changes

The following code has been updated to handle the new timestamp format:

1. **ContactForm.tsx**: Now converts the date input to an ISO timestamp before submission
2. **supabase.ts**: Updated formatting functions for both sending and receiving date data
3. **Lead interfaces**: Type definitions have been updated to reflect the date format changes

### 4. Troubleshooting

If you encounter any issues with the date format, check:
- The date being submitted from the contact form
- The format of dates in the Supabase database
- The display formatting in the admin dashboard