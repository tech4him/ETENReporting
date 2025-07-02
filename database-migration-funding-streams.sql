-- Migration to support ETEN Translation Project and illumiNations Undesignated funding streams
-- This migration adds support for detailed project allocations and non-project allocations

-- Add funding stream type to applications
ALTER TABLE applications ADD COLUMN IF NOT EXISTS funding_stream TEXT;

-- Update existing Translation Investment applications to use appropriate funding stream
UPDATE applications 
SET funding_stream = 'ETEN Translation Project' 
WHERE call_type = 'Translation Investment' AND funding_stream IS NULL;

-- Create table for detailed project allocations
CREATE TABLE IF NOT EXISTS project_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    reporting_period_start DATE NOT NULL,
    reporting_period_end DATE NOT NULL,
    language_name TEXT NOT NULL,
    ethnologue_code TEXT NOT NULL,
    country TEXT NOT NULL,
    dialect_rolv_number TEXT, -- Optional dialect/ROLV identifier
    amount_allocated DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(application_id, reporting_period_start, reporting_period_end, ethnologue_code, dialect_rolv_number)
);

-- Create table for partner organizations associated with project allocations
CREATE TABLE IF NOT EXISTS project_allocation_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_allocation_id UUID NOT NULL REFERENCES project_allocations(id) ON DELETE CASCADE,
    partner_organization_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(project_allocation_id, partner_organization_name)
);

-- Create table for non-project allocations (indirect costs, assessments, etc.)
CREATE TABLE IF NOT EXISTS non_project_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    reporting_period_start DATE NOT NULL,
    reporting_period_end DATE NOT NULL,
    allocation_type TEXT NOT NULL CHECK (allocation_type IN ('indirect_costs', 'assessments', 'unused_funds', 'other')),
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(application_id, reporting_period_start, reporting_period_end, allocation_type)
);

-- Add columns to application_financials for tracking totals
ALTER TABLE application_financials 
ADD COLUMN IF NOT EXISTS project_allocations_total DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS non_project_allocations_total DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS grand_total DECIMAL(12, 2) DEFAULT 0;

-- Add validation constraints
ALTER TABLE non_project_allocations 
ADD CONSTRAINT check_indirect_costs_percentage 
CHECK (
    allocation_type != 'indirect_costs' OR 
    amount <= (
        SELECT COALESCE(SUM(pa.amount_allocated), 0) * 0.20
        FROM project_allocations pa
        WHERE pa.application_id = non_project_allocations.application_id
        AND pa.reporting_period_start = non_project_allocations.reporting_period_start
        AND pa.reporting_period_end = non_project_allocations.reporting_period_end
    )
);

ALTER TABLE non_project_allocations 
ADD CONSTRAINT check_assessments_percentage 
CHECK (
    allocation_type != 'assessments' OR 
    amount <= (
        SELECT COALESCE(SUM(pa.amount_allocated), 0) * 0.15
        FROM project_allocations pa
        WHERE pa.application_id = non_project_allocations.application_id
        AND pa.reporting_period_start = non_project_allocations.reporting_period_start
        AND pa.reporting_period_end = non_project_allocations.reporting_period_end
    )
);

-- Create view for funding stream reports
CREATE OR REPLACE VIEW funding_stream_report AS
SELECT 
    a.id as application_id,
    o.name as organization_name,
    a.title as application_title,
    a.funding_stream,
    af.reporting_period_start,
    af.reporting_period_end,
    af.funds_received,
    af.funds_spent,
    af.funds_prior_year,
    COALESCE(pa_sum.total, 0) as project_allocations_total,
    COALESCE(npa_sum.total, 0) as non_project_allocations_total,
    COALESCE(pa_sum.total, 0) + COALESCE(npa_sum.total, 0) as grand_total
FROM applications a
JOIN organizations o ON a.organization_id = o.id
LEFT JOIN application_financials af ON a.id = af.application_id
LEFT JOIN (
    SELECT 
        application_id, 
        reporting_period_start, 
        reporting_period_end,
        SUM(amount_allocated) as total
    FROM project_allocations
    GROUP BY application_id, reporting_period_start, reporting_period_end
) pa_sum ON a.id = pa_sum.application_id 
    AND af.reporting_period_start = pa_sum.reporting_period_start
    AND af.reporting_period_end = pa_sum.reporting_period_end
LEFT JOIN (
    SELECT 
        application_id, 
        reporting_period_start, 
        reporting_period_end,
        SUM(amount) as total
    FROM non_project_allocations
    GROUP BY application_id, reporting_period_start, reporting_period_end
) npa_sum ON a.id = npa_sum.application_id 
    AND af.reporting_period_start = npa_sum.reporting_period_start
    AND af.reporting_period_end = npa_sum.reporting_period_end
WHERE a.funding_stream IN ('ETEN Translation Project', 'illumiNations Undesignated');

-- Add updated_at triggers for new tables
CREATE TRIGGER update_project_allocations_updated_at BEFORE UPDATE ON project_allocations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_non_project_allocations_updated_at BEFORE UPDATE ON non_project_allocations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_project_allocations_application_id ON project_allocations(application_id);
CREATE INDEX idx_project_allocations_reporting_period ON project_allocations(reporting_period_start, reporting_period_end);
CREATE INDEX idx_project_allocation_partners_allocation_id ON project_allocation_partners(project_allocation_id);
CREATE INDEX idx_non_project_allocations_application_id ON non_project_allocations(application_id);
CREATE INDEX idx_non_project_allocations_reporting_period ON non_project_allocations(reporting_period_start, reporting_period_end);
CREATE INDEX idx_applications_funding_stream ON applications(funding_stream);

-- Add comment to explain the schema changes
COMMENT ON TABLE project_allocations IS 'Tracks detailed project allocations for ETEN Translation Project and illumiNations Undesignated funding streams';
COMMENT ON TABLE project_allocation_partners IS 'Tracks partner organizations involved in specific project allocations';
COMMENT ON TABLE non_project_allocations IS 'Tracks non-project allocations like indirect costs (max 20%), assessments (max 15%), and unused funds';
COMMENT ON COLUMN applications.funding_stream IS 'Identifies the funding stream: ETEN Translation Project or illumiNations Undesignated';