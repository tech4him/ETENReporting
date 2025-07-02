'use client'

import { useState, useEffect } from 'react'
import { Save, Plus, Trash2, CheckCircle, Clock, AlertTriangle, Target } from 'lucide-react'

interface Milestone {
  id?: string
  milestone_description: string
  original_due_date?: string
  milestone_order: number
  progress_update?: string
  status: 'Not Started' | 'Behind Schedule' | 'On Track' | 'Ahead of Schedule' | 'Complete'
  completion_date?: string
  variance_notes?: string
  budgeted_amount?: number
  actual_spent?: number
}

interface ToolCapacityReportFormProps {
  applicationId: string
  projectName: string
  reportData?: {
    tool_capacity_progress_narrative?: string
    tool_capacity_variance_narrative?: string
    tool_capacity_financial_context?: string
    funds_received_period?: number
    funds_spent_current?: number
    unused_funds_prior_year?: number
  }
  milestones?: Milestone[]
  onSave: (data: any) => Promise<void>
  saving?: boolean
}

const STATUS_OPTIONS = [
  { value: 'Not Started', label: 'Not Started', icon: Clock, color: 'gray' },
  { value: 'Behind Schedule', label: 'Behind Schedule', icon: AlertTriangle, color: 'red' },
  { value: 'On Track', label: 'On Track', icon: Target, color: 'blue' },
  { value: 'Ahead of Schedule', label: 'Ahead of Schedule', icon: CheckCircle, color: 'green' },
  { value: 'Complete', label: 'Complete', icon: CheckCircle, color: 'green' }
] as const

export default function ToolCapacityReportForm({
  applicationId,
  projectName,
  reportData,
  milestones = [],
  onSave,
  saving = false
}: ToolCapacityReportFormProps) {
  // Status Overview State
  const [progressNarrative, setProgressNarrative] = useState(reportData?.tool_capacity_progress_narrative || '')
  const [varianceNarrative, setVarianceNarrative] = useState(reportData?.tool_capacity_variance_narrative || '')
  
  // Financial Update State
  const [fundsReceived, setFundsReceived] = useState(reportData?.funds_received_period?.toString() || '0')
  const [fundsSpent, setFundsSpent] = useState(reportData?.funds_spent_current?.toString() || '0')
  const [unusedFunds, setUnusedFunds] = useState(reportData?.unused_funds_prior_year?.toString() || '0')
  const [financialContext, setFinancialContext] = useState(reportData?.tool_capacity_financial_context || '')
  
  // Milestone State
  const [projectMilestones, setProjectMilestones] = useState<Milestone[]>(milestones)

  const getStatusIcon = (status: string) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status)
    if (!option) return Clock
    return option.icon
  }

  const getStatusColor = (status: string) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status)
    if (!option) return 'gray'
    return option.color
  }

  const updateMilestone = (index: number, field: keyof Milestone, value: any) => {
    const updated = [...projectMilestones]
    updated[index] = { ...updated[index], [field]: value }
    setProjectMilestones(updated)
  }

  const addMilestone = () => {
    const newMilestone: Milestone = {
      milestone_description: '',
      milestone_order: projectMilestones.length + 1,
      status: 'Not Started'
    }
    setProjectMilestones([...projectMilestones, newMilestone])
  }

  const removeMilestone = (index: number) => {
    const updated = projectMilestones.filter((_, i) => i !== index)
    // Reorder milestones
    updated.forEach((milestone, i) => {
      milestone.milestone_order = i + 1
    })
    setProjectMilestones(updated)
  }

  const handleSave = async () => {
    const formData = {
      // Status Overview
      tool_capacity_progress_narrative: progressNarrative,
      tool_capacity_variance_narrative: varianceNarrative,
      
      // Financial Update  
      funds_received_period: parseFloat(fundsReceived) || 0,
      funds_spent_current: parseFloat(fundsSpent) || 0,
      unused_funds_prior_year: parseFloat(unusedFunds) || 0,
      tool_capacity_financial_context: financialContext,
      
      // Milestones
      milestones: projectMilestones
    }
    
    await onSave(formData)
  }

  const getCharacterCount = (text: string, limit: number = 1500) => {
    const remaining = limit - text.length
    const percentage = (text.length / limit) * 100
    
    return {
      count: text.length,
      remaining,
      percentage,
      isNearLimit: percentage > 80,
      isOverLimit: text.length > limit
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-blue-900">Tool and Capacity Building Report</h2>
        <p className="text-blue-700 mt-1">Project: {projectName}</p>
        <p className="text-sm text-blue-600 mt-2">
          <strong>Reporting Period:</strong> January 1 - June 30, 2025
        </p>
        <p className="text-sm text-blue-600">
          <strong>Character Limit:</strong> All narrative answers are limited to 1500 characters including spaces.
        </p>
      </div>

      {/* Status Overview Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Overview</h3>
        
        {/* Progress Narrative */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            2. Describe progress made toward your goals? (1500 characters)
          </label>
          <textarea
            value={progressNarrative}
            onChange={(e) => setProgressNarrative(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white"
            placeholder="Describe the progress made toward your project goals during the first half of 2025..."
          />
          <div className={`text-sm mt-1 ${getCharacterCount(progressNarrative).isOverLimit ? 'text-red-600' : getCharacterCount(progressNarrative).isNearLimit ? 'text-yellow-600' : 'text-gray-500'}`}>
            {getCharacterCount(progressNarrative).count}/1500 characters ({getCharacterCount(progressNarrative).remaining} remaining)
          </div>
        </div>

        {/* Variance Narrative */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            3. Did anything go differently than you expected? If so, has that changed the direction of your project moving forward? (1500 characters)
          </label>
          <textarea
            value={varianceNarrative}
            onChange={(e) => setVarianceNarrative(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white"
            placeholder="Describe any unexpected developments and how they have affected your project direction..."
          />
          <div className={`text-sm mt-1 ${getCharacterCount(varianceNarrative).isOverLimit ? 'text-red-600' : getCharacterCount(varianceNarrative).isNearLimit ? 'text-yellow-600' : 'text-gray-500'}`}>
            {getCharacterCount(varianceNarrative).count}/1500 characters ({getCharacterCount(varianceNarrative).remaining} remaining)
          </div>
        </div>
      </div>

      {/* Financial Update Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Update</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              1. ETEN Investment Received (Jan 1-June 30)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={fundsReceived}
                onChange={(e) => setFundsReceived(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              2. Current Fiscal Year ETEN Funds Spent
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={fundsSpent}
                onChange={(e) => setFundsSpent(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              3. Unused funds from last year
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={unusedFunds}
                onChange={(e) => setUnusedFunds(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            4. Optional: Additional context around finances
          </label>
          <textarea
            value={financialContext}
            onChange={(e) => setFinancialContext(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white"
            placeholder="Any additional context you'd like to provide around finances..."
          />
        </div>
      </div>

      {/* Milestone Update Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Milestone Update</h3>
          <button
            onClick={addMilestone}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Milestone
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-6">
          <em>Milestones submitted as part of your Proposal are pre-populated. For each milestone, complete the following:</em>
        </p>

        {projectMilestones.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No milestones added yet. Click "Add Milestone" to get started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {projectMilestones.map((milestone, index) => {
              const StatusIcon = getStatusIcon(milestone.status)
              const statusColor = getStatusColor(milestone.status)
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-500">Milestone {milestone.milestone_order}</span>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          statusColor === 'red' ? 'bg-red-100 text-red-800' :
                          statusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                          statusColor === 'green' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {milestone.status}
                        </div>
                      </div>
                      
                      <input
                        type="text"
                        value={milestone.milestone_description}
                        onChange={(e) => updateMilestone(index, 'milestone_description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white"
                        placeholder="Milestone description..."
                      />
                    </div>
                    
                    <button
                      onClick={() => removeMilestone(index)}
                      className="ml-4 p-2 text-gray-400 hover:text-red-600 focus:outline-none"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Original Due Date
                      </label>
                      <input
                        type="date"
                        value={milestone.original_due_date || ''}
                        onChange={(e) => updateMilestone(index, 'original_due_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Milestone Status
                      </label>
                      <select
                        value={milestone.status}
                        onChange={(e) => updateMilestone(index, 'status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      1. Update: What progress has been made toward the milestone? How has that differed from your original plan?
                    </label>
                    <textarea
                      value={milestone.progress_update || ''}
                      onChange={(e) => updateMilestone(index, 'progress_update', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white"
                      placeholder="Describe progress made toward this milestone..."
                    />
                  </div>

                  {milestone.status === 'Complete' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Completion Date
                      </label>
                      <input
                        type="date"
                        value={milestone.completion_date || ''}
                        onChange={(e) => updateMilestone(index, 'completion_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Report
            </>
          )}
        </button>
      </div>
    </div>
  )
}