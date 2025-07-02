'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  FileText, 
  DollarSign, 
  Globe, 
  Target, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Save,
  Send,
  ArrowLeft,
  RotateCcw,
  Plus,
  X
} from 'lucide-react'
import { useAutoSave, createFieldUpdater } from '@/hooks/useAutoSave'
import { LanguageData } from '@/components/language-selector'
import ProjectAllocationsForm from '@/components/project-allocations-form'
import NonProjectAllocationsForm from '@/components/non-project-allocations-form'

interface ReportTab {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  component: React.ComponentType<{ 
    data: any
    updateData: (updates: any) => void
    isSubmitted: boolean
    errors: Record<string, string>
    applicationId: string
  }>
  validation?: (data: any) => string[]
  required?: boolean
}

interface TabbedReportFormProps {
  applicationId: string
  reportType: 'investment_reporting' | 'tool_capacity_reporting'
  initialData: any
  onSave: (data: any) => Promise<void>
  onSubmit: (data: any) => Promise<void>
  onReopen?: (reportId: string) => Promise<void>
  isSubmitted: boolean
  isAdmin?: boolean
  className?: string
}

interface ReportData {
  // Investment Reporting Fields
  progress_narrative?: string
  variance_narrative?: string
  financial_summary_narrative?: string
  current_funds_spent?: number
  project_allocations?: Array<{
    language_name: string
    ethnologue_code: string
    country: string
    dialect_rolv?: string
    amount: number
    partners: string[]
  }>
  non_project_allocations?: {
    indirect_costs: number
    assessments: number
    unused_funds_prior_year: number
    other: number
  }
  
  // Tool/Capacity Building Fields
  tool_capacity_progress_narrative?: string
  tool_capacity_variance_narrative?: string
  tool_capacity_financial_context?: string
  funds_received_current?: number
  funds_spent_current?: number
  unused_funds_from_last_year?: number
  milestones?: Array<{
    id?: string
    description: string
    due_date: string
    status: 'not_started' | 'behind_schedule' | 'on_track' | 'ahead_of_schedule' | 'complete'
    progress_update: string
    completion_date?: string
    milestone_order: number
  }>
}

// Auto-save status indicator component
function AutoSaveIndicator({ 
  isSaving, 
  lastSaved, 
  hasUnsavedChanges, 
  error 
}: {
  isSaving: boolean
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  error: string | null
}) {
  if (error) {
    return (
      <div className="flex items-center text-red-600 text-sm">
        <AlertCircle className="h-4 w-4 mr-1" />
        Auto-save failed
      </div>
    )
  }
  
  if (isSaving) {
    return (
      <div className="flex items-center text-blue-600 text-sm">
        <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
        Saving...
      </div>
    )
  }
  
  if (hasUnsavedChanges) {
    return (
      <div className="flex items-center text-orange-600 text-sm">
        <Clock className="h-4 w-4 mr-1" />
        Unsaved changes
      </div>
    )
  }
  
  if (lastSaved) {
    return (
      <div className="flex items-center text-green-600 text-sm">
        <CheckCircle className="h-4 w-4 mr-1" />
        Saved {formatLastSaved(lastSaved)}
      </div>
    )
  }
  
  return null
}

function formatLastSaved(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return date.toLocaleDateString()
}

export default function TabbedReportForm({
  applicationId,
  reportType,
  initialData,
  onSave,
  onSubmit,
  onReopen,
  isSubmitted,
  isAdmin = false,
  className = ''
}: TabbedReportFormProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-save setup
  const {
    data,
    updateData,
    saveNow,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    error: autoSaveError
  } = useAutoSave<ReportData>(initialData, {
    delay: 2000,
    onSave: async (data) => {
      await onSave(data)
    },
    onSaveError: (error) => {
      console.error('Auto-save failed:', error)
    }
  })

  // Define tabs based on report type
  const tabs: ReportTab[] = reportType === 'investment_reporting' 
    ? [
        {
          id: 'overview',
          name: 'Overview',
          icon: FileText,
          component: OverviewTab,
          required: false
        },
        {
          id: 'financials',
          name: 'Financial Summary',
          icon: DollarSign,
          component: FinancialSummaryTab,
          validation: (data) => {
            const errors = []
            if (!data.current_funds_spent || data.current_funds_spent <= 0) {
              errors.push('Current funds spent is required')
            }
            return errors
          },
          required: true
        },
        {
          id: 'projects',
          name: 'Project Allocations',
          icon: Globe,
          component: ProjectAllocationsTab,
          validation: (data) => {
            const errors = []
            if (!data.project_allocations || data.project_allocations.length === 0) {
              errors.push('At least one project allocation is required')
            }
            return errors
          },
          required: true
        },
        {
          id: 'narratives',
          name: 'Progress & Variance',
          icon: Target,
          component: NarrativesTab,
          validation: (data) => {
            const errors = []
            if (!data.progress_narrative || data.progress_narrative.trim().length === 0) {
              errors.push('Progress narrative is required')
            }
            if (!data.variance_narrative || data.variance_narrative.trim().length === 0) {
              errors.push('Variance narrative is required')
            }
            if (data.progress_narrative && data.progress_narrative.length > 1500) {
              errors.push('Progress narrative must be 1500 characters or less')
            }
            if (data.variance_narrative && data.variance_narrative.length > 1500) {
              errors.push('Variance narrative must be 1500 characters or less')
            }
            return errors
          },
          required: true
        }
      ]
    : [
        {
          id: 'overview',
          name: 'Overview',
          icon: FileText,
          component: ToolOverviewTab,
          required: false
        },
        {
          id: 'financials',
          name: 'Financial Update',
          icon: DollarSign,
          component: ToolFinancialTab,
          validation: (data) => {
            const errors = []
            if (!data.funds_spent_current || data.funds_spent_current <= 0) {
              errors.push('Current funds spent is required')
            }
            return errors
          },
          required: true
        },
        {
          id: 'milestones',
          name: 'Milestones',
          icon: Target,
          component: MilestonesTab,
          required: false
        },
        {
          id: 'narratives',
          name: 'Progress & Variance',
          icon: Target,
          component: ToolNarrativesTab,
          validation: (data) => {
            const errors = []
            if (!data.tool_capacity_progress_narrative || data.tool_capacity_progress_narrative.trim().length === 0) {
              errors.push('Progress narrative is required')
            }
            if (!data.tool_capacity_variance_narrative || data.tool_capacity_variance_narrative.trim().length === 0) {
              errors.push('Variance narrative is required')
            }
            return errors
          },
          required: true
        }
      ]

  // Validate all tabs
  const validateForm = useCallback(() => {
    const allErrors: Record<string, string> = {}
    
    tabs.forEach((tab, index) => {
      if (tab.validation) {
        const tabErrors = tab.validation(data)
        if (tabErrors.length > 0) {
          allErrors[tab.id] = tabErrors.join(', ')
        }
      }
    })
    
    setErrors(allErrors)
    return Object.keys(allErrors).length === 0
  }, [data, tabs])

  // Handle manual save
  const handleSave = async () => {
    try {
      await saveNow()
    } catch (error) {
      console.error('Manual save failed:', error)
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      // Switch to first tab with errors
      const firstErrorTab = tabs.findIndex(tab => errors[tab.id])
      if (firstErrorTab !== -1) {
        setActiveTab(firstErrorTab)
      }
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Submit failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle reopen
  const handleReopen = async () => {
    if (onReopen) {
      try {
        await onReopen(applicationId)
      } catch (error) {
        console.error('Reopen failed:', error)
      }
    }
  }

  const ActiveTabComponent = tabs[activeTab]?.component

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header with navigation and auto-save status */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Applications
          </button>
          
          {isSubmitted && (
            <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              <CheckCircle className="h-4 w-4 mr-1" />
              Submitted
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <AutoSaveIndicator
            isSaving={isSaving}
            lastSaved={lastSaved}
            hasUnsavedChanges={hasUnsavedChanges}
            error={autoSaveError}
          />

          {!isSubmitted && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-1" />
              Save Draft
            </button>
          )}

          {isSubmitted && isAdmin && onReopen && (
            <button
              onClick={handleReopen}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reopen for Editing
            </button>
          )}

          {!isSubmitted && (
            <button
              onClick={handleSubmit}
              disabled={isSaving || isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4 mr-1" />
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab, index) => {
            const Icon = tab.icon
            const hasError = errors[tab.id]
            const isActive = index === activeTab
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(index)}
                className={`
                  flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : hasError
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className={`h-4 w-4 mr-2 ${hasError ? 'text-red-500' : ''}`} />
                {tab.name}
                {tab.required && (
                  <span className="ml-1 text-red-500">*</span>
                )}
                {hasError && (
                  <AlertCircle className="h-4 w-4 ml-2 text-red-500" />
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {ActiveTabComponent && (
          <ActiveTabComponent
            data={data}
            updateData={updateData}
            isSubmitted={isSubmitted}
            errors={errors}
            applicationId={applicationId}
          />
        )}
      </div>

      {/* Error Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="p-6 border-t border-gray-200 bg-red-50">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Please correct the following errors before submitting:
              </h3>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {Object.entries(errors).map(([tabId, error]) => (
                  <li key={tabId}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Investment Reporting Tab Components
function OverviewTab({ data, updateData, isSubmitted, errors, applicationId }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Reporting Instructions</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            This report covers the period from January 1 - June 30, 2025. Please complete all required sections marked with an asterisk (*).
          </p>
          <p>
            Your responses are automatically saved as you type. You can return to complete the report at any time before the submission deadline.
          </p>
          <div className="mt-4">
            <h4 className="font-medium mb-2">Report Sections:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Financial Summary - Report your current fiscal year spending</li>
              <li>Project Allocations - Allocate funding to specific language projects</li>
              <li>Progress & Variance - Describe your progress and any changes from plan</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Key Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Total Allocated</p>
            <p className="text-2xl font-bold text-gray-900">
              ${((data.project_allocations || []).reduce((sum: number, a: any) => sum + (a.amount_allocated || 0), 0) +
                (data.non_project_allocations ? 
                  (data.non_project_allocations.indirect_costs || 0) +
                  (data.non_project_allocations.assessments || 0) +
                  (data.non_project_allocations.unused_funds_prior_year || 0) +
                  (data.non_project_allocations.other || 0)
                  : 0)
              ).toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Languages Supported</p>
            <p className="text-2xl font-bold text-gray-900">
              {(data.project_allocations || []).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Report Status</p>
            <p className="text-lg font-medium text-gray-900">
              {isSubmitted ? 'Submitted' : 'Draft'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FinancialSummaryTab({ data, updateData, isSubmitted, errors, applicationId }: any) {
  const fieldUpdater = createFieldUpdater(updateData)
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h3>
        <p className="text-sm text-gray-600 mb-6">
          Report your financial activity for the period January 1 - June 30, 2025
        </p>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Fiscal Year Funds Spent *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={data.current_funds_spent || ''}
                onChange={(e) => fieldUpdater('current_funds_spent', parseFloat(e.target.value) || 0)}
                disabled={isSubmitted}
                className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Total amount spent during this reporting period
            </p>
            {errors.financials && (
              <p className="mt-1 text-sm text-red-600">{errors.financials}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Financial Context & Notes (Optional)
            </label>
            <textarea
              value={data.financial_summary_narrative || ''}
              onChange={(e) => fieldUpdater('financial_summary_narrative', e.target.value)}
              disabled={isSubmitted}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="Provide any additional context about your financial situation, efficiency improvements, or budget variances..."
            />
          </div>

          {/* Summary Box */}
          <div className="bg-gray-50 rounded-lg p-4 mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Funding Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Project Allocations:</span>
                <span className="font-medium text-gray-900">
                  ${(data.project_allocations || []).reduce((sum: number, a: any) => sum + (a.amount_allocated || 0), 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Non-Project Allocations:</span>
                <span className="font-medium text-gray-900">
                  ${(data.non_project_allocations ? 
                    (data.non_project_allocations.indirect_costs || 0) +
                    (data.non_project_allocations.assessments || 0) +
                    (data.non_project_allocations.other || 0)
                    : 0
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unused Prior Year Funds:</span>
                <span className="font-medium text-gray-900">
                  ${(data.non_project_allocations?.unused_funds_prior_year || 0).toLocaleString()}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-medium text-gray-700">Total Reported:</span>
                <span className="font-bold text-gray-900">
                  ${((data.project_allocations || []).reduce((sum: number, a: any) => sum + (a.amount_allocated || 0), 0) +
                    (data.non_project_allocations ? 
                      (data.non_project_allocations.indirect_costs || 0) +
                      (data.non_project_allocations.assessments || 0) +
                      (data.non_project_allocations.unused_funds_prior_year || 0) +
                      (data.non_project_allocations.other || 0)
                      : 0)
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProjectAllocationsTab({ data, updateData, isSubmitted, errors, applicationId }: any) {
  return (
    <div className="space-y-8">
      {/* Project Allocations Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project Allocations by Language</h2>
          <p className="text-gray-600">
            Allocate funding to specific language translation projects using SIL Ethnologue data
          </p>
        </div>
        
        <ProjectAllocationsForm
          applicationId={applicationId}
          reportingPeriodStart="2025-01-01"
          reportingPeriodEnd="2025-06-30"
          initialAllocations={data.project_allocations || []}
          onAllocationsChange={(allocations) => {
            updateData({ project_allocations: allocations })
          }}
          onValidationChange={(isValid) => {
            // Handle validation state if needed
          }}
        />
      </div>

      {/* Non-Project Allocations Section */}
      <div className="border-t border-gray-200 pt-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Non-Project Allocations</h2>
          <p className="text-gray-600">
            Allocate funding to administrative costs, assessments, and other non-project expenses
          </p>
        </div>

        <NonProjectAllocationsForm
          applicationId={applicationId}
          reportingPeriodStart="2025-01-01"
          reportingPeriodEnd="2025-06-30"
          initialAllocations={data.non_project_allocations}
          onAllocationsChange={(allocations) => {
            updateData({ non_project_allocations: allocations })
          }}
          onValidationChange={(isValid) => {
            // Handle validation state if needed
          }}
        />
      </div>
    </div>
  )
}

function NarrativesTab({ data, updateData, isSubmitted, errors, applicationId }: any) {
  const fieldUpdater = createFieldUpdater(updateData)
  
  return (
    <div className="space-y-6">
      {/* Progress Narrative */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Progress Narrative *</h3>
        <p className="text-sm text-gray-600 mb-4">
          Describe the progress you've made toward your application goals during this reporting period
        </p>
        
        <textarea
          value={data.progress_narrative || ''}
          onChange={(e) => fieldUpdater('progress_narrative', e.target.value)}
          disabled={isSubmitted}
          rows={8}
          maxLength={1500}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white disabled:bg-gray-50 disabled:text-gray-500"
          placeholder="Describe specific accomplishments, milestones reached, and overall progress toward your stated objectives..."
        />
        
        <div className="mt-2 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Required field - Please provide specific details about your progress
          </p>
          <p className={`text-sm ${(data.progress_narrative?.length || 0) > 1500 ? 'text-red-600' : 'text-gray-500'}`}>
            {data.progress_narrative?.length || 0}/1,500 characters
          </p>
        </div>
        
        {errors.narratives && data.progress_narrative?.length === 0 && (
          <p className="mt-1 text-sm text-red-600">Progress narrative is required</p>
        )}
      </div>

      {/* Variance Narrative */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Variance Narrative *</h3>
        <p className="text-sm text-gray-600 mb-4">
          Did anything go differently than you expected? If so, has that changed the direction of your application moving forward?
        </p>
        
        <textarea
          value={data.variance_narrative || ''}
          onChange={(e) => fieldUpdater('variance_narrative', e.target.value)}
          disabled={isSubmitted}
          rows={8}
          maxLength={1500}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white disabled:bg-gray-50 disabled:text-gray-500"
          placeholder="Describe any changes from your original plan, unexpected challenges or opportunities, and how these have affected your project direction..."
        />
        
        <div className="mt-2 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Required field - If nothing varied from plan, please indicate that
          </p>
          <p className={`text-sm ${(data.variance_narrative?.length || 0) > 1500 ? 'text-red-600' : 'text-gray-500'}`}>
            {data.variance_narrative?.length || 0}/1,500 characters
          </p>
        </div>
        
        {errors.narratives && data.variance_narrative?.length === 0 && (
          <p className="mt-1 text-sm text-red-600">Variance narrative is required</p>
        )}
      </div>

      {/* Tips for writing narratives */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Tips for Writing Effective Narratives</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Be specific about accomplishments and include measurable outcomes where possible</li>
          <li>Reference specific activities or milestones from your original application</li>
          <li>For variances, explain both the change and its impact on your project</li>
          <li>Keep your responses concise but comprehensive (max 1,500 characters each)</li>
        </ul>
      </div>
    </div>
  )
}

function ToolOverviewTab({ data, updateData, isSubmitted, errors, applicationId }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Tool & Capacity Building Report</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            This report covers your Tool Development or Capacity Building activities for January 1 - June 30, 2025.
          </p>
          <div className="mt-4">
            <h4 className="font-medium mb-2">Report Sections:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Financial Update - Report your spending and budget status</li>
              <li>Milestones - Update progress on project milestones</li>
              <li>Progress & Variance - Describe achievements and any changes</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Project Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Total Milestones</p>
            <p className="text-2xl font-bold text-gray-900">
              {(data.milestones || []).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Completed Milestones</p>
            <p className="text-2xl font-bold text-gray-900">
              {(data.milestones || []).filter((m: any) => m.status === 'complete').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToolFinancialTab({ data, updateData, isSubmitted, errors, applicationId }: any) {
  const fieldUpdater = createFieldUpdater(updateData)
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Update</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Funds Received (Current Period)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={data.funds_received_current || ''}
                onChange={(e) => fieldUpdater('funds_received_current', parseFloat(e.target.value) || 0)}
                disabled={isSubmitted}
                className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white disabled:bg-gray-50"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Funds Spent (Current Period) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={data.funds_spent_current || ''}
                onChange={(e) => fieldUpdater('funds_spent_current', parseFloat(e.target.value) || 0)}
                disabled={isSubmitted}
                className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white disabled:bg-gray-50"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            {errors.financials && (
              <p className="mt-1 text-sm text-red-600">{errors.financials}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unused Funds from Prior Year
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={data.unused_funds_from_last_year || ''}
                onChange={(e) => fieldUpdater('unused_funds_from_last_year', parseFloat(e.target.value) || 0)}
                disabled={isSubmitted}
                className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white disabled:bg-gray-50"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Financial Context (Optional)
          </label>
          <textarea
            value={data.tool_capacity_financial_context || ''}
            onChange={(e) => fieldUpdater('tool_capacity_financial_context', e.target.value)}
            disabled={isSubmitted}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Provide any context about your financial situation, budget status, or spending patterns..."
          />
        </div>
      </div>
    </div>
  )
}

function MilestonesTab({ data, updateData, isSubmitted, errors, applicationId }: any) {
  const fieldUpdater = createFieldUpdater(updateData)
  
  const addMilestone = () => {
    const newMilestone = {
      id: `new-${Date.now()}`,
      description: '',
      due_date: '',
      status: 'not_started',
      progress_update: '',
      completion_date: '',
      milestone_order: (data.milestones || []).length + 1
    }
    fieldUpdater('milestones', [...(data.milestones || []), newMilestone])
  }

  const updateMilestone = (index: number, field: string, value: any) => {
    const updatedMilestones = [...(data.milestones || [])]
    updatedMilestones[index] = { ...updatedMilestones[index], [field]: value }
    fieldUpdater('milestones', updatedMilestones)
  }

  const removeMilestone = (index: number) => {
    const updatedMilestones = (data.milestones || []).filter((_: any, i: number) => i !== index)
    fieldUpdater('milestones', updatedMilestones)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Project Milestones</h3>
          <p className="text-sm text-gray-600 mt-1">
            Track progress on your project milestones and deliverables
          </p>
        </div>
        {!isSubmitted && (
          <button
            type="button"
            onClick={addMilestone}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Milestone
          </button>
        )}
      </div>

      {(!data.milestones || data.milestones.length === 0) ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Target className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No milestones yet</h3>
          <p className="mt-1 text-sm text-gray-500">Add milestones to track your project progress</p>
          {!isSubmitted && (
            <button
              type="button"
              onClick={addMilestone}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Milestone
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {(data.milestones || []).map((milestone: any, index: number) => (
            <div key={milestone.id || index} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-lg font-medium text-gray-900">Milestone {index + 1}</h4>
                {!isSubmitted && (
                  <button
                    type="button"
                    onClick={() => removeMilestone(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Milestone Description *
                  </label>
                  <input
                    type="text"
                    value={milestone.description}
                    onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                    disabled={isSubmitted}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white disabled:bg-gray-50"
                    placeholder="Describe the milestone or deliverable"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Original Due Date
                  </label>
                  <input
                    type="date"
                    value={milestone.due_date}
                    onChange={(e) => updateMilestone(index, 'due_date', e.target.value)}
                    disabled={isSubmitted}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={milestone.status}
                    onChange={(e) => updateMilestone(index, 'status', e.target.value)}
                    disabled={isSubmitted}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white disabled:bg-gray-50"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="behind_schedule">Behind Schedule</option>
                    <option value="on_track">On Track</option>
                    <option value="ahead_of_schedule">Ahead of Schedule</option>
                    <option value="complete">Complete</option>
                  </select>
                </div>

                {milestone.status === 'complete' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Completion Date
                    </label>
                    <input
                      type="date"
                      value={milestone.completion_date}
                      onChange={(e) => updateMilestone(index, 'completion_date', e.target.value)}
                      disabled={isSubmitted}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white disabled:bg-gray-50"
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Progress Update
                  </label>
                  <textarea
                    value={milestone.progress_update}
                    onChange={(e) => updateMilestone(index, 'progress_update', e.target.value)}
                    disabled={isSubmitted}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Describe the current status and any relevant details..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ToolNarrativesTab({ data, updateData, isSubmitted, errors, applicationId }: any) {
  const fieldUpdater = createFieldUpdater(updateData)
  
  return (
    <div className="space-y-6">
      {/* Progress Narrative */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Progress Narrative *</h3>
        <p className="text-sm text-gray-600 mb-4">
          Describe the progress made on your tool development or capacity building activities
        </p>
        
        <textarea
          value={data.tool_capacity_progress_narrative || ''}
          onChange={(e) => fieldUpdater('tool_capacity_progress_narrative', e.target.value)}
          disabled={isSubmitted}
          rows={8}
          maxLength={2000}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white disabled:bg-gray-50 disabled:text-gray-500"
          placeholder="Describe key accomplishments, technical progress, user adoption, impact metrics, or capacity improvements..."
        />
        
        <div className="mt-2 flex justify-between items-center">
          <p className="text-sm text-gray-500">Required field</p>
          <p className={`text-sm ${(data.tool_capacity_progress_narrative?.length || 0) > 2000 ? 'text-red-600' : 'text-gray-500'}`}>
            {data.tool_capacity_progress_narrative?.length || 0}/2,000 characters
          </p>
        </div>
      </div>

      {/* Variance Narrative */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Variance Narrative *</h3>
        <p className="text-sm text-gray-600 mb-4">
          Describe any changes from your original plan or timeline
        </p>
        
        <textarea
          value={data.tool_capacity_variance_narrative || ''}
          onChange={(e) => fieldUpdater('tool_capacity_variance_narrative', e.target.value)}
          disabled={isSubmitted}
          rows={8}
          maxLength={2000}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white disabled:bg-gray-50 disabled:text-gray-500"
          placeholder="Describe any technical challenges, scope changes, timeline adjustments, or resource reallocations..."
        />
        
        <div className="mt-2 flex justify-between items-center">
          <p className="text-sm text-gray-500">Required field</p>
          <p className={`text-sm ${(data.tool_capacity_variance_narrative?.length || 0) > 2000 ? 'text-red-600' : 'text-gray-500'}`}>
            {data.tool_capacity_variance_narrative?.length || 0}/2,000 characters
          </p>
        </div>
      </div>
    </div>
  )
}