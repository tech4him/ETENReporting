-- Import Additional ETEN Applications
-- Translation Investment, illumiNations Undesignated, and Capacity Building applications

-- First, let's ensure we have the right call types in our enum
-- Check current enum values and add missing ones if needed

-- Update call_type enum to include missing types
ALTER TYPE call_type ADD VALUE IF NOT EXISTS 'Translation Investment';
ALTER TYPE call_type ADD VALUE IF NOT EXISTS 'illumiNations Undesignated'; 
ALTER TYPE call_type ADD VALUE IF NOT EXISTS 'Capacity Building';

-- Translation Investment Applications (11 applications)
INSERT INTO eten_applications (id, salesforce_id, name, call_type, fund_year, stage_name, awarded_amount, organization_id) VALUES
-- Wycliffe USA
(uuid_generate_v4(), '006Uq00000BET5RIAX', '2025 Wycliffe USA - Translation', 'Translation Investment', 2025, 'Awarded', 2158842.00, (SELECT id FROM eten_organizations WHERE name = 'Wycliffe USA')),

-- Biblica  
(uuid_generate_v4(), '006Uq00000BATTqIAP', '2025 Biblica - Translation', 'Translation Investment', 2025, 'Awarded', 1454700.00, (SELECT id FROM eten_organizations WHERE name = 'Biblica')),

-- Deaf Bible Society (already have organization)
(uuid_generate_v4(), '006Uq00000BAXR0IAP', '2025 DBS - Translation', 'Translation Investment', 2025, 'Awarded', 340688.00, (SELECT id FROM eten_organizations WHERE name = 'Deaf Bible Society, Inc.')),

-- Lutheran Bible Translators (already have organization)
(uuid_generate_v4(), '006Uq00000BAZEJIA5', '2025 LBT - Translation', 'Translation Investment', 2025, 'Awarded', 305572.00, (SELECT id FROM eten_organizations WHERE name = 'Lutheran Bible Translators')),

-- Pioneer Bible Translators
(uuid_generate_v4(), '006Uq00000BAY26IAH', '2025 PBT - Translation', 'Translation Investment', 2025, 'Awarded', 177072.00, (SELECT id FROM eten_organizations WHERE name = 'Pioneer Bible Translators')),

-- SIL International (already have organization)  
(uuid_generate_v4(), '006Uq00000BAdMjIAL', '2025 SIL - Translation', 'Translation Investment', 2025, 'Awarded', 2237137.00, (SELECT id FROM eten_organizations WHERE name = 'SIL International')),

-- The Wycliffe Seed Company, Inc.
(uuid_generate_v4(), '006Uq00000BAWpuIAH', '2025 Seed Company - Translation', 'Translation Investment', 2025, 'Awarded', 3033940.00, (SELECT id FROM eten_organizations WHERE name = 'The Wycliffe Seed Company, Inc.')),

-- unfoldingWord (already have organization)
(uuid_generate_v4(), '006Uq00000BES1JIAX', '2025 unfoldingWord - Translation', 'Translation Investment', 2025, 'Awarded', 790625.00, (SELECT id FROM eten_organizations WHERE name = 'unfoldingWord')),

-- United Bible Societies
(uuid_generate_v4(), '006Uq00000BAbeJIAT', '2025 United Bible Societies - Translation', 'Translation Investment', 2025, 'Awarded', 1425908.00, (SELECT id FROM eten_organizations WHERE name = 'United Bible Societies')),

-- The Word for the World  
(uuid_generate_v4(), '006Uq00000BAZEKIA5', '2025 TWFTW - Translation', 'Translation Investment', 2025, 'Awarded', 1075516.00, (SELECT id FROM eten_organizations WHERE name = 'The Word for the World'));

-- Add the large multi-organization Translation Investment (OBT Table)
INSERT INTO eten_applications (id, salesforce_id, name, call_type, fund_year, stage_name, awarded_amount, organization_id) VALUES
(uuid_generate_v4(), '7012G0000012NYOQA2-MULTI', 'OBT Table Multi-Organization Translation Investment', 'Translation Investment', 2025, 'Awarded', 2000000.00, (SELECT id FROM eten_organizations WHERE name = 'Multiple Organizations' LIMIT 1));

-- illumiNations Undesignated Applications (10 applications)
INSERT INTO eten_applications (id, salesforce_id, name, call_type, fund_year, stage_name, awarded_amount, organization_id) VALUES
-- Wycliffe USA
(uuid_generate_v4(), '006Uq00000BEJNqIAP', 'WBT-US 2025 iN Undesignated Funding', 'illumiNations Undesignated', 2025, 'Awarded', 0.00, (SELECT id FROM eten_organizations WHERE name = 'Wycliffe USA')),

-- Biblica
(uuid_generate_v4(), '006Uq00000BAV7TIAX', '2025 Biblica - iN Undesignated Funding', 'illumiNations Undesignated', 2025, 'Awarded', 0.00, (SELECT id FROM eten_organizations WHERE name = 'Biblica')),

-- Deaf Bible Society
(uuid_generate_v4(), '006Uq00000BAb6PIAT', 'DBS 2025 iN Undesignated Funding', 'illumiNations Undesignated', 2025, 'Awarded', 0.00, (SELECT id FROM eten_organizations WHERE name = 'Deaf Bible Society, Inc.')),

-- Lutheran Bible Translators
(uuid_generate_v4(), '006Uq00000BASMXIA5', 'LBT 2025 iN Undesignated Funding', 'illumiNations Undesignated', 2025, 'Awarded', 0.00, (SELECT id FROM eten_organizations WHERE name = 'Lutheran Bible Translators')),

-- Pioneer Bible Translators
(uuid_generate_v4(), '006Uq00000BAWhrIAH', 'PBT 2025 iN Undesignated Funding', 'illumiNations Undesignated', 2025, 'Awarded', 0.00, (SELECT id FROM eten_organizations WHERE name = 'Pioneer Bible Translators')),

-- SIL International
(uuid_generate_v4(), '006Uq00000BAdGHIA1', 'SIL 2025 iN Undesignated Funding', 'illumiNations Undesignated', 2025, 'Awarded', 0.00, (SELECT id FROM eten_organizations WHERE name = 'SIL International')),

-- The Word for the World
(uuid_generate_v4(), '006Uq00000BASZPIA5', 'TWFTW 2025 iN Undesignated Funding', 'illumiNations Undesignated', 2025, 'Awarded', 0.00, (SELECT id FROM eten_organizations WHERE name = 'The Word for the World')),

-- The Wycliffe Seed Company
(uuid_generate_v4(), '006Uq00000BAPZvIAP', '2025 Seed Company - iN Undesignated Funding', 'illumiNations Undesignated', 2025, 'Awarded', 0.00, (SELECT id FROM eten_organizations WHERE name = 'The Wycliffe Seed Company, Inc.')),

-- unfoldingWord
(uuid_generate_v4(), '006Uq00000BEUuLIAX', 'unfoldingWord 2025 iN Undesignated Funding', 'illumiNations Undesignated', 2025, 'Awarded', 0.00, (SELECT id FROM eten_organizations WHERE name = 'unfoldingWord')),

-- United Bible Societies
(uuid_generate_v4(), '006Uq00000BAWzcIAH', 'UBS 2025 iN Undesignated Funding', 'illumiNations Undesignated', 2025, 'Awarded', 0.00, (SELECT id FROM eten_organizations WHERE name = 'United Bible Societies'));

-- Capacity Building Application
INSERT INTO eten_applications (id, salesforce_id, name, call_type, fund_year, stage_name, awarded_amount, organization_id) VALUES
(uuid_generate_v4(), '006Uq0000092EphIAE', 'illumiNations 12 Verse Challenge', 'Capacity Building', 2025, 'Awarded', 3500000.00, (SELECT id FROM eten_organizations WHERE name = 'Biblica'));

-- Add any missing organizations that might be referenced
INSERT INTO eten_organizations (id, name, client_rep_id) VALUES 
(uuid_generate_v4(), 'Wycliffe USA', (SELECT id FROM client_reps WHERE full_name = 'Blake Anderson' LIMIT 1)),
(uuid_generate_v4(), 'Biblica', (SELECT id FROM client_reps WHERE full_name = 'Baleigh Alverson' LIMIT 1)),
(uuid_generate_v4(), 'Pioneer Bible Translators', (SELECT id FROM client_reps WHERE full_name = 'Baleigh Alverson' LIMIT 1)),
(uuid_generate_v4(), 'The Wycliffe Seed Company, Inc.', (SELECT id FROM client_reps WHERE full_name = 'Blake Anderson' LIMIT 1)),
(uuid_generate_v4(), 'United Bible Societies', (SELECT id FROM client_reps WHERE full_name = 'Brett Stokes' LIMIT 1)),
(uuid_generate_v4(), 'The Word for the World', (SELECT id FROM client_reps WHERE full_name = 'Brett Stokes' LIMIT 1)),
(uuid_generate_v4(), 'Multiple Organizations', (SELECT id FROM client_reps WHERE full_name = 'Kyle Oliver' LIMIT 1))
ON CONFLICT (name) DO NOTHING;

-- Create financial records for the new applications (all in same reporting period)
INSERT INTO eten_application_financials (application_id, reporting_period_start, reporting_period_end, funds_received, funds_spent, funds_prior_year)
SELECT 
  id as application_id,
  '2025-01-01'::date as reporting_period_start,
  '2025-06-30'::date as reporting_period_end,
  CASE 
    WHEN awarded_amount > 0 THEN awarded_amount * 0.5  -- Assume 50% received by mid-year
    ELSE 0
  END as funds_received,
  CASE 
    WHEN awarded_amount > 0 THEN awarded_amount * 0.3  -- Assume 30% spent by mid-year
    ELSE 0
  END as funds_spent,
  0 as funds_prior_year
FROM eten_applications 
WHERE salesforce_id IN (
  '006Uq00000BET5RIAX', '006Uq00000BATTqIAP', '006Uq00000BAXR0IAP', '006Uq00000BAZEJIA5',
  '006Uq00000BAY26IAH', '006Uq00000BAdMjIAL', '006Uq00000BAWpuIAH', '006Uq00000BES1JIAX',
  '006Uq00000BAbeJIAT', '006Uq00000BAZEKIA5', '7012G0000012NYOQA2-MULTI', '006Uq0000092EphIAE',
  '006Uq00000BEJNqIAP', '006Uq00000BAV7TIAX', '006Uq00000BAb6PIAT', '006Uq00000BASMXIA5',
  '006Uq00000BAWhrIAH', '006Uq00000BAdGHIA1', '006Uq00000BASZPIA5', '006Uq00000BAPZvIAP',
  '006Uq00000BEUuLIAX', '006Uq00000BAWzcIAH'
);

-- Create some sample activities for Translation Investment applications
INSERT INTO eten_activities (application_id, description, due_date, eten_invest_june_30, record_type)
SELECT 
  id as application_id,
  'Translation Project Phase 1 - Community Engagement' as description,
  '2025-09-30'::date as due_date,
  awarded_amount * 0.4 as eten_invest_june_30,
  'Project Milestone' as record_type
FROM eten_applications 
WHERE call_type = 'Translation Investment' AND awarded_amount > 0;

INSERT INTO eten_activities (application_id, description, due_date, eten_invest_june_30, record_type)
SELECT 
  id as application_id,
  'Translation Project Phase 2 - Scripture Drafting' as description,
  '2025-12-31'::date as due_date,
  awarded_amount * 0.6 as eten_invest_june_30,
  'Project Milestone' as record_type
FROM eten_applications 
WHERE call_type = 'Translation Investment' AND awarded_amount > 0;

-- Add sample language expenditures for Translation Investment applications
INSERT INTO eten_language_expenditures (application_id, reporting_period_start, reporting_period_end, ethnologue_code, language_name, amount_spent)
SELECT 
  id as application_id,
  '2025-01-01'::date as reporting_period_start,
  '2025-06-30'::date as reporting_period_end,
  'varies' as ethnologue_code,
  'Multiple Target Languages' as language_name,
  awarded_amount * 0.25 as amount_spent
FROM eten_applications 
WHERE call_type = 'Translation Investment' AND awarded_amount > 50000;

COMMIT;