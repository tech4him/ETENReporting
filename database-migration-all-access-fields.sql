-- Migration to add All Access Goal and ETEN Funding fields to project allocations

-- Add All Access Goal and ETEN Funding fields to project_allocations table
ALTER TABLE project_allocations 
ADD COLUMN IF NOT EXISTS all_access_goal TEXT,
ADD COLUMN IF NOT EXISTS eligible_for_eten_funding BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS all_access_status TEXT,
ADD COLUMN IF NOT EXISTS language_population_group TEXT,
ADD COLUMN IF NOT EXISTS first_language_population BIGINT,
ADD COLUMN IF NOT EXISTS egids_level TEXT,
ADD COLUMN IF NOT EXISTS is_sign_language BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS luminations_region TEXT;

-- Add similar fields to language_expenditures table for backward compatibility
ALTER TABLE language_expenditures 
ADD COLUMN IF NOT EXISTS all_access_goal TEXT,
ADD COLUMN IF NOT EXISTS eligible_for_eten_funding BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS all_access_status TEXT,
ADD COLUMN IF NOT EXISTS language_population_group TEXT,
ADD COLUMN IF NOT EXISTS first_language_population BIGINT,
ADD COLUMN IF NOT EXISTS egids_level TEXT,
ADD COLUMN IF NOT EXISTS is_sign_language BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS luminations_region TEXT;

-- Create index for ETEN funding eligibility queries
CREATE INDEX IF NOT EXISTS idx_project_allocations_eten_eligible 
ON project_allocations(eligible_for_eten_funding) 
WHERE eligible_for_eten_funding = TRUE;

CREATE INDEX IF NOT EXISTS idx_language_expenditures_eten_eligible 
ON language_expenditures(eligible_for_eten_funding) 
WHERE eligible_for_eten_funding = TRUE;

-- Create view for ETEN eligible languages reporting
CREATE OR REPLACE VIEW eten_eligible_languages_report AS
SELECT 
    a.id as application_id,
    o.name as organization_name,
    a.title as application_title,
    a.funding_stream,
    pa.language_name,
    pa.ethnologue_code,
    pa.country,
    pa.all_access_goal,
    pa.eligible_for_eten_funding,
    pa.all_access_status,
    pa.amount_allocated,
    pa.reporting_period_start,
    pa.reporting_period_end
FROM project_allocations pa
JOIN applications a ON pa.application_id = a.id
JOIN organizations o ON a.organization_id = o.id
WHERE pa.eligible_for_eten_funding = TRUE

UNION ALL

SELECT 
    a.id as application_id,
    o.name as organization_name,
    a.title as application_title,
    a.funding_stream,
    le.language_name,
    le.ethnologue_code,
    le.country,
    le.all_access_goal,
    le.eligible_for_eten_funding,
    le.all_access_status,
    le.amount_spent as amount_allocated,
    le.reporting_period_start,
    le.reporting_period_end
FROM language_expenditures le
JOIN applications a ON le.application_id = a.id
JOIN organizations o ON a.organization_id = o.id
WHERE le.eligible_for_eten_funding = TRUE;

-- Create view for All Access Goals summary
CREATE OR REPLACE VIEW all_access_goals_summary AS
SELECT 
    all_access_goal,
    COUNT(*) as language_count,
    SUM(CASE WHEN eligible_for_eten_funding THEN 1 ELSE 0 END) as eten_eligible_count,
    SUM(amount_allocated) as total_allocated,
    SUM(CASE WHEN eligible_for_eten_funding THEN amount_allocated ELSE 0 END) as eten_allocated
FROM (
    SELECT all_access_goal, eligible_for_eten_funding, amount_allocated
    FROM project_allocations
    WHERE all_access_goal IS NOT NULL
    
    UNION ALL
    
    SELECT all_access_goal, eligible_for_eten_funding, amount_spent as amount_allocated
    FROM language_expenditures
    WHERE all_access_goal IS NOT NULL
) combined_data
GROUP BY all_access_goal
ORDER BY total_allocated DESC;

-- Add comments explaining the new fields
COMMENT ON COLUMN project_allocations.all_access_goal IS 'All Access Goal from SIL database (e.g., "Bible", "NT / 260 Chapters")';
COMMENT ON COLUMN project_allocations.eligible_for_eten_funding IS 'Whether this language is eligible for ETEN funding based on All Access criteria';
COMMENT ON COLUMN project_allocations.all_access_status IS 'All Access Status (e.g., "Translation in Progress", "Goal Met in the language")';
COMMENT ON COLUMN project_allocations.language_population_group IS 'Population group classification from All Access data';
COMMENT ON COLUMN project_allocations.first_language_population IS 'First language speaker count from All Access data';
COMMENT ON COLUMN project_allocations.egids_level IS 'EGIDS (Expanded Graded Intergenerational Disruption Scale) level';
COMMENT ON COLUMN project_allocations.is_sign_language IS 'Whether this is a sign language';
COMMENT ON COLUMN project_allocations.luminations_region IS 'IllumiNations region classification';

COMMENT ON VIEW eten_eligible_languages_report IS 'Report showing all languages eligible for ETEN funding with their allocations';
COMMENT ON VIEW all_access_goals_summary IS 'Summary of funding by All Access Goal categories';