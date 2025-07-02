'use client'

import { useState, useCallback, useEffect } from 'react'
import { AlertCircle, Info } from 'lucide-react'
import { NonProjectAllocation, NonProjectAllocationType } from '@/types/database-v2'

interface NonProjectAllocationsFormProps {
  applicationId: string
  reportingPeriodStart: string
  reportingPeriodEnd: string
  projectAllocationsTotal: number
  initialAllocations?: NonProjectAllocation[]
  onAllocationsChange: (allocations: NonProjectAllocation[]) => void
  onValidationChange?: (isValid: boolean, errors: string[]) => void
}

interface AllocationFormData {
  id?: string
  allocation_type: NonProjectAllocationType
  amount: string
  description: string
}

const ALLOCATION_TYPES: { value: NonProjectAllocationType; label: string; description: string; maxPercentage?: number }[] = [
  {
    value: 'indirect_costs',
    label: 'Indirect Costs',
    description: 'Up to 20% of project allocations for Bible Translation expenses',
    maxPercentage: 20
  },
  {
    value: 'assessments',
    label: 'Assessments',
    description: 'Up to 15% of project allocations for administrative costs',
    maxPercentage: 15
  },
  {
    value: 'unused_funds',
    label: 'Unused Funds',
    description: 'Funds from previous periods that remain unused'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other non-project allocations'
  }
]

export default function NonProjectAllocationsForm({
  applicationId,
  reportingPeriodStart,
  reportingPeriodEnd,
  projectAllocationsTotal,
  initialAllocations = [],
  onAllocationsChange,
  onValidationChange
}: NonProjectAllocationsFormProps) {
  const [allocations, setAllocations] = useState<AllocationFormData[]>(() => {
    const safeInitialAllocations = initialAllocations || []
    const existingTypes = new Set(safeInitialAllocations.map(a => a.allocation_type))
    
    return ALLOCATION_TYPES.map(type => {
      const existing = safeInitialAllocations.find(a => a.allocation_type === type.value)
      return {
        id: existing?.id,
        allocation_type: type.value,
        amount: existing?.amount.toString() || '0',
        description: existing?.description || ''
      }
    })
  })

  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const validateAllocations = useCallback(() => {
    const errors: string[] = []
    let isValid = true

    allocations.forEach(allocation => {
      const amount = parseFloat(allocation.amount) || 0
      const typeInfo = ALLOCATION_TYPES.find(t => t.value === allocation.allocation_type)
      
      if (amount < 0) {
        errors.push(`${typeInfo?.label} amount cannot be negative`)
        isValid = false
      }

      if (typeInfo?.maxPercentage && (projectAllocationsTotal || 0) > 0) {
        const maxAllowed = (projectAllocationsTotal || 0) * (typeInfo.maxPercentage / 100)
        if (amount > maxAllowed) {
          errors.push(
            `${typeInfo.label} (${amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}) ` +
            `exceeds maximum allowed ${typeInfo.maxPercentage}% of project allocations ` +
            `(${maxAllowed.toLocaleString('en-US', { style: 'currency', currency: 'USD' })})`
          )
          isValid = false
        }
      }
    })

    setValidationErrors(errors)
    onValidationChange?.(isValid, errors)
    return isValid
  }, [allocations, projectAllocationsTotal, onValidationChange])

  const updateAllocations = useCallback((newAllocations: AllocationFormData[]) => {
    setAllocations(newAllocations)
    
    // Convert to NonProjectAllocation format, only including non-zero amounts
    const converted: NonProjectAllocation[] = newAllocations
      .filter(allocation => parseFloat(allocation.amount) > 0)
      .map(allocation => ({
        id: allocation.id || crypto.randomUUID(),
        application_id: applicationId,
        reporting_period_start: reportingPeriodStart,
        reporting_period_end: reportingPeriodEnd,
        allocation_type: allocation.allocation_type,
        amount: parseFloat(allocation.amount) || 0,
        description: allocation.description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

    onAllocationsChange(converted)
  }, [applicationId, reportingPeriodStart, reportingPeriodEnd, onAllocationsChange])

  const handleAllocationChange = (index: number, field: keyof AllocationFormData, value: string) => {
    const newAllocations = [...allocations]
    newAllocations[index][field] = value
    updateAllocations(newAllocations)
  }

  // Validate when allocations or project total changes
  useEffect(() => {
    validateAllocations()
  }, [validateAllocations])

  const totalNonProjectAllocations = allocations.reduce((sum, allocation) => 
    sum + (parseFloat(allocation.amount) || 0), 0
  )

  const getMaxAllowedAmount = (allocationType: NonProjectAllocationType): number | null => {
    const typeInfo = ALLOCATION_TYPES.find(t => t.value === allocationType)
    if (typeInfo?.maxPercentage && (projectAllocationsTotal || 0) > 0) {
      return (projectAllocationsTotal || 0) * (typeInfo.maxPercentage / 100)
    }
    return null
  }

  const getPercentageUsed = (allocationType: NonProjectAllocationType, amount: number): number | null => {
    if ((projectAllocationsTotal || 0) > 0) {
      return (amount / (projectAllocationsTotal || 0)) * 100
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Non-Project Allocations</h3>
        <div className="text-sm text-gray-600">
          Total: ${totalNonProjectAllocations.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      </div>

      {(projectAllocationsTotal || 0) === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-700">
              <p className="font-medium">Project allocations required</p>
              <p>Please add project allocations first to enable percentage-based validation for indirect costs and assessments.</p>
            </div>
          </div>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700">
              <p className="font-medium">Validation Errors:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {allocations.map((allocation, index) => {
          const typeInfo = ALLOCATION_TYPES[index]
          const amount = parseFloat(allocation.amount) || 0
          const maxAllowed = getMaxAllowedAmount(allocation.allocation_type)
          const percentageUsed = getPercentageUsed(allocation.allocation_type, amount)
          const isOverLimit = maxAllowed !== null && amount > maxAllowed

          return (
            <div key={allocation.allocation_type} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{typeInfo.label}</h4>
                  <p className="text-sm text-gray-600 mt-1">{typeInfo.description}</p>
                  
                  {maxAllowed !== null && (
                    <div className="flex items-center gap-2 mt-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-600">
                        Maximum allowed: {maxAllowed.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        {percentageUsed !== null && (
                          <span className={`ml-2 ${isOverLimit ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                            ({percentageUsed.toFixed(1)}% of project allocations)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={allocation.amount}
                    onChange={(e) => handleAllocationChange(index, 'amount', e.target.value)}
                    className={`form-input ${
                      isOverLimit
                        ? 'form-input-error'
                        : ''
                    }`}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={allocation.description}
                    onChange={(e) => handleAllocationChange(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white"
                    placeholder="Optional description"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Project Allocations Total:</span>
            <span className="font-medium">
              ${(projectAllocationsTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Non-Project Allocations Total:</span>
            <span className="font-medium">
              ${totalNonProjectAllocations.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between border-t pt-1 font-medium text-gray-900">
            <span>Grand Total:</span>
            <span>
              ${((projectAllocationsTotal || 0) + totalNonProjectAllocations).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}