-- Migration: Update call_type enum to match 2025 reporting requirements
-- Date: 2025-01-07
-- Description: Updates call_type enum to support the 4 specific call types for 2025 reporting

-- First, add the new call types to the enum
ALTER TYPE call_type ADD VALUE IF NOT EXISTS 'Capacity Building - Quality Assurance';
ALTER TYPE call_type ADD VALUE IF NOT EXISTS 'illumiNations Undesignated';

-- Update any existing records to use the new naming
-- Note: This assumes current data uses the old names
UPDATE applications 
SET call_type = 'Capacity Building - Quality Assurance' 
WHERE call_type = 'Capacity Building';

-- Note: Cannot remove old enum values in PostgreSQL without recreating the type
-- The old values ('Translation Tools', 'Tools', 'Other') will remain but are deprecated

-- Add comments to document the 4 active call types for 2025
COMMENT ON TYPE call_type IS '2025 Call Types: Translation Investment, illumiNations Undesignated, Translation Tools, Capacity Building - Quality Assurance';

-- Create a view to show only active call types for reporting
CREATE OR REPLACE VIEW active_call_types AS
SELECT unnest(ARRAY[
    'Translation Investment'::call_type,
    'illumiNations Undesignated'::call_type, 
    'Translation Tools'::call_type,
    'Capacity Building - Quality Assurance'::call_type
]) as call_type;

-- Add a constraint function to validate call types
CREATE OR REPLACE FUNCTION validate_active_call_type(ct call_type)
RETURNS boolean AS $$
BEGIN
    RETURN ct IN (
        'Translation Investment',
        'illumiNations Undesignated',
        'Translation Tools', 
        'Capacity Building - Quality Assurance'
    );
END;
$$ LANGUAGE plpgsql;

-- Add check constraint to applications table
ALTER TABLE applications 
ADD CONSTRAINT check_active_call_type 
CHECK (validate_active_call_type(call_type));

-- Create helper function to determine reporting template type
CREATE OR REPLACE FUNCTION get_reporting_template_type(ct call_type)
RETURNS text AS $$
BEGIN
    CASE ct
        WHEN 'Translation Investment', 'illumiNations Undesignated' THEN
            RETURN 'investment_reporting';
        WHEN 'Translation Tools', 'Capacity Building - Quality Assurance', 'Quality Assurance' THEN
            RETURN 'tool_capacity_reporting';
        ELSE
            RETURN 'unknown';
    END CASE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_reporting_template_type(call_type) IS 'Returns the reporting template type: investment_reporting or tool_capacity_reporting';