-- Migration: Add Tool and Capacity Building specific fields
-- Date: 2025-01-07
-- Description: Adds fields specific to Tool and Capacity Building reporting

-- Create table for milestone tracking (specific to Tool/Capacity Building projects)
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    milestone_description TEXT NOT NULL,
    original_due_date DATE,
    milestone_order INTEGER NOT NULL DEFAULT 0,
    
    -- Progress tracking fields
    progress_update TEXT, -- What progress has been made toward the milestone?
    status milestone_status NOT NULL DEFAULT 'Not Started',
    completion_date DATE,
    variance_notes TEXT, -- How has that differed from your original plan?
    
    -- Financial tracking per milestone (optional)
    budgeted_amount DECIMAL(12, 2),
    actual_spent DECIMAL(12, 2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(application_id, milestone_order)
);

-- Create enum for milestone status if not exists
DO $$ BEGIN
    CREATE TYPE milestone_status AS ENUM (
        'Not Started',
        'Behind Schedule', 
        'On Track', 
        'Ahead of Schedule', 
        'Complete'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add Tool and Capacity Building specific fields to application_reports table
ALTER TABLE application_reports 
ADD COLUMN IF NOT EXISTS tool_capacity_progress_narrative TEXT,
ADD COLUMN IF NOT EXISTS tool_capacity_variance_narrative TEXT,
ADD COLUMN IF NOT EXISTS tool_capacity_financial_context TEXT;

-- Add constraints for character limits (1500 characters as per template)
ALTER TABLE application_reports 
ADD CONSTRAINT check_tool_capacity_progress_length 
CHECK (LENGTH(tool_capacity_progress_narrative) <= 1500);

ALTER TABLE application_reports 
ADD CONSTRAINT check_tool_capacity_variance_length 
CHECK (LENGTH(tool_capacity_variance_narrative) <= 1500);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_milestones_application_id 
ON project_milestones(application_id);

CREATE INDEX IF NOT EXISTS idx_project_milestones_status 
ON project_milestones(status);

-- Create view for Tool and Capacity Building reporting
CREATE OR REPLACE VIEW tool_capacity_report_summary AS
SELECT 
    r.id as report_id,
    r.application_id,
    a.title as project_name,
    a.call_type,
    r.tool_capacity_progress_narrative,
    r.tool_capacity_variance_narrative,
    r.tool_capacity_financial_context,
    
    -- Financial summary
    COALESCE(SUM(f.funds_received), 0) as funds_received_period,
    COALESCE(SUM(f.funds_spent), 0) as funds_spent_current,
    COALESCE(SUM(f.funds_prior_year), 0) as unused_funds_prior_year,
    
    -- Milestone summary
    COUNT(m.id) as total_milestones,
    COUNT(CASE WHEN m.status = 'Complete' THEN 1 END) as completed_milestones,
    COUNT(CASE WHEN m.status = 'Behind Schedule' THEN 1 END) as behind_schedule_milestones,
    COUNT(CASE WHEN m.status = 'On Track' THEN 1 END) as on_track_milestones,
    COUNT(CASE WHEN m.status = 'Ahead of Schedule' THEN 1 END) as ahead_schedule_milestones,
    
    r.status as report_status,
    r.submitted_at
FROM application_reports r
JOIN applications a ON r.application_id = a.id
LEFT JOIN financials f ON a.id = f.application_id
LEFT JOIN project_milestones m ON a.id = m.application_id
WHERE a.call_type IN ('Translation Tools', 'Capacity Building - Quality Assurance')
GROUP BY r.id, r.application_id, a.title, a.call_type, 
         r.tool_capacity_progress_narrative, r.tool_capacity_variance_narrative, 
         r.tool_capacity_financial_context, r.status, r.submitted_at;

-- Create function to initialize milestones from application activities
CREATE OR REPLACE FUNCTION initialize_project_milestones(app_id UUID)
RETURNS void AS $$
BEGIN
    -- Create milestones from existing activities for Tool/Capacity Building projects
    INSERT INTO project_milestones (
        application_id,
        milestone_description,
        original_due_date,
        milestone_order,
        budgeted_amount
    )
    SELECT 
        a.application_id,
        a.description,
        a.due_date::DATE,
        ROW_NUMBER() OVER (ORDER BY a.due_date, a.id),
        a.eten_invest_june_30
    FROM activities a
    JOIN applications app ON a.application_id = app.id
    WHERE a.application_id = app_id
      AND app.call_type IN ('Translation Tools', 'Capacity Building - Quality Assurance')
      AND NOT EXISTS (
          SELECT 1 FROM project_milestones pm 
          WHERE pm.application_id = app_id
      );
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON TABLE project_milestones IS 'Tracks milestones for Tool and Capacity Building projects';
COMMENT ON COLUMN project_milestones.progress_update IS 'What progress has been made toward the milestone? How has that differed from your original plan?';
COMMENT ON COLUMN project_milestones.status IS 'Milestone status: Behind Schedule/On Track/Ahead of Schedule/Complete';
COMMENT ON VIEW tool_capacity_report_summary IS 'Summary view for Tool and Capacity Building project reporting';