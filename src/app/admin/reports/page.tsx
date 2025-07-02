'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { 
  FileText, 
  RotateCcw, 
  Eye, 
  Search, 
  Filter,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building
} from 'lucide-react'
import Link from 'next/link'

interface ReportWithDetails {
  id: string
  status: 'not_started' | 'draft' | 'submitted'
  reporting_period_start: string
  reporting_period_end: string
  submitted_at?: string
  created_at: string
  updated_at: string
  application: {
    id: string
    name: string
    call_type: string
    awarded_amount: number
    organization: {
      name: string
    }
  }
}

interface Filters {
  status: string
  organization: string
  callType: string
  search: string
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
      icon: Clock,
      label: 'Draft'
    },
    not_started: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      icon: Clock,
      label: 'Not Started'
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

export default function AdminReportsPage() {
  const { userProfile, loading } = useAuth()
  const [reports, setReports] = useState<ReportWithDetails[]>([])
  const [loadingReports, setLoadingReports] = useState(true)
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    organization: 'all',
    callType: 'all',
    search: ''
  })
  const [organizations, setOrganizations] = useState<Array<{ id: string, name: string }>>([])
  const [callTypes, setCallTypes] = useState<string[]>([])

  useEffect(() => {
    const fetchReports = async () => {
      if (userProfile?.role !== 'admin') return

      try {
        setLoadingReports(true)
        
        // Fetch reports with application and organization details
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/eten_application_reports?select=id,status,reporting_period_start,reporting_period_end,submitted_at,created_at,updated_at,application:eten_applications(id,name,call_type,awarded_amount,organization:eten_organizations(name))&order=updated_at.desc`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
            }
          }
        )

        if (response.ok) {
          const data = await response.json()
          setReports(data)
          
          // Extract unique organizations and call types for filters
          const uniqueOrgs = [...new Set(data.map((r: any) => r.application.organization.name))].sort()
          const uniqueCallTypes = [...new Set(data.map((r: any) => r.application.call_type))].sort()
          
          setOrganizations(uniqueOrgs.map(name => ({ id: name, name })))
          setCallTypes(uniqueCallTypes)
        }
      } catch (error) {
        console.error('Error fetching reports:', error)
      } finally {
        setLoadingReports(false)
      }
    }

    fetchReports()
  }, [userProfile])

  const handleReopenReport = async (reportId: string, applicationId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/eten_application_reports?id=eq.${reportId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'draft',
            updated_at: new Date().toISOString()
          })
        }
      )

      if (response.ok) {
        // Refresh the reports list
        setReports(prev => prev.map(report => 
          report.id === reportId 
            ? { ...report, status: 'draft' as const, updated_at: new Date().toISOString() }
            : report
        ))
      }
    } catch (error) {
      console.error('Error reopening report:', error)
    }
  }

  // Filter reports
  const filteredReports = reports.filter(report => {
    if (filters.status !== 'all' && report.status !== filters.status) return false
    if (filters.organization !== 'all' && report.application.organization.name !== filters.organization) return false
    if (filters.callType !== 'all' && report.application.call_type !== filters.callType) return false
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      if (!report.application.name.toLowerCase().includes(searchLower) &&
          !report.application.organization.name.toLowerCase().includes(searchLower)) {
        return false
      }
    }
    return true
  })

  if (loading || loadingReports) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (userProfile?.role !== 'admin') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
          <div>
            <h3 className="text-red-800 font-medium">Access Denied</h3>
            <p className="text-red-700 text-sm mt-1">
              You need administrator privileges to access this page.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Report Management</h1>
          <p className="text-gray-600 mt-1">
            Review and manage all organization reports
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <Download className="h-4 w-4 mr-2" />
          Export All
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
              <p className="text-sm text-gray-600">Total Reports</p>
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
                {reports.filter(r => r.status === 'submitted').length}
              </p>
              <p className="text-sm text-gray-600">Submitted</p>
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
                {reports.filter(r => r.status === 'draft').length}
              </p>
              <p className="text-sm text-gray-600">In Progress</p>
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
                {reports.filter(r => r.status === 'not_started').length}
              </p>
              <p className="text-sm text-gray-600">Not Started</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="not_started">Not Started</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
          </select>

          <select
            value={filters.organization}
            onChange={(e) => setFilters(prev => ({ ...prev, organization: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="all">All Organizations</option>
            {organizations.map(org => (
              <option key={org.id} value={org.name}>{org.name}</option>
            ))}
          </select>

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

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Reports ({filteredReports.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Application
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {report.application.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {report.application.call_type} • ${report.application.awarded_amount.toLocaleString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {report.application.organization.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(report.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(report.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link
                      href={`/applications/${report.application.id}/report`}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Link>
                    {report.status === 'submitted' && (
                      <button
                        onClick={() => handleReopenReport(report.id, report.application.id)}
                        className="inline-flex items-center px-3 py-1 border border-orange-300 rounded-md text-orange-700 hover:bg-orange-50"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reopen
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  )
}