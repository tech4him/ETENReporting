'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { FileText, DollarSign, Calendar, ArrowRight, AlertCircle, Users, Target } from 'lucide-react'
import Link from 'next/link'

interface Application {
  id: string
  name: string
  call_type: 'Translation Investment' | 'Translation Tool' | 'Organizational Development' | 'Quality Assurance' | 'Capacity Building' | 'Other'
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
    status: 'not_started' | 'draft' | 'submitted'
  }>
  activities: Array<{
    id: string
    description: string
    due_date: string
    eten_invest_june_30: number
  }>
}

export default function ApplicationsPage() {
  const { userProfile, loading } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loadingApplications, setLoadingApplications] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchApplications = async () => {
      if (!userProfile?.organization_id) return
      
      console.log('Starting fetchApplications...')
      setLoadingApplications(true)
      setError(null)
      setApplications([]) // Clear previous applications
      
      try {
        console.log('Fetching ETEN applications...')
        
        // Fetch applications using direct API - FILTERED BY ORGANIZATION
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/eten_applications?select=id,name,call_type,fund_year,stage_name,awarded_amount,organization_id,salesforce_id&organization_id=eq.${userProfile.organization_id}`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
            }
          }
        )
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const applicationsData = await response.json()
        console.log('Applications data:', applicationsData)
        
        // Fetch organization data - FILTERED TO USER'S ORGANIZATION ONLY
        const orgsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/eten_organizations?select=id,name,client_rep_id&id=eq.${userProfile.organization_id}`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
            }
          }
        )
        const orgsData = await orgsResponse.json()
        
        // Fetch client reps - FILTERED TO USER'S ORGANIZATION'S REP ONLY
        const clientRepId = orgsData[0]?.client_rep_id
        let repsData = []
        if (clientRepId) {
          const repsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/client_reps?select=id,full_name&id=eq.${clientRepId}`,
            {
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
              }
            }
          )
          repsData = await repsResponse.json()
        }
        
        // Get application IDs for filtering related data
        const applicationIds = applicationsData.map((app: any) => app.id)
        
        // Fetch financials using direct API - FILTERED BY APPLICATION IDs
        const financialsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/eten_application_financials?select=*&reporting_period_start=eq.2025-01-01&reporting_period_end=eq.2025-06-30&application_id=in.(${applicationIds.join(',')})`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
            }
          }
        )
        const financialsData = applicationIds.length > 0 ? await financialsResponse.json() : []
        
        // Fetch reports using direct API - FILTERED BY APPLICATION IDs
        const reportsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/eten_application_reports?select=application_id,status&reporting_period_start=eq.2025-01-01&reporting_period_end=eq.2025-06-30&application_id=in.(${applicationIds.join(',')})`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
            }
          }
        )
        const reportsData = applicationIds.length > 0 ? await reportsResponse.json() : []
        
        // Fetch activities using direct API - FILTERED BY APPLICATION IDs
        const activitiesResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/eten_activities?select=application_id,description,due_date,eten_invest_june_30&application_id=in.(${applicationIds.join(',')})`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
            }
          }
        )
        const activitiesData = applicationIds.length > 0 ? await activitiesResponse.json() : []
        
        // Combine all data
        const combinedApplications = applicationsData.map((application: any) => {
          const org = orgsData.find((o: any) => o.id === application.organization_id)
          const clientRep = org ? repsData.find((r: any) => r.id === org.client_rep_id) : null
          const financials = financialsData.filter((f: any) => f.application_id === application.id)
          const reports = reportsData.filter((r: any) => r.application_id === application.id)
          const activities = activitiesData.filter((a: any) => a.application_id === application.id)
          
          return {
            ...application,
            organization: {
              name: org?.name || 'Unknown Organization',
              client_rep: clientRep
            },
            financials: financials,
            reports: reports,
            activities: activities
          }
        })
        
        console.log('Combined applications with full data:', combinedApplications)
        setApplications(combinedApplications)
        console.log('Applications set successfully')
      } catch (err) {
        console.error('Error fetching applications:', err)
        setError(err instanceof Error ? err.message : 'Failed to load applications')
      } finally {
        console.log('Setting loadingApplications to false')
        setLoadingApplications(false)
      }
    }

    fetchApplications()
  }, [userProfile?.organization_id]) // Dependency on user's organization

  if (loadingApplications) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Applications</h3>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Submitted'
      case 'draft':
        return 'Draft'
      default:
        return 'Not Started'
    }
  }

  const getCallTypeColor = (callType: string) => {
    switch (callType) {
      case 'Translation Tool':
        return 'bg-blue-100 text-blue-800'
      case 'Translation Investment':
        return 'bg-purple-100 text-purple-800'
      case 'Organizational Development':
        return 'bg-green-100 text-green-800'
      case 'Quality Assurance':
        return 'bg-orange-100 text-orange-800'
      case 'Capacity Building':
        return 'bg-indigo-100 text-indigo-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ETEN Applications</h1>
              <p className="text-gray-600 mt-1">
                Mid-year reporting for funded applications - 2025
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Reporting Period</p>
              <p className="font-medium text-gray-900">January 1 - June 30, 2025</p>
              <p className="text-xs text-gray-500 mt-1">Due: July 31, 2025</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Awarded</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${applications.reduce((sum, app) => sum + (app.awarded_amount || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Reports Submitted</p>
                <p className="text-2xl font-bold text-gray-900">
                  {applications.filter(app => app.reports.some(r => r.status === 'submitted')).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Organizations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(applications.map(app => app.organization.name)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Applications Found</h3>
            <p className="mt-2 text-gray-600">
              No ETEN applications are currently available for reporting.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {applications.map((application) => {
              const financials = application.financials[0]
              const report = application.reports[0]
              const reportStatus = report?.status || 'not_started'
              const totalActivities = application.activities.length
              const totalActivityBudget = application.activities.reduce((sum, act) => sum + (act.eten_invest_june_30 || 0), 0)

              return (
                <div key={application.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 mr-4">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{application.name}</h3>
                        <div className="flex items-center flex-wrap gap-2 mb-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCallTypeColor(application.call_type)}`}>
                            {application.call_type}
                          </span>
                          <span className="text-sm text-gray-600">
                            {application.organization.name}
                          </span>
                          {application.organization.client_rep && (
                            <span className="text-xs text-gray-500">
                              Rep: {application.organization.client_rep.full_name}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            FY {application.fund_year}
                          </span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reportStatus)}`}>
                        {getStatusText(reportStatus)}
                      </span>
                    </div>

                    {/* Financial Summary */}
                    {financials && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-green-600 mr-1" />
                            <span className="text-sm font-medium text-gray-600">Awarded</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">
                            ${application.awarded_amount?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-red-600 mr-1" />
                            <span className="text-sm font-medium text-gray-600">Spent</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">
                            ${financials.funds_spent?.toLocaleString() || '0'}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-blue-600 mr-1" />
                            <span className="text-sm font-medium text-gray-600">Remaining</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">
                            ${((financials.funds_received || 0) - (financials.funds_spent || 0) + (financials.funds_prior_year || 0)).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Activities Summary */}
                    {totalActivities > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Target className="h-4 w-4 text-blue-600 mr-2" />
                            <span className="text-sm font-medium text-gray-700">
                              {totalActivities} Activities
                            </span>
                          </div>
                          {totalActivityBudget > 0 && (
                            <span className="text-sm text-gray-600">
                              ${totalActivityBudget.toLocaleString()} allocated
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        Due: July 31, 2025
                      </div>
                      <Link
                        href={`/applications/${application.id}/report`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {reportStatus === 'submitted' ? 'View Report' : 'Complete Report'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}