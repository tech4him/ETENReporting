'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AlertCircle } from 'lucide-react'
import TabbedReportForm from '@/components/tabbed-report-form'

interface ApplicationReport {
  id: string
  progress_narrative: string | null
  variance_narrative: string | null
  financial_summary_narrative: string | null
  status: 'not_started' | 'draft' | 'submitted' | 'reopened'
  submitted_at: string | null
  current_funds_spent?: number
  project_allocations?: any[]
  non_project_allocations?: any
  application: {
    id: string
    name: string
    call_type: string
    fund_year: number
    awarded_amount: number
    organization: {
      name: string
      client_rep?: {
        full_name: string
      }
    }
  }
}

export default function ApplicationReportPage() {
  const params = useParams()
  const router = useRouter()
  const { userProfile } = useAuth()
  const [report, setReport] = useState<ApplicationReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper function to determine reporting template type
  const getReportingTemplateType = (callType: string) => {
    if (callType === 'Translation Investment' || callType === 'illumiNations Undesignated') {
      return 'investment_reporting'
    } else if (callType === 'Translation Tool' || callType === 'Translation Tools' || callType === 'Capacity Building - Quality Assurance' || callType === 'Quality Assurance' || callType === 'Organizational Development') {
      return 'tool_capacity_reporting'
    }
    return 'unknown'
  }

  useEffect(() => {
    const fetchReport = async () => {
      try {
        console.log('Fetching report for application:', params.id)
        
        // First, get the application details
        const applicationResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/eten_applications?select=id,name,call_type,fund_year,awarded_amount,organization_id&id=eq.${params.id}`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
            }
          }
        )
        
        if (!applicationResponse.ok) {
          throw new Error(`HTTP error! status: ${applicationResponse.status}`)
        }
        
        const applicationData = await applicationResponse.json()
        if (applicationData.length === 0) {
          throw new Error('Application not found')
        }
        
        const application = applicationData[0]
        
        // Get organization
        const orgResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/eten_organizations?select=name,client_rep_id&id=eq.${application.organization_id}`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
            }
          }
        )
        const orgData = await orgResponse.json()
        const organization = orgData[0]
        
        // Get client rep if exists
        let clientRep = null
        if (organization?.client_rep_id) {
          const repResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/client_reps?select=full_name&id=eq.${organization.client_rep_id}`,
            {
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
              }
            }
          )
          const repData = await repResponse.json()
          clientRep = repData[0]
        }

        // Get or create report
        let reportResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/eten_application_reports?select=*&application_id=eq.${params.id}&reporting_period_start=eq.2025-01-01&reporting_period_end=eq.2025-06-30`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
            }
          }
        )
        
        let reportData = await reportResponse.json()
        let existingReport = reportData[0]

        // If no report exists, create one
        if (!existingReport) {
          console.log('Creating report for application ID:', params.id)
          try {
            const createResponse = await fetch(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/eten_application_reports`,
              {
                method: 'POST',
                headers: {
                  'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                  'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=representation,resolution=ignore-duplicates'
                },
                body: JSON.stringify({
                  application_id: params.id,
                  reporting_period_start: '2025-01-01',
                  reporting_period_end: '2025-06-30',
                  status: 'not_started'
                })
              }
            )
            
            if (createResponse.ok) {
              const newReportData = await createResponse.json()
              existingReport = newReportData[0] || null
            }
            
            // If upsert didn't return data, fetch the existing report
            if (!existingReport) {
              const retryResponse = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/eten_application_reports?select=*&application_id=eq.${params.id}&reporting_period_start=eq.2025-01-01&reporting_period_end=eq.2025-06-30`,
                {
                  headers: {
                    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
                  }
                }
              )
              
              if (retryResponse.ok) {
                const retryData = await retryResponse.json()
                existingReport = retryData[0]
              }
              
              if (!existingReport) {
                throw new Error('Failed to create or fetch report')
              }
            }
          } catch (createError) {
            console.error('Error in report creation:', createError)
            throw createError
          }
        }

        // Load project allocations if they exist
        let projectAllocations = []
        try {
          const allocationsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/project_allocations?select=*,project_allocation_partners(*)&application_report_id=eq.${existingReport.id}`,
            {
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
              }
            }
          )
          if (allocationsResponse.ok) {
            projectAllocations = await allocationsResponse.json()
          }
        } catch (err) {
          console.warn('Failed to load project allocations:', err)
        }

        // Load non-project allocations if they exist
        let nonProjectAllocations = null
        try {
          const nonProjectResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/non_project_allocations?select=*&application_report_id=eq.${existingReport.id}`,
            {
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
              }
            }
          )
          if (nonProjectResponse.ok) {
            const data = await nonProjectResponse.json()
            nonProjectAllocations = data[0] || null
          }
        } catch (err) {
          console.warn('Failed to load non-project allocations:', err)
        }

        // Combine data into expected structure
        const reportWithApplication = {
          ...existingReport,
          project_allocations: projectAllocations,
          non_project_allocations: nonProjectAllocations,
          application: {
            ...application,
            organization: {
              ...organization,
              client_rep: clientRep
            }
          }
        }

        console.log('Combined report data:', reportWithApplication)
        setReport(reportWithApplication)
        
      } catch (err) {
        console.error('Error fetching report:', err)
        setError(err instanceof Error ? err.message : 'Failed to load report')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchReport()
    }
  }, [params.id])

  const handleSave = async (data: any) => {
    if (!report) return

    try {
      // Update report
      const reportResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/eten_application_reports?id=eq.${report.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            progress_narrative: data.progress_narrative || null,
            variance_narrative: data.variance_narrative || null,
            financial_summary_narrative: data.financial_summary_narrative || null,
            current_funds_spent: data.current_funds_spent || null,
            status: 'draft',
            updated_at: new Date().toISOString()
          })
        }
      )

      if (!reportResponse.ok) {
        throw new Error('Failed to save report')
      }

      // Save project allocations if provided
      if (data.project_allocations && data.project_allocations.length > 0) {
        // Delete existing allocations
        await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/project_allocations?application_report_id=eq.${report.id}`,
          {
            method: 'DELETE',
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
            }
          }
        )

        // Insert new allocations
        for (const allocation of data.project_allocations) {
          const allocationResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/project_allocations`,
            {
              method: 'POST',
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              },
              body: JSON.stringify({
                application_report_id: report.id,
                language_name: allocation.language_name,
                ethnologue_code: allocation.ethnologue_code,
                country: allocation.country,
                dialect_rolv_number: allocation.dialect_rolv_number,
                amount_allocated: allocation.amount_allocated,
                all_access_goal: allocation.all_access_goal,
                eligible_for_eten_funding: allocation.eligible_for_eten_funding,
                all_access_status: allocation.all_access_status,
                language_population_group: allocation.language_population_group,
                first_language_population: allocation.first_language_population,
                egids_level: allocation.egids_level,
                is_sign_language: allocation.is_sign_language,
                luminations_region: allocation.luminations_region
              })
            }
          )

          if (!allocationResponse.ok) {
            console.error('Failed to save project allocation')
            continue
          }

          const savedAllocation = await allocationResponse.json()
          const allocationId = savedAllocation[0]?.id

          // Save partners for this allocation
          if (allocation.partners && allocation.partners.length > 0) {
            for (const partner of allocation.partners) {
              await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/project_allocation_partners`,
                {
                  method: 'POST',
                  headers: {
                    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    project_allocation_id: allocationId,
                    partner_organization_name: partner.partner_organization_name
                  })
                }
              )
            }
          }
        }
      }

      // Save non-project allocations if provided
      if (data.non_project_allocations) {
        // Delete existing non-project allocations
        await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/non_project_allocations?application_report_id=eq.${report.id}`,
          {
            method: 'DELETE',
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
            }
          }
        )

        // Insert new non-project allocations
        await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/non_project_allocations`,
          {
            method: 'POST',
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              application_report_id: report.id,
              indirect_costs: data.non_project_allocations.indirect_costs || 0,
              assessments: data.non_project_allocations.assessments || 0,
              unused_funds_prior_year: data.non_project_allocations.unused_funds_prior_year || 0,
              other: data.non_project_allocations.other || 0
            })
          }
        )
      }

      console.log('Report saved successfully')
    } catch (error) {
      console.error('Failed to save report:', error)
      throw error
    }
  }

  const handleSubmit = async (data: any) => {
    if (!report) return

    try {
      // First save the data
      await handleSave(data)

      // Then submit the report
      const submitResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/eten_application_reports?id=eq.${report.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'submitted',
            submitted_at: new Date().toISOString(),
            submitted_by: userProfile?.id
          })
        }
      )

      if (!submitResponse.ok) {
        throw new Error('Failed to submit report')
      }

      // Redirect to applications page
      router.push('/applications')
    } catch (error) {
      console.error('Failed to submit report:', error)
      throw error
    }
  }

  const handleReopen = async (reportId: string) => {
    try {
      const reopenResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/eten_application_reports?id=eq.${reportId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'reopened',
            submitted_at: null,
            submitted_by: null
          })
        }
      )

      if (!reopenResponse.ok) {
        throw new Error('Failed to reopen report')
      }

      // Refresh the page
      window.location.reload()
    } catch (error) {
      console.error('Failed to reopen report:', error)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Report</h3>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Report Not Found</h3>
          <p className="mt-2 text-gray-600">The requested report could not be found.</p>
        </div>
      </div>
    )
  }

  const reportingTemplateType = getReportingTemplateType(report.application.call_type)
  // Fix for reports incorrectly marked as submitted without submission date
  const isActuallySubmitted = report.status === 'submitted' && report.submitted_at
  const isSubmitted = isActuallySubmitted
  const isAdmin = userProfile?.role === 'admin'

  // Auto-fix incorrect status
  useEffect(() => {
    const fixIncorrectStatus = async () => {
      if (report.status === 'submitted' && !report.submitted_at) {
        console.log('Fixing incorrectly marked submitted report')
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/eten_application_reports?id=eq.${report.id}`,
            {
              method: 'PATCH',
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                status: 'draft'
              })
            }
          )
          // Refresh the page to show correct state
          window.location.reload()
        } catch (error) {
          console.error('Failed to fix report status:', error)
        }
      }
    }
    
    fixIncorrectStatus()
  }, [report.id, report.status, report.submitted_at])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Mid-Year Report - {report.application.fund_year}
          </h1>
          <p className="text-xl text-gray-700 mt-2">{report.application.name}</p>
          <p className="text-gray-600">{report.application.organization.name}</p>
          {report.application.organization.client_rep && (
            <p className="text-sm text-gray-500">
              Client Rep: {report.application.organization.client_rep.full_name}
            </p>
          )}
        </div>

        {reportingTemplateType === 'unknown' ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Unknown Report Type</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  This application's call type ({report.application.call_type}) is not recognized for reporting.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <TabbedReportForm
            applicationId={report.application.id}
            reportType={reportingTemplateType}
            initialData={{
              progress_narrative: report.progress_narrative,
              variance_narrative: report.variance_narrative,
              financial_summary_narrative: report.financial_summary_narrative,
              current_funds_spent: report.current_funds_spent,
              project_allocations: report.project_allocations,
              non_project_allocations: report.non_project_allocations
            }}
            onSave={handleSave}
            onSubmit={handleSubmit}
            onReopen={handleReopen}
            isSubmitted={isSubmitted}
            isAdmin={isAdmin}
          />
        )}
      </div>
    </div>
  )
}