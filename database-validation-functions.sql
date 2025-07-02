-- Validation functions for funding stream reporting

-- Function to validate that total allocations match funds received
CREATE OR REPLACE FUNCTION validate_funding_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_project_total DECIMAL(12, 2);
    v_non_project_total DECIMAL(12, 2);
    v_grand_total DECIMAL(12, 2);
    v_funds_received DECIMAL(12, 2);
    v_tolerance DECIMAL(12, 2) := 0.01; -- Allow 1 cent tolerance for rounding
BEGIN
    -- Get the funds received for this application and period
    SELECT funds_received INTO v_funds_received
    FROM application_financials
    WHERE application_id = NEW.application_id
    AND reporting_period_start = NEW.reporting_period_start
    AND reporting_period_end = NEW.reporting_period_end;
    
    -- Skip validation if no funds received amount is set
    IF v_funds_received IS NULL OR v_funds_received = 0 THEN
        RETURN NEW;
    END IF;
    
    -- Calculate project allocations total
    SELECT COALESCE(SUM(amount_allocated), 0) INTO v_project_total
    FROM project_allocations
    WHERE application_id = NEW.application_id
    AND reporting_period_start = NEW.reporting_period_start
    AND reporting_period_end = NEW.reporting_period_end;
    
    -- Calculate non-project allocations total
    SELECT COALESCE(SUM(amount), 0) INTO v_non_project_total
    FROM non_project_allocations
    WHERE application_id = NEW.application_id
    AND reporting_period_start = NEW.reporting_period_start
    AND reporting_period_end = NEW.reporting_period_end;
    
    -- Calculate grand total
    v_grand_total := v_project_total + v_non_project_total;
    
    -- Update the totals in application_financials
    UPDATE application_financials
    SET project_allocations_total = v_project_total,
        non_project_allocations_total = v_non_project_total,
        grand_total = v_grand_total
    WHERE application_id = NEW.application_id
    AND reporting_period_start = NEW.reporting_period_start
    AND reporting_period_end = NEW.reporting_period_end;
    
    -- Validate that grand total matches funds received (with tolerance)
    IF ABS(v_grand_total - v_funds_received) > v_tolerance THEN
        RAISE WARNING 'Total allocations (%) do not match funds received (%) for application %', 
            v_grand_total, v_funds_received, NEW.application_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to validate totals when allocations change
CREATE TRIGGER validate_project_allocation_totals
AFTER INSERT OR UPDATE OR DELETE ON project_allocations
FOR EACH ROW EXECUTE FUNCTION validate_funding_totals();

CREATE TRIGGER validate_non_project_allocation_totals
AFTER INSERT OR UPDATE OR DELETE ON non_project_allocations
FOR EACH ROW EXECUTE FUNCTION validate_funding_totals();

-- Function to get allocation summary for an application
CREATE OR REPLACE FUNCTION get_allocation_summary(
    p_application_id UUID,
    p_reporting_period_start DATE,
    p_reporting_period_end DATE
)
RETURNS TABLE (
    project_count INTEGER,
    project_total DECIMAL(12, 2),
    indirect_costs DECIMAL(12, 2),
    assessments DECIMAL(12, 2),
    unused_funds DECIMAL(12, 2),
    other_allocations DECIMAL(12, 2),
    non_project_total DECIMAL(12, 2),
    grand_total DECIMAL(12, 2),
    funds_received DECIMAL(12, 2),
    variance DECIMAL(12, 2)
) AS $$
BEGIN
    RETURN QUERY
    WITH project_summary AS (
        SELECT 
            COUNT(*)::INTEGER as project_count,
            COALESCE(SUM(amount_allocated), 0) as project_total
        FROM project_allocations
        WHERE application_id = p_application_id
        AND reporting_period_start = p_reporting_period_start
        AND reporting_period_end = p_reporting_period_end
    ),
    non_project_summary AS (
        SELECT 
            COALESCE(SUM(CASE WHEN allocation_type = 'indirect_costs' THEN amount ELSE 0 END), 0) as indirect_costs,
            COALESCE(SUM(CASE WHEN allocation_type = 'assessments' THEN amount ELSE 0 END), 0) as assessments,
            COALESCE(SUM(CASE WHEN allocation_type = 'unused_funds' THEN amount ELSE 0 END), 0) as unused_funds,
            COALESCE(SUM(CASE WHEN allocation_type = 'other' THEN amount ELSE 0 END), 0) as other_allocations,
            COALESCE(SUM(amount), 0) as non_project_total
        FROM non_project_allocations
        WHERE application_id = p_application_id
        AND reporting_period_start = p_reporting_period_start
        AND reporting_period_end = p_reporting_period_end
    ),
    financial_summary AS (
        SELECT COALESCE(funds_received, 0) as funds_received
        FROM application_financials
        WHERE application_id = p_application_id
        AND reporting_period_start = p_reporting_period_start
        AND reporting_period_end = p_reporting_period_end
    )
    SELECT 
        ps.project_count,
        ps.project_total,
        nps.indirect_costs,
        nps.assessments,
        nps.unused_funds,
        nps.other_allocations,
        nps.non_project_total,
        ps.project_total + nps.non_project_total as grand_total,
        fs.funds_received,
        fs.funds_received - (ps.project_total + nps.non_project_total) as variance
    FROM project_summary ps
    CROSS JOIN non_project_summary nps
    CROSS JOIN financial_summary fs;
END;
$$ LANGUAGE plpgsql;

-- Function to validate percentage constraints
CREATE OR REPLACE FUNCTION validate_percentage_constraints(
    p_application_id UUID,
    p_reporting_period_start DATE,
    p_reporting_period_end DATE
)
RETURNS TABLE (
    constraint_type TEXT,
    amount DECIMAL(12, 2),
    max_allowed DECIMAL(12, 2),
    percentage DECIMAL(5, 2),
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH project_total AS (
        SELECT COALESCE(SUM(amount_allocated), 0) as total
        FROM project_allocations
        WHERE application_id = p_application_id
        AND reporting_period_start = p_reporting_period_start
        AND reporting_period_end = p_reporting_period_end
    ),
    allocations AS (
        SELECT 
            allocation_type,
            amount
        FROM non_project_allocations
        WHERE application_id = p_application_id
        AND reporting_period_start = p_reporting_period_start
        AND reporting_period_end = p_reporting_period_end
        AND allocation_type IN ('indirect_costs', 'assessments')
    )
    SELECT 
        a.allocation_type::TEXT as constraint_type,
        a.amount,
        CASE 
            WHEN a.allocation_type = 'indirect_costs' THEN pt.total * 0.20
            WHEN a.allocation_type = 'assessments' THEN pt.total * 0.15
        END as max_allowed,
        CASE 
            WHEN pt.total > 0 THEN ROUND((a.amount / pt.total) * 100, 2)
            ELSE 0
        END as percentage,
        CASE 
            WHEN a.allocation_type = 'indirect_costs' THEN a.amount <= pt.total * 0.20
            WHEN a.allocation_type = 'assessments' THEN a.amount <= pt.total * 0.15
        END as is_valid
    FROM allocations a
    CROSS JOIN project_total pt;
END;
$$ LANGUAGE plpgsql;