'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { 
  Users, 
  FileText, 
  Settings, 
  BarChart3, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Building
} from 'lucide-react'
import Link from 'next/link'

interface AdminStats {
  totalUsers: number
  totalOrganizations: number
  totalApplications: number
  totalReports: number
  submittedReports: number
  draftReports: number
  overdueReports: number
}

export default function AdminDashboard() {
  const { userProfile, loading } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch admin statistics
        const [usersRes, orgsRes, appsRes, reportsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?select=count`, {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
              'Prefer': 'count=exact'
            }
          }),
          fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/eten_organizations?select=count`, {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
              'Prefer': 'count=exact'
            }
          }),
          fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/eten_applications?select=count`, {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
              'Prefer': 'count=exact'
            }
          }),
          fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/eten_application_reports?select=status`, {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
            }
          })
        ])

        const reportsData = await reportsRes.json()
        
        const submittedCount = reportsData.filter((r: any) => r.status === 'submitted').length
        const draftCount = reportsData.filter((r: any) => r.status === 'draft').length
        const notStartedCount = reportsData.filter((r: any) => r.status === 'not_started').length

        setStats({
          totalUsers: parseInt(usersRes.headers.get('content-range')?.split('/')[1] || '0'),
          totalOrganizations: parseInt(orgsRes.headers.get('content-range')?.split('/')[1] || '0'),
          totalApplications: parseInt(appsRes.headers.get('content-range')?.split('/')[1] || '0'),
          totalReports: reportsData.length,
          submittedReports: submittedCount,
          draftReports: draftCount,
          overdueReports: notStartedCount // Assuming not started = overdue for this demo
        })
      } catch (error) {
        console.error('Error fetching admin stats:', error)
      } finally {
        setLoadingStats(false)
      }
    }

    if (userProfile?.role === 'admin') {
      fetchStats()
    } else {
      setLoadingStats(false)
    }
  }, [userProfile])

  if (loading || loadingStats) {
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          System overview and administrative controls
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalUsers || 0}
              </p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalOrganizations || 0}
              </p>
              <p className="text-sm text-gray-600">Organizations</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalApplications || 0}
              </p>
              <p className="text-sm text-gray-600">Applications</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalReports || 0}
              </p>
              <p className="text-sm text-gray-600">Total Reports</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Status Overview */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Reporting Status Overview</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats?.submittedReports || 0}</p>
              <p className="text-sm text-gray-600">Submitted Reports</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-4">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats?.draftReports || 0}</p>
              <p className="text-sm text-gray-600">Draft Reports</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mx-auto mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats?.overdueReports || 0}</p>
              <p className="text-sm text-gray-600">Not Started</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/users"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">User Management</h3>
              <p className="text-sm text-gray-600">Manage users and permissions</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/reports"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Report Management</h3>
              <p className="text-sm text-gray-600">Review and manage all reports</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/settings"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <Settings className="h-8 w-8 text-gray-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
              <p className="text-sm text-gray-600">Configure system settings</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}