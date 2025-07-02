'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Send, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface Report {
  id: string
  progress_narrative: string | null
  variance_narrative: string | null
  status: 'not_started' | 'draft' | 'submitted'
  submitted_at: string | null
  project: {
    id: string
    name: string
    type: string
    organization: {
      name: string
    }
    project_financials: Array<{
      funds_received: number
      funds_spent: number
      funds_prior_year: number
      financial_context: string | null
    }>
  }
}

export default function ReportPage() {
  const params = useParams()
  const router = useRouter()
  const { userProfile } = useAuth()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form data
  const [progressNarrative, setProgressNarrative] = useState('')
  const [varianceNarrative, setVarianceNarrative] = useState('')
  const [currentFundsSpent, setCurrentFundsSpent] = useState('')
  const [financialContext, setFinancialContext] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const fetchReport = async () => {
      try {
        console.log('Fetching report for project:', params.id)
        
        // First, get the project details
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('id, name, type, organization_id')
          .eq('id', params.id)
          .single()

        if (projectError) {
          throw projectError
        }

        // Get organization
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', projectData.organization_id)
          .single()

        if (orgError) {
          throw orgError
        }

        // Get financial data
        const { data: financialsData, error: financialsError } = await supabase
          .from('project_financials')
          .select('*')
          .eq('project_id', params.id)
          .eq('reporting_period_start', '2025-01-01')
          .eq('reporting_period_end', '2025-06-30')
          .single()

        // Get or create report
        let { data: existingReport, error: fetchError } = await supabase
          .from('reports')
          .select('*')
          .eq('project_id', params.id)
          .eq('reporting_period_start', '2025-01-01')
          .eq('reporting_period_end', '2025-06-30')
          .single()

        // If no report exists, create one
        if (fetchError && fetchError.code === 'PGRST116') {
          const { data: newReport, error: createError } = await supabase
            .from('reports')
            .insert({
              project_id: params.id,
              reporting_period_start: '2025-01-01',
              reporting_period_end: '2025-06-30',
              status: 'not_started'
            })
            .select('*')
            .single()

          if (createError) {
            throw createError
          }

          existingReport = newReport
        } else if (fetchError) {
          throw fetchError
        }

        // Combine data into expected structure
        const reportWithProject = {
          ...existingReport,
          project: {
            ...projectData,
            organization: orgData,
            project_financials: financialsData ? [financialsData] : []
          }
        }

        console.log('Combined report data:', reportWithProject)
        
        setReport(reportWithProject)
        setProgressNarrative(existingReport.progress_narrative || '')
        setVarianceNarrative(existingReport.variance_narrative || '')
        
        // Set financial data
        if (financialsData) {
          setCurrentFundsSpent(financialsData.funds_spent.toString())
          setFinancialContext(financialsData.financial_context || '')
        }
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

  const saveReport = async (newStatus: 'draft' | 'submitted' = 'draft') => {
    if (!report) return

    const isSaving = newStatus === 'draft'
    const isSubmitting = newStatus === 'submitted'
    
    if (isSaving) setSaving(true)
    if (isSubmitting) setSubmitting(true)
    
    setError(null)
    setSuccess(null)

    try {
      // Validate required fields for submission
      if (isSubmitting) {
        if (!progressNarrative.trim()) {
          throw new Error('Progress narrative is required')
        }
        if (!varianceNarrative.trim()) {
          throw new Error('Variance narrative is required')
        }
        if (progressNarrative.length > 1500) {
          throw new Error('Progress narrative must be 1,500 characters or less')
        }
        if (varianceNarrative.length > 1500) {
          throw new Error('Variance narrative must be 1,500 characters or less')
        }
      }

      // Update report
      const { error: reportError } = await supabase
        .from('reports')
        .update({
          progress_narrative: progressNarrative.trim() || null,
          variance_narrative: varianceNarrative.trim() || null,
          status: newStatus,
          submitted_at: isSubmitting ? new Date().toISOString() : null,
          submitted_by: isSubmitting ? userProfile?.id : null
        })
        .eq('id', report.id)

      if (reportError) {
        throw reportError
      }

      // Update financial data
      const financials = report.project.project_financials[0]
      if (financials) {
        const { error: financialError } = await supabase
          .from('project_financials')
          .update({
            funds_spent: parseFloat(currentFundsSpent) || 0,
            financial_context: financialContext.trim() || null
          })
          .eq('project_id', report.project.id)
          .eq('reporting_period_start', '2025-01-01')
          .eq('reporting_period_end', '2025-06-30')

        if (financialError) {
          throw financialError
        }
      }

      setSuccess(
        isSubmitting 
          ? 'Report submitted successfully!' 
          : 'Report saved as draft'
      )

      // Update local state
      setReport(prev => prev ? { ...prev, status: newStatus } : null)

      if (isSubmitting) {
        // Redirect to projects page after submission
        setTimeout(() => {
          router.push('/projects')
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save report')
    } finally {
      setSaving(false)
      setSubmitting(false)
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

  const isSubmitted = report.status === 'submitted'
  const financials = report.project.project_financials[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/projects"
                className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {report.project.name} - Mid-Year Report
                </h1>
                <p className="text-gray-600">{report.project.organization.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isSubmitted && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-1" />
                  <span className="text-sm font-medium">Submitted</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Financial Summary */}
        {financials && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Financial Summary</h2>
              <p className="text-sm text-gray-600">January 1 - June 30, 2025</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">ETEN Investment Received</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${financials.funds_received.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Pre-populated</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Unused Funds from Last Year</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${financials.funds_prior_year.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Pre-populated</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Current Fiscal Year Funds Spent</p>
                  <input
                    type="number"
                    value={currentFundsSpent}
                    onChange={(e) => setCurrentFundsSpent(e.target.value)}
                    disabled={isSubmitted}
                    className="text-2xl font-bold text-orange-600 bg-transparent border-none text-center w-full focus:outline-none focus:ring-2 focus:ring-blue-500 rounded disabled:opacity-60"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500">Required</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Financial Context (Optional)
                </label>
                <textarea
                  value={financialContext}
                  onChange={(e) => setFinancialContext(e.target.value)}
                  disabled={isSubmitted}
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-60 disabled:bg-gray-50"
                  placeholder="Any additional context about your financial situation..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Progress Narrative */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Progress Narrative</h2>
            <p className="text-sm text-gray-600">Describe progress made toward your goals</p>
          </div>
          <div className="p-6">
            <textarea
              value={progressNarrative}
              onChange={(e) => setProgressNarrative(e.target.value)}
              disabled={isSubmitted}
              rows={8}
              maxLength={1500}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-60 disabled:bg-gray-50"
              placeholder="Describe the progress you've made toward your project goals during this reporting period..."
            />
            <div className="mt-2 flex justify-between items-center">
              <p className="text-sm text-gray-500">Required field</p>
              <p className={`text-sm ${progressNarrative.length > 1500 ? 'text-red-600' : 'text-gray-500'}`}>
                {progressNarrative.length}/1,500 characters
              </p>
            </div>
          </div>
        </div>

        {/* Variance Narrative */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Variance Narrative</h2>
            <p className="text-sm text-gray-600">Did anything go differently than expected?</p>
          </div>
          <div className="p-6">
            <textarea
              value={varianceNarrative}
              onChange={(e) => setVarianceNarrative(e.target.value)}
              disabled={isSubmitted}
              rows={8}
              maxLength={1500}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-60 disabled:bg-gray-50"
              placeholder="Did anything go differently than you expected? If so, has that changed the direction of your project moving forward?"
            />
            <div className="mt-2 flex justify-between items-center">
              <p className="text-sm text-gray-500">Required field</p>
              <p className={`text-sm ${varianceNarrative.length > 1500 ? 'text-red-600' : 'text-gray-500'}`}>
                {varianceNarrative.length}/1,500 characters
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isSubmitted && (
          <div className="flex justify-between items-center">
            <Link
              href="/projects"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Link>
            
            <div className="flex space-x-3">
              <button
                onClick={() => saveReport('draft')}
                disabled={saving || submitting}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              
              <button
                onClick={() => saveReport('submitted')}
                disabled={saving || submitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Send className="mr-2 h-4 w-4" />
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}