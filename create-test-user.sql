-- Create Test User for ETEN Reporting System
-- This script creates a test user with organization contact permissions

-- 1. First, create a test organization if it doesn't exist
INSERT INTO eten_organizations (id, name, created_at, updated_at)
VALUES (
    'test-org-123',
    'Test Bible Translation Organization',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();

-- 2. Create a client representative for the organization
INSERT INTO eten_client_reps (id, organization_id, full_name, email, created_at, updated_at)
VALUES (
    'test-rep-123',
    'test-org-123',
    'Sarah Johnson',
    'sarah.johnson@testorg.com',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = NOW();

-- 3. Create a Supabase auth user (you'll need to use Supabase Auth UI or API)
-- For now, we'll create the user profile that links to the auth user
-- The auth user ID would come from Supabase Auth after user creation

-- Note: You'll need to create the auth user through Supabase Dashboard or Auth API
-- Email: testuser@eten.org
-- Password: TestUser123!

-- 4. Create user profile (replace 'auth-user-id-here' with actual auth user ID)
INSERT INTO eten_user_profiles (
    id,
    email,
    full_name,
    organization_id,
    role,
    created_at,
    updated_at
) VALUES (
    'auth-user-id-here', -- Replace with actual auth user ID from Supabase
    'testuser@eten.org',
    'Test User',
    'test-org-123',
    'user', -- Regular user role, not admin
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    organization_id = EXCLUDED.organization_id,
    role = EXCLUDED.role,
    updated_at = NOW();

-- 5. Create some test applications for this organization
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
    (
        'test-app-001',
        'test-org-123',
        'Swahili Bible Translation Project',
        'Translation Investment',
        2025,
        'Awarded',
        250000.00,
        NOW(),
        NOW()
    ),
    (
        'test-app-002',
        'test-org-123',
        'Translation Memory Tool Development',
        'Translation Tool',
        2025,
        'Awarded',
        150000.00,
        NOW(),
        NOW()
    ),
    (
        'test-app-003',
        'test-org-123',
        'Quality Assurance Training Program',
        'Capacity Building - Quality Assurance',
        2025,
        'Awarded',
        100000.00,
        NOW(),
        NOW()
    ),
    (
        'test-app-004',
        'test-org-123',
        'Organizational Capacity Development',
        'Organizational Development',
        2025,
        'Awarded',
        75000.00,
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    awarded_amount = EXCLUDED.awarded_amount,
    updated_at = NOW();

-- 6. Create financial records for the applications
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
    (
        gen_random_uuid(),
        'test-app-001',
        '2025-01-01',
        '2025-06-30',
        125000.00,
        0.00,
        15000.00,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'test-app-002',
        '2025-01-01',
        '2025-06-30',
        75000.00,
        0.00,
        10000.00,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'test-app-003',
        '2025-01-01',
        '2025-06-30',
        50000.00,
        0.00,
        5000.00,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'test-app-004',
        '2025-01-01',
        '2025-06-30',
        37500.00,
        0.00,
        0.00,
        NOW(),
        NOW()
    )
ON CONFLICT (application_id, reporting_period_start, reporting_period_end) 
DO UPDATE SET
    funds_received = EXCLUDED.funds_received,
    funds_prior_year = EXCLUDED.funds_prior_year,
    updated_at = NOW();

-- 7. Create activities for the applications
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
    -- Translation Investment activities
    (
        gen_random_uuid(),
        'test-app-001',
        'Complete translation of Gospel of John',
        '2025-06-30',
        50000.00,
        'Activity',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'test-app-001',
        'Community review and testing sessions',
        '2025-06-30',
        25000.00,
        'Activity',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'test-app-001',
        'Publication and distribution preparation',
        '2025-06-30',
        50000.00,
        'Deliverable',
        NOW(),
        NOW()
    ),
    -- Translation Tool activities
    (
        gen_random_uuid(),
        'test-app-002',
        'Develop core translation memory features',
        '2025-06-30',
        40000.00,
        'Activity',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'test-app-002',
        'Beta testing with 5 translation teams',
        '2025-06-30',
        35000.00,
        'Deliverable',
        NOW(),
        NOW()
    )
ON CONFLICT DO NOTHING;

-- 8. Create reports in different statuses for testing
INSERT INTO eten_application_reports (
    id,
    application_id,
    reporting_period_start,
    reporting_period_end,
    status,
    created_at,
    updated_at
) VALUES
    (
        gen_random_uuid(),
        'test-app-001',
        '2025-01-01',
        '2025-06-30',
        'draft',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'test-app-002',
        '2025-01-01',
        '2025-06-30',
        'not_started',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        'test-app-003',
        '2025-01-01',
        '2025-06-30',
        'submitted',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '2 days'
    ),
    (
        gen_random_uuid(),
        'test-app-004',
        '2025-01-01',
        '2025-06-30',
        'draft',
        NOW(),
        NOW()
    )
ON CONFLICT (application_id, reporting_period_start, reporting_period_end) 
DO UPDATE SET
    status = EXCLUDED.status,
    updated_at = NOW();

-- Output instructions
SELECT '
=================================================================
TEST USER SETUP COMPLETE
=================================================================

Organization: Test Bible Translation Organization
Test Applications Created: 4
- Swahili Bible Translation Project (Translation Investment) - DRAFT
- Translation Memory Tool Development (Translation Tool) - NOT STARTED
- Quality Assurance Training Program (Capacity Building) - SUBMITTED
- Organizational Capacity Development (Organizational Development) - DRAFT

To use the test user:

1. Go to your Supabase Dashboard
2. Navigate to Authentication > Users
3. Click "Invite User" or "Create User"
4. Use these credentials:
   Email: testuser@eten.org
   Password: TestUser123!

5. After creating the auth user, get the user ID and run:
   UPDATE eten_user_profiles 
   SET id = ''<actual-auth-user-id>'' 
   WHERE email = ''testuser@eten.org'';

6. Log in to the ETEN Reporting app with:
   Email: testuser@eten.org
   Password: TestUser123!

The test user will see:
- 4 applications with different statuses
- Regular user permissions (not admin)
- Auto-save functionality on draft reports
- Cannot reopen submitted reports (admin only)

=================================================================
' as setup_instructions;