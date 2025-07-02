# Quick Test User Setup Guide

## Step 1: Create Auth User in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add user** → **Create new user**
4. Enter these details:
   - **Email**: `testuser@eten.org`
   - **Password**: `TestUser123!`
   - **Email confirm**: Check this box to auto-confirm
5. Click **Create user**
6. Copy the user's ID (it will look like: `550e8400-e29b-41d4-a716-446655440000`)

## Step 2: Run SQL to Set Up Test Data

After creating the auth user, run this SQL in the Supabase SQL editor:

```sql
-- Replace 'YOUR-AUTH-USER-ID' with the actual ID from Step 1
DO $$
DECLARE
    auth_user_id uuid := 'YOUR-AUTH-USER-ID'::uuid;
    test_org_id uuid := gen_random_uuid();
    app_id_1 uuid := gen_random_uuid();
    app_id_2 uuid := gen_random_uuid();
    app_id_3 uuid := gen_random_uuid();
    app_id_4 uuid := gen_random_uuid();
BEGIN
    -- Create test organization
    INSERT INTO eten_organizations (id, name, created_at, updated_at)
    VALUES (
        test_org_id,
        'Test Bible Translation Organization',
        NOW(),
        NOW()
    );

    -- Create user profile
    INSERT INTO eten_user_profiles (
        id,
        email,
        full_name,
        organization_id,
        role,
        created_at,
        updated_at
    ) VALUES (
        auth_user_id,
        'testuser@eten.org',
        'Test User',
        test_org_id,
        'user', -- Regular user, not admin
        NOW(),
        NOW()
    );

    -- Create test applications
    INSERT INTO eten_applications (
        id,
        organization_id,
        name,
        call_type,
        fund_year,
        stage_name,
        awarded_amount,
        created_at,
        updated_at
    ) VALUES 
        (app_id_1, test_org_id, 'Swahili Bible Translation Project', 'Translation Investment', 2025, 'Awarded', 250000.00, NOW(), NOW()),
        (app_id_2, test_org_id, 'Translation Memory Tool Development', 'Translation Tool', 2025, 'Awarded', 150000.00, NOW(), NOW()),
        (app_id_3, test_org_id, 'Quality Assurance Training Program', 'Capacity Building - Quality Assurance', 2025, 'Awarded', 100000.00, NOW(), NOW()),
        (app_id_4, test_org_id, 'Organizational Capacity Development', 'Organizational Development', 2025, 'Awarded', 75000.00, NOW(), NOW());

    -- Create financial records
    INSERT INTO application_financials (
        id,
        application_id,
        reporting_period_start,
        reporting_period_end,
        funds_received,
        funds_spent,
        funds_prior_year,
        created_at,
        updated_at
    ) VALUES
        (gen_random_uuid(), app_id_1, '2025-01-01', '2025-06-30', 125000.00, 0.00, 15000.00, NOW(), NOW()),
        (gen_random_uuid(), app_id_2, '2025-01-01', '2025-06-30', 75000.00, 0.00, 10000.00, NOW(), NOW()),
        (gen_random_uuid(), app_id_3, '2025-01-01', '2025-06-30', 50000.00, 0.00, 5000.00, NOW(), NOW()),
        (gen_random_uuid(), app_id_4, '2025-01-01', '2025-06-30', 37500.00, 0.00, 0.00, NOW(), NOW());

    -- Create activities
    INSERT INTO eten_activities (
        id,
        application_id,
        description,
        due_date,
        eten_invest_june_30,
        record_type,
        created_at,
        updated_at
    ) VALUES
        (gen_random_uuid(), app_id_1, 'Complete translation of Gospel of John', '2025-06-30', 50000.00, 'Activity', NOW(), NOW()),
        (gen_random_uuid(), app_id_1, 'Community review and testing sessions', '2025-06-30', 25000.00, 'Activity', NOW(), NOW()),
        (gen_random_uuid(), app_id_1, 'Publication and distribution preparation', '2025-06-30', 50000.00, 'Deliverable', NOW(), NOW()),
        (gen_random_uuid(), app_id_2, 'Develop core translation memory features', '2025-06-30', 40000.00, 'Activity', NOW(), NOW()),
        (gen_random_uuid(), app_id_2, 'Beta testing with 5 translation teams', '2025-06-30', 35000.00, 'Deliverable', NOW(), NOW());

    -- Create reports with different statuses
    INSERT INTO eten_application_reports (
        id,
        application_id,
        reporting_period_start,
        reporting_period_end,
        status,
        progress_narrative,
        variance_narrative,
        created_at,
        updated_at
    ) VALUES
        (gen_random_uuid(), app_id_1, '2025-01-01', '2025-06-30', 'draft', 
         'We have made significant progress on the Swahili translation...', 
         'Timeline remains on track with no major variances...', 
         NOW(), NOW()),
        (gen_random_uuid(), app_id_2, '2025-01-01', '2025-06-30', 'not_started', NULL, NULL, NOW(), NOW()),
        (gen_random_uuid(), app_id_3, '2025-01-01', '2025-06-30', 'submitted', 
         'Completed training for 15 quality assurance specialists...', 
         'We exceeded our target by training 3 additional specialists...', 
         NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
        (gen_random_uuid(), app_id_4, '2025-01-01', '2025-06-30', 'draft', 
         'Organizational assessment completed...', 
         'Identified additional capacity needs...', 
         NOW(), NOW());

    RAISE NOTICE 'Test user setup complete!';
END $$;
```

## Step 3: Log In as Test User

1. Go to your ETEN Reporting application
2. Log in with:
   - **Email**: `testuser@eten.org`
   - **Password**: `TestUser123!`

## What the Test User Will See:

### Dashboard View:
- **4 Applications** with different report statuses:
  - Swahili Bible Translation Project - **Draft** (in progress)
  - Translation Memory Tool - **Not Started**
  - Quality Assurance Training - **Submitted** (completed)
  - Organizational Development - **Draft** (in progress)

### User Permissions:
- ✅ Can view all applications for their organization
- ✅ Can create and edit draft reports
- ✅ Can submit reports when complete
- ❌ Cannot reopen submitted reports (admin only)
- ❌ Cannot see admin menu items
- ❌ Cannot access other organizations' data

### Features Available:
- Auto-save functionality on all draft reports
- Tab-based report interface
- Character counting on narrative fields
- Financial calculations and validations
- Language selector with SIL Ethnologue data
- Due date tracking (July 31, 2025)

## Testing Different Scenarios:

1. **Draft Report**: Click on "Swahili Bible Translation Project" to see a partially completed report
2. **New Report**: Click on "Translation Memory Tool" to start a fresh report
3. **Submitted Report**: Click on "Quality Assurance Training" to view a read-only submitted report
4. **Auto-Save**: Edit any field in a draft report and see the auto-save indicator

## To Create an Admin User:

Follow the same steps but in the SQL, change:
```sql
role: 'user'  -->  role: 'admin'
```

Admin users can:
- See all organizations' reports
- Reopen submitted reports
- Access admin menu items
- Manage users and system settings