# Tom User Setup - Complete Instructions

## ✅ Data Already Prepared
I've already set up the data for unfoldingWord (the organization with the most applications):

**Organization**: unfoldingWord  
**Applications**: 4 total
- 2025 - Open Components Ecosystem (Translation Tool) - **Not Started**
- 2025 - Global Church-Centric Bible Translation Forum (Quality Assurance) - **Draft**  
- 2025 unfoldingWord - Translation (Translation Investment) - **Draft**
- unfoldingWord 2025 iN Undesignated Funding (illumiNations Undesignated) - **Submitted**

**Financial data**: Created for all applications
**Reports**: Created with mixed statuses for realistic testing

---

## 🔐 Step 1: Create Auth User (Manual)

**You need to do this step manually in Supabase Dashboard:**

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**  
3. Click **"Add user"** → **"Create new user"**
4. Enter:
   - **Email**: `tom+aireport@missionmutual.org`
   - **Password**: `TomReport123!` (or your choice)
   - ✅ Check **"Auto confirm email"**
5. Click **"Create user"**
6. **Copy the User ID** (looks like: `550e8400-e29b-41d4-a716-446655440000`)

---

## 🔗 Step 2: Link User to Organization (Automatic)

**Run this SQL in Supabase SQL Editor** (replace `YOUR_AUTH_USER_ID` with the actual ID from Step 1):

```sql
-- Link tom+aireport@missionmutual.org to unfoldingWord
INSERT INTO users (
    id,
    organization_id,
    role,
    full_name,
    created_at,
    updated_at
) VALUES (
    'YOUR_AUTH_USER_ID'::uuid, -- Replace with actual auth user ID
    '021c6409-1a1b-44b9-81a5-4cca7f0ee033'::uuid, -- unfoldingWord org ID
    'org_user', -- Regular organization user role
    'Tom (AI Report Test)',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- Verify the setup
SELECT 
    u.full_name as user_name,
    u.role,
    o.name as organization_name,
    COUNT(DISTINCT a.id) as total_applications,
    COUNT(DISTINCT ar.id) as total_reports,
    SUM(CASE WHEN ar.status = 'not_started' THEN 1 ELSE 0 END) as not_started_reports,
    SUM(CASE WHEN ar.status = 'draft' THEN 1 ELSE 0 END) as draft_reports,
    SUM(CASE WHEN ar.status = 'submitted' THEN 1 ELSE 0 END) as submitted_reports
FROM users u
JOIN eten_organizations o ON u.organization_id = o.id
LEFT JOIN eten_applications a ON o.id = a.organization_id
LEFT JOIN eten_application_reports ar ON a.id = ar.application_id 
    AND ar.reporting_period_start = '2025-01-01' 
    AND ar.reporting_period_end = '2025-06-30'
WHERE u.id = 'YOUR_AUTH_USER_ID'::uuid
GROUP BY u.id, u.full_name, u.role, o.name;
```

---

## 🎯 Step 3: Test Login

**Login Credentials:**
- **Email**: `tom+aireport@missionmutual.org`
- **Password**: Whatever you set in Step 1

---

## 📊 What Tom Will See

### Dashboard:
- **Organization**: unfoldingWord
- **4 Applications** with varied report statuses
- **Mixed report states** for realistic testing scenarios

### Applications:
1. **Open Components Ecosystem** (Translation Tool)
   - Status: Not Started
   - Funds: $25,000 received

2. **Global Church-Centric Bible Translation Forum** (Quality Assurance)  
   - Status: Draft (can continue working)
   - Funds: $37,500 received

3. **unfoldingWord - Translation** (Translation Investment)
   - Status: Draft (can continue working)  
   - Funds: $395,312.50 received

4. **iN Undesignated Funding** (illumiNations Undesignated)
   - Status: Submitted (read-only, admin can reopen)
   - Funds: $0 received, $25,000 prior year

### User Experience:
- ✅ **Auto-save** on all draft reports
- ✅ **Tab-based interface** for easier form navigation
- ✅ **Real financial data** for testing calculations
- ✅ **Mixed report types** (Investment vs Tool/Capacity)
- ❌ **Cannot reopen submitted reports** (org_user role)
- ❌ **No admin menu access**

### Perfect for Testing:
- Auto-save functionality
- Different report templates
- Financial calculations and validations
- User permission boundaries
- Report status workflows

---

## 🔧 If You Need Admin Access

To make Tom an admin instead, change the role in the SQL:
```sql
role: 'org_user' → role: 'admin'
```

Admin users can:
- Reopen submitted reports
- Access admin menu items
- See system-wide data