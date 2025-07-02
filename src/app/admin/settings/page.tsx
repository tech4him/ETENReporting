'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'
import { 
  Settings, 
  Save, 
  Database,
  Mail,
  Shield,
  Calendar,
  Bell,
  AlertTriangle
} from 'lucide-react'

export default function AdminSettingsPage() {
  const { userProfile, loading } = useAuth()
  const [settings, setSettings] = useState({
    reportingDeadline: '2025-07-31',
    emailNotifications: true,
    autoReminders: true,
    reminderDays: 7,
    allowLateSubmissions: false,
    maxFileSize: 10,
    systemMaintenance: false
  })

  const handleSave = async () => {
    // Implementation for saving settings would go here
    console.log('Saving settings:', settings)
  }

  if (loading) {
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
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure system-wide settings and preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </button>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Reporting Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Reporting Settings</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reporting Deadline
                </label>
                <input
                  type="date"
                  value={settings.reportingDeadline}
                  onChange={(e) => setSettings(prev => ({ ...prev, reportingDeadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reminder Days Before Deadline
                </label>
                <input
                  type="number"
                  value={settings.reminderDays}
                  onChange={(e) => setSettings(prev => ({ ...prev, reminderDays: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  min="1"
                  max="30"
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowLateSubmissions"
                checked={settings.allowLateSubmissions}
                onChange={(e) => setSettings(prev => ({ ...prev, allowLateSubmissions: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="allowLateSubmissions" className="ml-2 block text-sm text-gray-900">
                Allow late submissions after deadline
              </label>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Notification Settings</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
                Enable email notifications
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoReminders"
                checked={settings.autoReminders}
                onChange={(e) => setSettings(prev => ({ ...prev, autoReminders: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="autoReminders" className="ml-2 block text-sm text-gray-900">
                Send automatic deadline reminders
              </label>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Database className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">System Settings</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum File Upload Size (MB)
              </label>
              <input
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => setSettings(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) }))}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                min="1"
                max="100"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="systemMaintenance"
                checked={settings.systemMaintenance}
                onChange={(e) => setSettings(prev => ({ ...prev, systemMaintenance: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="systemMaintenance" className="ml-2 block text-sm text-gray-900">
                System maintenance mode (prevents user access)
              </label>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Security settings are managed through Supabase's authentication system. 
                    Please configure password policies and MFA settings in your Supabase dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Email Configuration</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-blue-400 mt-0.5 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Email Configuration</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Email settings are configured through your environment variables. 
                    Update SMTP settings in your deployment configuration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}