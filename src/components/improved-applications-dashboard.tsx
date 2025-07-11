'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  DollarSign, 
  Users,
  Filter,
  Search,
  ArrowRight,
  RotateCcw
} from 'lucide-react'
import Link from 'next/link'
import { getCallTypeColor } from '@/utils/call-type-colors'

interface ApplicationWithReport {
  id: string
  name: string
  call_type: string
  fund_year: number
  stage_name: string
  awarded_amount: number
  organization: {
    name: string
    client_rep?: {
      full_name: string
    }
  }
  financials: Array<{
    funds_received: number
    funds_spent: number
    funds_prior_year: number
  }>
  reports: Array<{
    id: string
    status: 'not_started' | 'draft' | 'submitted' | 'reopened'
    due_date: string
    submitted_at?: string
    reporting_period_start: string
    reporting_period_end: string
  }>
  activities: Array<{
    id: string
    description: string
    due_date: string
    eten_invest_june_30: number
  }>
}

interface DashboardFilters {
  status: 'all' | 'not_started' | 'draft' | 'submitted' | 'overdue'
  search: string
  callType: string
}

function getReportStatus(report: ApplicationWithReport['reports'][0]) {
  // For now, just return the actual status from the database
  // We'll handle overdue logic separately since we don't have due_date in the DB
  return report.status || 'not_started'
}


function getStatusBadge(status: string) {
  const configs = {
    submitted: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: CheckCircle,
      label: 'Submitted'
    },
    draft: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      icon: FileText,
      label: 'Draft'
    },
    not_started: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      icon: Clock,
      label: 'Not Started'
    },
    overdue: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      icon: AlertTriangle,
      label: 'Overdue'
    },
    reopened: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      icon: RotateCcw,
      label: 'Reopened'
    }
  }
  
  const config = configs[status as keyof typeof configs] || configs.not_started
  const Icon = config.icon
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </span>
  )
}

function getDaysUntilDue(dueDate: string): { days: number; isOverdue: boolean } {
  const now = new Date()
  const due = new Date(dueDate)
  const diffTime = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return {
    days: Math.abs(diffDays),
    isOverdue: diffDays < 0
  }
}

export default function ImprovedApplicationsDashboard() {
  const { userProfile, loading } = useAuth()
  const [applications, setApplications] = useState<ApplicationWithReport[]>([])
  const [loadingApplications, setLoadingApplications] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<DashboardFilters>({
    status: 'all',
    search: '',
    callType: 'all'
  })

  useEffect(() => {
    const fetchApplications = async () => {
      if (!userProfile?.organization_id) {
        console.log('No organization_id found in userProfile:', userProfile)
        return
      }
      
      console.log('Fetching applications for organization_id:', userProfile.organization_id)
      setLoadingApplications(true)
      setError(null)
      
      try {
        // Fetch applications filtered by organization
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/eten_applications?select=*&organization_id=eq.${userProfile.organization_id}&order=created_at.desc`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Supabase API Error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            url: response.url
          })
          throw new Error(`Failed to fetch applications: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        console.log('Applications fetched:', data.length)
        
        // Get application IDs and organization IDs for fetching related data
        const applicationIds = data.map((app: any) => app.id)
        const organizationIds = [...new Set(data.map((app: any) => app.organization_id))]
        
        // Fetch reports for these applications
        let reportsData = []
        if (applicationIds.length > 0) {
          const reportsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/eten_application_reports?select=id,application_id,status,reporting_period_start,reporting_period_end,submitted_at&reporting_period_start=eq.2025-01-01&reporting_period_end=eq.2025-06-30&application_id=in.(${applicationIds.join(',')})`,
            {
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
                'Content-Type': 'application/json'
              }
            }
          )
          
          if (reportsResponse.ok) {
            reportsData = await reportsResponse.json()
            console.log('Reports fetched:', reportsData)
          }
        }
        
        // Fetch organizations for these applications
        let organizationsData = []
        if (organizationIds.length > 0) {
          const orgsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/eten_organizations?select=id,name,client_rep_id&id=in.(${organizationIds.join(',')})`,
            {
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
                'Content-Type': 'application/json'
              }
            }
          )
          
          if (orgsResponse.ok) {
            organizationsData = await orgsResponse.json()
            console.log('Organizations fetched:', organizationsData)
          }
        }
        
        // Fetch client reps for these organizations
        const clientRepIds = [...new Set(organizationsData.filter((org: any) => org.client_rep_id).map((org: any) => org.client_rep_id))]
        let clientRepsData = []
        if (clientRepIds.length > 0) {
          const repsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/client_reps?select=id,full_name&id=in.(${clientRepIds.join(',')})`,
            {
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
                'Content-Type': 'application/json'
              }
            }
          )
          
          if (repsResponse.ok) {
            clientRepsData = await repsResponse.json()
            console.log('Client reps fetched:', clientRepsData)
          }
        }
        
        // Transform data to match expected structure
        const transformedData = data.map((app: any) => {
          const appReports = reportsData.filter((r: any) => r.application_id === app.id)
          console.log(`Application ${app.name} reports:`, appReports)
          
          // Find organization data
          const organization = organizationsData.find((org: any) => org.id === app.organization_id)
          
          // Find client rep data
          const clientRep = organization?.client_rep_id 
            ? clientRepsData.find((rep: any) => rep.id === organization.client_rep_id)
            : null
          
          return {
            ...app,
            organization: {
              name: organization?.name || 'Unknown Organization',
              client_rep: { full_name: clientRep?.full_name || 'No contact assigned' }
            },
            financials: app.application_financials || [],
            reports: appReports,
            activities: app.eten_activities || []
          }
        })
        
        setApplications(transformedData)
      } catch (err) {
        console.error('Error fetching applications:', err)
        setError(err instanceof Error ? err.message : 'Failed to load applications')
      } finally {
        setLoadingApplications(false)
      }
    }

    fetchApplications()
  }, [userProfile?.organization_id])

  // Filter applications
  const filteredApplications = applications.filter(app => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      if (!app.name.toLowerCase().includes(searchLower) && 
          !app.call_type.toLowerCase().includes(searchLower)) {
        return false
      }
    }

    // Call type filter
    if (filters.callType !== 'all' && app.call_type !== filters.callType) {
      return false
    }

    // Status filter
    if (filters.status !== 'all') {
      const hasReportWithStatus = app.reports.some(report => {
        const status = getReportStatus(report)
        return status === filters.status
      })
      if (!hasReportWithStatus) return false
    }

    return true
  })

  // Get unique call types for filter
  const callTypes = [...new Set(applications.map(app => app.call_type))].sort()

  if (loading || loadingApplications) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reporting Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Manage your Jan-June 2025 reporting period submissions
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Organization</p>
            <p className="font-medium text-gray-900">{userProfile?.organizations?.name || userProfile?.organization?.name || 'Loading...'}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {applications.length}
              </p>
              <p className="text-sm text-gray-600">Total Applications</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {applications.reduce((count, app) => 
                  count + app.reports.filter(r => r.status === 'submitted').length, 0
                )}
              </p>
              <p className="text-sm text-gray-600">Reports Submitted</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {applications.reduce((count, app) => 
                  count + app.reports.filter(r => ['not_started', 'draft', 'reopened'].includes(r.status)).length, 0
                )}
              </p>
              <p className="text-sm text-gray-600">Reports Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {applications.reduce((count, app) => 
                  count + app.reports.filter(r => getReportStatus(r) === 'overdue').length, 0
                )}
              </p>
              <p className="text-sm text-gray-600">Reports Overdue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search applications..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pr-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="not_started">Not Started</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="overdue">Overdue</option>
          </select>

          {/* Call Type Filter */}
          <select
            value={filters.callType}
            onChange={(e) => setFilters(prev => ({ ...prev, callType: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="all">All Call Types</option>
            {callTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          filteredApplications.map(application => (
            <div key={application.id} className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {application.name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCallTypeColor(application.call_type)}`}>
                        {application.call_type}
                      </span>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Awarded: ${application.awarded_amount?.toLocaleString() || 'N/A'}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {application.organization.client_rep?.full_name || 'No contact assigned'}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Fund Year: {application.fund_year}
                      </div>
                    </div>
                  </div>

                  {/* Report Status and Actions */}
                  <div className="ml-6 flex items-center space-x-4">
                    {application.reports && application.reports.length > 0 ? (
                      application.reports.map(report => {
                        const status = getReportStatus(report)
                        // Use fixed due date for July 31, 2025 since it's not in the DB
                        const { days, isOverdue } = getDaysUntilDue('2025-07-31')
                        
                        return (
                          <div key={report.id} className="text-right">
                            <div className="flex items-center space-x-2 mb-2">
                              {getStatusBadge(status)}
                            </div>
                            <p className="text-xs text-gray-500 mb-3">
                              {isOverdue ? (
                                <span className="text-red-600 font-medium">
                                  {days} days overdue
                                </span>
                              ) : (
                                `Due in ${days} days`
                              )}
                            </p>
                            <Link
                              href={`/applications/${application.id}/report`}
                              className="btn-primary inline-flex items-center"
                            >
                              {status === 'submitted' ? 'View Report' : 
                               status === 'not_started' ? 'Start Report' : 'Continue Report'}
                              <ArrowRight className="ml-1 h-4 w-4" />
                            </Link>
                          </div>
                        )
                      })
                    ) : (
                      // Show default action for applications without reports
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-2">
                          {getStatusBadge('not_started')}
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                          Due July 31, 2025
                        </p>
                        <Link
                          href={`/applications/${application.id}/report`}
                          className="btn-primary inline-flex items-center"
                        >
                          Start Report
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Due Date Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <Calendar className="h-5 w-5 text-blue-400 mt-0.5 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Reporting Period Reminder</h3>
            <p className="text-sm text-blue-700 mt-1">
              Reports for the January 1 - June 30, 2025 period are due by July 31, 2025. 
              All reports are automatically saved as drafts while you work on them.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}