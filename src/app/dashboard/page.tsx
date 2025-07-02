'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ImprovedApplicationsDashboard from '@/components/improved-applications-dashboard'

export default function DashboardPage() {
  const { userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !userProfile) {
      router.push('/login')
    }
  }, [userProfile, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!userProfile) {
    return null // Redirecting to login
  }

  // For organization users, show the applications dashboard
  if (userProfile.role === 'org_user') {
    return <ImprovedApplicationsDashboard />
  }

  // For admin/staff, show admin dashboard or redirect
  if (userProfile.role === 'admin' || userProfile.role === 'staff') {
    router.push('/admin')
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Fallback - should not reach here
  return (
    <div className="text-center py-8">
      <h2 className="text-xl font-medium text-gray-900">Welcome to ETEN Reporting</h2>
      <p className="text-gray-600 mt-2">Loading your dashboard...</p>
    </div>
  )
}