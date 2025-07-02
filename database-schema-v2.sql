-- ETEN Mid-Year Reporting System - Corrected Schema
-- Based on actual ETEN data structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Call types/funding opportunities enum
CREATE TYPE call_type AS ENUM (
  'Translation Investment', 
  'Translation Tools', 
  'Capacity Building',
  'Tools',
  'Other'
);

-- User roles enum
CREATE TYPE user_role AS ENUM ('admin', 'staff', 'org_user');

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code TEXT UNIQUE,
    contact_email TEXT,
    client_rep_id UUID, -- References ETEN staff member
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Client Representatives (ETEN Staff)
CREATE TABLE client_reps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Organization Contacts (People who submitted proposals)
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- If they have system access
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role_title TEXT, -- Their role at the organization
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    client_rep_id UUID REFERENCES client_reps(id) ON DELETE SET NULL,
    role user_role NOT NULL DEFAULT 'org_user',
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Applications (Grant applications submitted by organizations)
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    call_type call_type NOT NULL,
    application_reference TEXT UNIQUE, -- External reference from import
    award_reference TEXT, -- Award reference number
    total_awarded DECIMAL(12, 2) DEFAULT 0,
    application_year INTEGER,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Activities (Milestones/deliverables for each application)
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    activity_reference TEXT, -- External reference from import
    description TEXT NOT NULL,
    planned_start_date DATE,
    planned_end_date DATE,
    budget_allocated DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Activity status tracking
CREATE TYPE activity_status AS ENUM ('Not Started', 'In Progress', 'Behind Schedule', 'On Track', 'Ahead of Schedule', 'Complete', 'Cancelled');

-- Activity progress updates (for mid-year reporting)
CREATE TABLE activity_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    reporting_period_start DATE NOT NULL,
    reporting_period_end DATE NOT NULL,
    status activity_status,
    progress_narrative TEXT,
    challenges TEXT,
    budget_spent DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(activity_id, reporting_period_start, reporting_period_end)
);

-- Financial data at application level
CREATE TABLE application_financials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    reporting_period_start DATE NOT NULL,
    reporting_period_end DATE NOT NULL,
    funds_received DECIMAL(12, 2) DEFAULT 0, -- What ETEN sent
    funds_spent DECIMAL(12, 2) DEFAULT 0, -- What org reports they spent
    funds_prior_year DECIMAL(12, 2) DEFAULT 0,
    financial_context TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(application_id, reporting_period_start, reporting_period_end)
);

-- Language expenditure tracking (for Translation call types)
CREATE TABLE language_expenditures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    reporting_period_start DATE NOT NULL,
    reporting_period_end DATE NOT NULL,
    ethnologue_code TEXT NOT NULL, -- Standard language code
    language_name TEXT NOT NULL,
    amount_spent DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(application_id, reporting_period_start, reporting_period_end, ethnologue_code)
);

-- Report status enum
CREATE TYPE report_status AS ENUM ('not_started', 'draft', 'submitted');

-- Mid-year reports (at application level)
CREATE TABLE application_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    reporting_period_start DATE NOT NULL,
    reporting_period_end DATE NOT NULL,
    progress_narrative TEXT, -- Overall application progress
    variance_narrative TEXT, -- What went differently than expected
    financial_summary_narrative TEXT, -- Financial context
    status report_status DEFAULT 'not_started',
    submitted_at TIMESTAMP WITH TIME ZONE,
    submitted_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(application_id, reporting_period_start, reporting_period_end)
);

-- Data import logs
CREATE TABLE import_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    imported_by UUID NOT NULL REFERENCES users(id),
    file_name TEXT NOT NULL,
    import_type TEXT NOT NULL, -- 'organizations', 'applications', 'activities', etc.
    records_processed INTEGER DEFAULT 0,
    records_imported INTEGER DEFAULT 0,
    errors TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add foreign key constraint after client_reps table is created
ALTER TABLE organizations ADD CONSTRAINT fk_organizations_client_rep 
    FOREIGN KEY (client_rep_id) REFERENCES client_reps(id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_reps_updated_at BEFORE UPDATE ON client_reps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_progress_updated_at BEFORE UPDATE ON activity_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_financials_updated_at BEFORE UPDATE ON application_financials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_reports_updated_at BEFORE UPDATE ON application_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_organizations_client_rep ON organizations(client_rep_id);
CREATE INDEX idx_contacts_organization ON contacts(organization_id);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_applications_organization_id ON applications(organization_id);
CREATE INDEX idx_activities_application_id ON activities(application_id);
CREATE INDEX idx_activity_progress_activity_id ON activity_progress(activity_id);
CREATE INDEX idx_application_financials_application_id ON application_financials(application_id);
CREATE INDEX idx_language_expenditures_application_id ON language_expenditures(application_id);
CREATE INDEX idx_application_reports_application_id ON application_reports(application_id);
CREATE INDEX idx_application_reports_status ON application_reports(status);