# ETEN Reporting System Setup Instructions

## Prerequisites
- Node.js 18.x or later
- npm or yarn
- Supabase account (free tier works)

## 1. Supabase Setup

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your Project URL and API Keys from the Settings > API page

### Database Setup
1. In your Supabase dashboard, go to SQL Editor
2. Run the SQL script from `database-schema.sql` to create all tables and policies
3. This will create the complete database structure with:
   - Organizations table
   - Users table (extends Supabase auth)
   - Projects table
   - Reports table
   - Milestones table
   - Financial data table
   - Row Level Security policies

### Authentication Setup
1. In Supabase dashboard, go to Authentication > Settings
2. Ensure "Enable email confirmations" is disabled for development (or configure SMTP)
3. Set your site URL to `http://localhost:3000` for development

## 2. Local Development Setup

### Clone and Install
```bash
cd /path/to/project
npm install
```

### Environment Variables
1. Copy `.env.local.example` to `.env.local`
2. Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run Development Server
```bash
npm run dev
```

## 3. Initial Data Setup

### Create First Admin User
1. Go to `/signup` and create your first user account
2. In Supabase dashboard, go to Authentication > Users
3. Copy the user ID
4. In SQL Editor, run:
```sql
UPDATE users SET role = 'admin' WHERE id = 'your-user-id';
```

### Create Organizations
In SQL Editor, create some organizations:
```sql
INSERT INTO organizations (name, code, contact_email) VALUES 
('United Bible Societies', 'UBS', 'contact@ubs.org'),
('Deaf Bible Society', 'DBS', 'contact@deafbible.org'),
('Wycliffe Bible Translators', 'WBT', 'contact@wycliffe.org');
```

### Assign Users to Organizations
```sql
UPDATE users SET organization_id = (
  SELECT id FROM organizations WHERE code = 'UBS'
) WHERE id = 'your-user-id';
```

## 4. Testing the System

### User Roles
- **Admin**: Can manage all organizations and users
- **Staff**: Can view all reports (read-only across organizations)  
- **Organization User**: Can only see and edit their org's data

### Test Authentication
1. Visit `http://localhost:3000`
2. You should be redirected to `/login`
3. Sign in with your credentials
4. You should see the main dashboard

### Test Role-Based Access
1. Create multiple users with different roles
2. Assign them to different organizations
3. Test that users can only see appropriate data

## 5. Production Deployment

### Environment Setup
1. Set production environment variables
2. Update Supabase site URL to your production domain
3. Enable email confirmations if needed

### Database Migration
1. Run the database schema in your production Supabase instance
2. Import initial organization data
3. Test the authentication flow

## 6. Data Import (Coming Soon)

The system is designed to import project and financial data from Excel templates:
- `Mid Year Investment Reporting 2025 Template.xlsx`
- `2025 Mid Year Tool and Capacity Building reporting template.docx`

Import functionality will be built in the next phase.

## 7. Troubleshooting

### Common Issues

**"Invalid API key" error:**
- Check your `.env.local` file
- Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are correct

**Database connection errors:**
- Verify your Supabase project is active
- Check the database schema was created correctly

**Authentication not working:**
- Ensure site URL is configured in Supabase
- Check middleware configuration

**RLS policies blocking access:**
- Verify user has correct role assigned
- Check organization assignment

### Getting Help
- Check the Supabase logs in your dashboard
- Review browser console for client-side errors
- Ensure all environment variables are set correctly

## Current Status

✅ **Completed:**
- Multi-organization authentication system
- Role-based access control (Admin, Staff, Org User)
- Database schema with Row Level Security
- Basic dashboard interface
- Login/signup flows

🔄 **In Progress:**
- Full reporting interface
- Data import functionality
- Advanced admin features

📋 **Coming Next:**
- Project management interface
- Report submission forms
- Financial data import
- Dashboard analytics
- Email notifications