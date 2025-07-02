-- Complete setup for tom+aireport@missionmutual.org
-- This script will create the user and associate with the org with most applications

-- Step 1: Find organization with most applications and create everything in one go
DO $$
DECLARE
    target_org_id uuid;
    target_org_name text;
    app_count integer;
BEGIN
    -- Get the organization with the most applications
    SELECT 
        o.id, 
        o.name,
        COUNT(a.id)::integer
    INTO 
        target_org_id,
        target_org_name,
        app_count
    FROM eten_organizations o
    LEFT JOIN eten_applications a ON o.id = a.organization_id
    GROUP BY o.id, o.name
    ORDER BY COUNT(a.id) DESC
    LIMIT 1;

    RAISE NOTICE 'Found organization: % with % applications', target_org_name, app_count;

    -- Create reports for all applications if they don't exist
    INSERT INTO eten_application_reports (
        id,
        application_id,
        reporting_period_start,
        reporting_period_end,
        status,
        created_at,
        updated_at
    )
    SELECT 
        gen_random_uuid(),
        a.id,
        '2025-01-01',
        '2025-06-30',
        CASE 
            WHEN ROW_NUMBER() OVER (ORDER BY a.created_at) = 1 THEN 'submitted'
            WHEN ROW_NUMBER() OVER (ORDER BY a.created_at) = 2 THEN 'draft'
            ELSE 'not_started'
        END,
        NOW(),
        NOW()
    FROM eten_applications a
    WHERE a.organization_id = target_org_id
    ON CONFLICT (application_id, reporting_period_start, reporting_period_end) DO NOTHING;

    -- Output the organization ID for the next step
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'IMPORTANT: Next Steps';
    RAISE NOTICE '========================================';
    RAISE NOTICE '1. Go to Supabase Dashboard > Authentication > Users';
    RAISE NOTICE '2. Click "Invite user" or "Add user > Create new user"';
    RAISE NOTICE '3. Enter email: tom+aireport@missionmutual.org';
    RAISE NOTICE '4. Set a password (e.g., TomReport123!)';
    RAISE NOTICE '5. Check "Auto confirm email"';
    RAISE NOTICE '6. Copy the generated User ID';
    RAISE NOTICE '7. Run this SQL with the actual user ID:';
    RAISE NOTICE '';
    RAISE NOTICE 'INSERT INTO eten_user_profiles (id, email, full_name, organization_id, role, created_at, updated_at)';
    RAISE NOTICE 'VALUES (''<USER-ID-HERE>''::uuid, ''tom+aireport@missionmutual.org'', ''Tom (AI Report Test)'', ''%''::uuid, ''user'', NOW(), NOW());', target_org_id;
    RAISE NOTICE '';
    RAISE NOTICE 'Organization ID: %', target_org_id;
    RAISE NOTICE 'Organization Name: %', target_org_name;
    RAISE NOTICE '========================================';
END $$;

-- Show current state
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    COUNT(DISTINCT a.id) as total_applications,
    COUNT(DISTINCT ar.id) as reports_created,
    SUM(CASE WHEN ar.status = 'not_started' THEN 1 ELSE 0 END) as not_started,
    SUM(CASE WHEN ar.status = 'draft' THEN 1 ELSE 0 END) as drafts,
    SUM(CASE WHEN ar.status = 'submitted' THEN 1 ELSE 0 END) as submitted
FROM eten_organizations o
JOIN eten_applications a ON o.id = a.organization_id
LEFT JOIN eten_application_reports ar ON a.id = ar.application_id 
    AND ar.reporting_period_start = '2025-01-01' 
    AND ar.reporting_period_end = '2025-06-30'
GROUP BY o.id, o.name
ORDER BY COUNT(DISTINCT a.id) DESC
LIMIT 1;