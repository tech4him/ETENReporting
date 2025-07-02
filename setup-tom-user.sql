-- First, let's find the organization with the most applications
WITH org_app_counts AS (
    SELECT 
        o.id,
        o.name,
        COUNT(a.id) as app_count
    FROM eten_organizations o
    LEFT JOIN eten_applications a ON o.id = a.organization_id
    GROUP BY o.id, o.name
    ORDER BY app_count DESC
    LIMIT 1
)
SELECT 
    'Organization with most applications: ' || name || ' (' || app_count || ' applications)' as info,
    id as org_id
FROM org_app_counts;

-- Now let's create the user
-- Note: You'll need to create the auth user in Supabase first with email: tom+aireport@missionmutual.org

DO $$
DECLARE
    target_org_id uuid;
    auth_user_id uuid := 'REPLACE_WITH_AUTH_USER_ID'::uuid; -- You'll need to replace this
BEGIN
    -- Get the organization with the most applications
    SELECT o.id INTO target_org_id
    FROM eten_organizations o
    LEFT JOIN eten_applications a ON o.id = a.organization_id
    GROUP BY o.id
    ORDER BY COUNT(a.id) DESC
    LIMIT 1;

    -- Create or update the user profile
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
        'tom+aireport@missionmutual.org',
        'Tom (AI Report Test)',
        target_org_id,
        'user', -- Regular user, not admin
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        organization_id = EXCLUDED.organization_id,
        role = EXCLUDED.role,
        updated_at = NOW();

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
        'not_started',
        NOW(),
        NOW()
    FROM eten_applications a
    WHERE a.organization_id = target_org_id
    ON CONFLICT (application_id, reporting_period_start, reporting_period_end) DO NOTHING;

    RAISE NOTICE 'User tom+aireport@missionmutual.org has been linked to organization ID: %', target_org_id;
END $$;

-- Show the result
SELECT 
    'User Setup Complete!' as status,
    o.name as organization_name,
    COUNT(DISTINCT a.id) as total_applications,
    COUNT(DISTINCT ar.id) as total_reports,
    SUM(CASE WHEN ar.status = 'not_started' THEN 1 ELSE 0 END) as not_started_reports,
    SUM(CASE WHEN ar.status = 'draft' THEN 1 ELSE 0 END) as draft_reports,
    SUM(CASE WHEN ar.status = 'submitted' THEN 1 ELSE 0 END) as submitted_reports
FROM eten_organizations o
JOIN eten_applications a ON o.id = a.organization_id
LEFT JOIN eten_application_reports ar ON a.id = ar.application_id 
    AND ar.reporting_period_start = '2025-01-01' 
    AND ar.reporting_period_end = '2025-06-30'
WHERE o.id = (
    SELECT o2.id
    FROM eten_organizations o2
    LEFT JOIN eten_applications a2 ON o2.id = a2.organization_id
    GROUP BY o2.id
    ORDER BY COUNT(a2.id) DESC
    LIMIT 1
)
GROUP BY o.id, o.name;