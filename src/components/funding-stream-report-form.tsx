'use client'

import { useState, useCallback, useEffect } from 'react'
import { Save, AlertCircle, CheckCircle, Download } from 'lucide-react'
import { ProjectAllocationWithPartners, NonProjectAllocation, FundingStream, Application } from '@/types/database-v2'
import ProjectAllocationsForm from './project-allocations-form'
import NonProjectAllocationsForm from './non-project-allocations-form'

interface FundingStreamReportFormProps {
  application: Application
  reportingPeriodStart: string
  reportingPeriodEnd: string
  fundsReceived: number
  initialProjectAllocations?: ProjectAllocationWithPartners[]
  initialNonProjectAllocations?: NonProjectAllocation[]
  onSave: (data: {
    projectAllocations: ProjectAllocationWithPartners[]
    nonProjectAllocations: NonProjectAllocation[]
  }) => Promise<void>
  onExport?: () => void
}

export default function FundingStreamReportForm({
  application,
  reportingPeriodStart,
  reportingPeriodEnd,
  fundsReceived,
  initialProjectAllocations = [],
  initialNonProjectAllocations = [],
  onSave,
  onExport
}: FundingStreamReportFormProps) {
  const [projectAllocations, setProjectAllocations] = useState<ProjectAllocationWithPartners[]>(initialProjectAllocations)
  const [nonProjectAllocations, setNonProjectAllocations] = useState<NonProjectAllocation[]>(initialNonProjectAllocations)
  
  const [projectAllocationsValid, setProjectAllocationsValid] = useState(false)
  const [nonProjectAllocationsValid, setNonProjectAllocationsValid] = useState(true)
  const [nonProjectValidationErrors, setNonProjectValidationErrors] = useState<string[]>([])
  
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Calculate totals
  const projectAllocationsTotal = projectAllocations.reduce((sum, allocation) => sum + allocation.amount_allocated, 0)
  const nonProjectAllocationsTotal = nonProjectAllocations.reduce((sum, allocation) => sum + allocation.amount, 0)
  const grandTotal = projectAllocationsTotal + nonProjectAllocationsTotal
  const variance = fundsReceived - grandTotal
  const isBalanced = Math.abs(variance) < 0.01 // Allow 1 cent tolerance

  // Form validation
  const isFormValid = projectAllocationsValid && nonProjectAllocationsValid && isBalanced

  // Track changes
  useEffect(() => {
    setHasChanges(true)
  }, [projectAllocations, nonProjectAllocations])

  const handleSave = async () => {
    if (!isFormValid) return

    setIsSaving(true)
    try {
      await onSave({
        projectAllocations,
        nonProjectAllocations
      })
      setHasChanges(false)
      setLastSaved(new Date())
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const getFundingStreamDisplayName = (fundingStream: string | null): string => {
    switch (fundingStream) {
      case 'ETEN Translation Project':
        return 'ETEN Translation Project Funding'
      case 'illumiNations Undesignated':
        return 'illumiNations Undesignated Funding'
      default:
        return 'Translation Investment Funding'
    }
  }

  const getReportingPeriodDisplay = () => {
    const start = new Date(reportingPeriodStart).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    const end = new Date(reportingPeriodEnd).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    return `${start} - ${end}`
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getFundingStreamDisplayName(application.funding_stream)}
            </h1>
            <p className="text-gray-600 mt-1">
              {application.title} - {getReportingPeriodDisplay()}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>Organization: {/* Would need to load organization name */}</span>
              {lastSaved && (
                <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            {onExport && (
              <button
                onClick={onExport}
                className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2 inline" />
                Export CSV
              </button>
            )}
            
            <button
              onClick={handleSave}
              disabled={!isFormValid || isSaving || !hasChanges}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 mr-2 inline-block border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2 inline" />
                  Save Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Validation Status */}
      <div className="space-y-3">
        {!isBalanced && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium">Total Mismatch</p>
                <p>
                  Total allocations ({grandTotal.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}) 
                  {variance > 0 ? ' are less than' : ' exceed'} funds received 
                  ({fundsReceived.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}) 
                  by {Math.abs(variance).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </p>
              </div>
            </div>
          </div>
        )}

        {nonProjectValidationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-medium">Validation Errors</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {nonProjectValidationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {isFormValid && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-700">
                <p className="font-medium">Report is valid and ready to save</p>
                <p>Total allocations match funds received exactly.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Project Allocations Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <ProjectAllocationsForm
          applicationId={application.id}
          reportingPeriodStart={reportingPeriodStart}
          reportingPeriodEnd={reportingPeriodEnd}
          initialAllocations={initialProjectAllocations}
          onAllocationsChange={setProjectAllocations}
          onValidationChange={setProjectAllocationsValid}
        />
      </div>

      {/* Non-Project Allocations Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <NonProjectAllocationsForm
          applicationId={application.id}
          reportingPeriodStart={reportingPeriodStart}
          reportingPeriodEnd={reportingPeriodEnd}
          projectAllocationsTotal={projectAllocationsTotal}
          initialAllocations={initialNonProjectAllocations}
          onAllocationsChange={setNonProjectAllocations}
          onValidationChange={(isValid, errors) => {
            setNonProjectAllocationsValid(isValid)
            setNonProjectValidationErrors(errors)
          }}
        />
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Report Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Financial Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Funds Received:</span>
                <span className="font-medium">
                  {fundsReceived.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Project Allocations (Row 51):</span>
                <span className="font-medium">
                  {projectAllocationsTotal.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Other Allocations (Row 62):</span>
                <span className="font-medium">
                  {nonProjectAllocationsTotal.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total Funding Reported (Row 64):</span>
                <span className={isBalanced ? 'text-green-600' : 'text-red-600'}>
                  {grandTotal.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>
              </div>
              {!isBalanced && (
                <div className="flex justify-between text-red-600 font-medium">
                  <span>Variance:</span>
                  <span>
                    {variance > 0 ? '+' : ''}{variance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Project Count</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Projects:</span>
                <span className="font-medium">{projectAllocations.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average per Project:</span>
                <span className="font-medium">
                  {projectAllocations.length > 0 
                    ? (projectAllocationsTotal / projectAllocations.length).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                    : '$0.00'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}