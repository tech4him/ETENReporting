'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { FileText, DollarSign, Calendar, ArrowRight, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  type: 'Tools' | 'Capacity Building'
  proposal_reference: string | null
  award_reference: string | null
  organization: {
    name: string
    code: string | null
  }
  project_financials: Array<{
    funds_received: number
    funds_spent: number
    funds_prior_year: number
  }>
  reports: Array<{
    status: 'not_started' | 'draft' | 'submitted'
  }>
}

export default function ProjectsPage() {
  const { userProfile, loading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchProjects = async () => {
      console.log('Starting fetchProjects...')
      setLoadingProjects(true)
      setError(null)
      setProjects([]) // Clear previous projects
      
      try {
        console.log('Fetching projects...')
        
        // Try direct REST API call instead of Supabase client
        console.log('Using direct REST API...')
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/projects?select=id,name,type,proposal_reference,award_reference,organization_id`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
              'Content-Type': 'application/json'
            }
          }
        )
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const projectsData = await response.json()
        console.log('Direct API projects data:', projectsData)
        
        // Fetch organizations using direct API
        const orgsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/organizations?select=id,name,code`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
            }
          }
        )
        const orgsData = await orgsResponse.json()
        
        // Fetch financials using direct API
        const financialsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/project_financials?select=*&reporting_period_start=eq.2025-01-01&reporting_period_end=eq.2025-06-30`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
            }
          }
        )
        const financialsData = await financialsResponse.json()
        
        // Fetch reports using direct API
        const reportsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/reports?select=project_id,status&reporting_period_start=eq.2025-01-01&reporting_period_end=eq.2025-06-30`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
            }
          }
        )
        const reportsData = await reportsResponse.json()
        
        // Combine all data
        const combinedProjects = projectsData.map((project: any) => {
          const org = orgsData.find((o: any) => o.id === project.organization_id)
          const financials = financialsData.filter((f: any) => f.project_id === project.id)
          const reports = reportsData.filter((r: any) => r.project_id === project.id)
          
          return {
            ...project,
            organization: org || { name: 'Unknown', code: null },
            project_financials: financials,
            reports: reports
          }
        })
        
        console.log('Combined projects with full data:', combinedProjects)
        setProjects(combinedProjects)
        console.log('Projects set successfully')
      } catch (err) {
        console.error('Error fetching projects:', err)
        setError(err instanceof Error ? err.message : 'Failed to load projects')
      } finally {
        console.log('Setting loadingProjects to false')
        setLoadingProjects(false)
      }
    }

    fetchProjects()
  }, []) // No dependencies to prevent infinite loops

  if (loadingProjects) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Projects</h3>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
              <p className="text-gray-600 mt-1">
                Manage your organization's mid-year reporting for 2025
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Reporting Period</p>
              <p className="font-medium text-gray-900">January 1 - June 30, 2025</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Projects Found</h3>
            <p className="mt-2 text-gray-600">
              {userProfile?.role === 'admin' 
                ? 'No projects have been created yet.'
                : 'You don\'t have any projects assigned to your organization.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {projects.map((project) => {
              const financials = project.project_financials[0]
              const report = project.reports[0]
              const reportStatus = report?.status || 'not_started'

              return (
                <div key={project.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
                        <div className="flex items-center mt-2 space-x-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {project.type}
                          </span>
                          {userProfile?.role !== 'org_user' && (
                            <span className="text-sm text-gray-600">
                              {project.organization.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reportStatus)}`}>
                        {getStatusText(reportStatus)}
                      </span>
                    </div>

                    {/* Financial Summary */}
                    {financials && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-green-600 mr-1" />
                            <span className="text-sm font-medium text-gray-600">Received</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">
                            ${financials.funds_received.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-red-600 mr-1" />
                            <span className="text-sm font-medium text-gray-600">Spent</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">
                            ${financials.funds_spent.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-blue-600 mr-1" />
                            <span className="text-sm font-medium text-gray-600">Remaining</span>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">
                            ${(financials.funds_received - financials.funds_spent + financials.funds_prior_year).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Project Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm text-gray-600">
                      {project.proposal_reference && (
                        <div>
                          <span className="font-medium">Proposal Reference:</span> {project.proposal_reference}
                        </div>
                      )}
                      {project.award_reference && (
                        <div>
                          <span className="font-medium">Award Reference:</span> {project.award_reference}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        Due: July 31, 2025
                      </div>
                      <Link
                        href={`/projects/${project.id}/report`}
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