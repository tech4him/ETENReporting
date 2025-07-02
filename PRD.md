# ETEN Mid-Year Reporting System - Product Requirements Document

## Overview
A web-based reporting system for ETEN (Every Tribe Every Nation) partner organizations to submit mid-year progress reports on their Tools and Capacity Building projects.

## Core Features

### 1. Multi-Organization Authentication System
- **Email/Password Authentication** using Supabase Auth
- **Three User Roles:**
  - **Admin**: Full system access, can manage all organizations and users
  - **Staff**: Read-only access to all organizations' reports
  - **Organization User**: Can only access and edit their own organization's data

### 2. Organization Management
- Each organization has multiple projects
- Organizations are linked to their awarded proposals
- Organization users can only see and edit their own data

### 3. Project Reporting
- **Project Types**: Tools or Capacity Building
- **Reporting Period**: January 1 - June 30, 2025
- **Portal Timeline**: Opens July 1, closes July 31

### 4. Required Report Components

#### 4.1 Status Overview
- **Progress Narrative** (Required, max 1,500 chars)
  - "Describe progress made toward your goals?"
- **Variance Narrative** (Required, max 1,500 chars)  
  - "Did anything go differently than you expected? If so, has that changed the direction of your project moving forward?"

#### 4.2 Financial Update
- **ETEN Investment Received** (Jan 1 - Jun 30) - Pre-populated from import
- **Current Fiscal Year ETEN Funds Spent** (Required, user input)
- **Unused funds from last year** - Pre-populated from import
- **Additional financial context** (Optional)

#### 4.3 Milestone Updates
- Each project has multiple milestones with:
  - Description
  - Due date
  - Status (Behind Schedule, On Track, Ahead of Schedule, Complete)
  - Progress update narrative

### 5. Data Import System
- Import project and financial data from Excel/CSV templates
- Link imported data to organizations via reference fields
- Track import history and errors

### 6. Dashboard & Analytics
- **Organization View**: Shows all projects and their submission status
- **Staff/Admin View**: Overview of all organizations' submission status
- **Milestone Status Summary**: Visual breakdown of project progress

### 7. Report Management
- **Draft Saving**: Users can save incomplete reports
- **Validation**: Required fields must be completed before submission
- **Character Limits**: Real-time character counting for narrative fields
- **Submission Lock**: Reports cannot be edited after submission

## Technical Architecture

### Frontend
- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React hooks

### Backend & Database
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (via Supabase)
- **Row Level Security**: Organization-based access control
- **File Storage**: Supabase Storage (for imports)

### Database Schema
- `organizations`: Organization profiles
- `users`: User profiles linked to organizations
- `projects`: Project details linked to organizations
- `project_financials`: Financial data per project/period
- `milestones`: Project milestones and updates
- `reports`: Submitted reports with narratives
- `import_logs`: Data import history

## Implementation Phases

### Phase 1: Foundation ✓
- [x] Database schema design
- [ ] Supabase project setup
- [ ] Basic authentication flow

### Phase 2: User Management
- [ ] User registration/login pages
- [ ] Role-based access control
- [ ] Organization assignment

### Phase 3: Core Reporting
- [ ] Project listing by organization
- [ ] Report entry form
- [ ] Draft saving functionality
- [ ] Validation and submission

### Phase 4: Data Import
- [ ] Excel/CSV parser
- [ ] Import mapping interface
- [ ] Error handling and logging

### Phase 5: Dashboard & Analytics
- [ ] Organization dashboard
- [ ] Admin/Staff overview
- [ ] Export functionality

### Phase 6: Polish & Deploy
- [ ] Email notifications
- [ ] Help documentation
- [ ] Performance optimization
- [ ] Deployment setup

## Security Requirements
- All data transmission encrypted (HTTPS)
- Row-level security for organization isolation
- Session management with secure tokens
- Password requirements (min 8 chars, complexity)
- Audit trail for data changes

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Responsive Design
- Desktop (primary)
- Tablet (supported)
- Mobile (basic support)

## Future Enhancements
- Two-factor authentication
- Automated reminders before deadline
- Historical report comparison
- API for external integrations
- Bulk operations for admins