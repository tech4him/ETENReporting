'use client'

import { useState, useCallback } from 'react'
import { Plus, Trash2, Users } from 'lucide-react'
import { ProjectAllocation, ProjectAllocationPartner, ProjectAllocationWithPartners } from '@/types/database-v2'
import LanguageSelector, { LanguageData } from './language-selector'

interface ProjectAllocationsFormProps {
  applicationId: string
  reportingPeriodStart: string
  reportingPeriodEnd: string
  initialAllocations?: ProjectAllocationWithPartners[]
  onAllocationsChange: (allocations: ProjectAllocationWithPartners[]) => void
  onValidationChange?: (isValid: boolean) => void
}

interface AllocationFormData {
  id?: string
  language_data: LanguageData | null
  language_name: string
  ethnologue_code: string
  country: string
  dialect_rolv_number: string
  amount_allocated: string
  partners: string[]
}

export default function ProjectAllocationsForm({
  applicationId,
  reportingPeriodStart,
  reportingPeriodEnd,
  initialAllocations = [],
  onAllocationsChange,
  onValidationChange
}: ProjectAllocationsFormProps) {
  const [allocations, setAllocations] = useState<AllocationFormData[]>(() => 
    initialAllocations.length > 0 
      ? initialAllocations.map(allocation => ({
          id: allocation.id,
          language_data: null, // Will be populated from API if needed
          language_name: allocation.language_name,
          ethnologue_code: allocation.ethnologue_code,
          country: allocation.country,
          dialect_rolv_number: allocation.dialect_rolv_number || '',
          amount_allocated: allocation.amount_allocated.toString(),
          partners: allocation.partners.map(p => p.partner_organization_name)
        }))
      : [createEmptyAllocation()]
  )

  function createEmptyAllocation(): AllocationFormData {
    return {
      language_data: null,
      language_name: '',
      ethnologue_code: '',
      country: '',
      dialect_rolv_number: '',
      amount_allocated: '0',
      partners: ['']
    }
  }

  const validateForm = useCallback(() => {
    const isValid = allocations.every(allocation => 
      allocation.language_name.trim() !== '' &&
      allocation.ethnologue_code.trim() !== '' &&
      allocation.country.trim() !== '' &&
      !isNaN(parseFloat(allocation.amount_allocated)) &&
      parseFloat(allocation.amount_allocated) >= 0 &&
      allocation.partners.some(partner => partner.trim() !== '')
    )
    onValidationChange?.(isValid)
    return isValid
  }, [allocations, onValidationChange])

  const updateAllocations = useCallback((newAllocations: AllocationFormData[]) => {
    setAllocations(newAllocations)
    
    // Convert to ProjectAllocationWithPartners format
    const converted: ProjectAllocationWithPartners[] = newAllocations
      .filter(allocation => 
        allocation.language_name.trim() !== '' ||
        allocation.ethnologue_code.trim() !== '' ||
        allocation.country.trim() !== '' ||
        parseFloat(allocation.amount_allocated) > 0
      )
      .map(allocation => ({
        id: allocation.id || crypto.randomUUID(),
        application_id: applicationId,
        reporting_period_start: reportingPeriodStart,
        reporting_period_end: reportingPeriodEnd,
        language_name: allocation.language_name,
        ethnologue_code: allocation.ethnologue_code,
        country: allocation.country,
        dialect_rolv_number: allocation.dialect_rolv_number || null,
        amount_allocated: parseFloat(allocation.amount_allocated) || 0,
        
        // All Access Goal and ETEN funding fields
        all_access_goal: allocation.language_data?.all_access_goal || null,
        eligible_for_eten_funding: allocation.language_data?.eligible_for_eten_funding || false,
        all_access_status: allocation.language_data?.all_access_status || null,
        language_population_group: allocation.language_data?.language_population_group || null,
        first_language_population: allocation.language_data?.first_language_population || null,
        egids_level: allocation.language_data?.egids_level || null,
        is_sign_language: allocation.language_data?.is_sign_language || false,
        luminations_region: allocation.language_data?.luminations_region || null,
        
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        partners: allocation.partners
          .filter(partner => partner.trim() !== '')
          .map(partner => ({
            id: crypto.randomUUID(),
            project_allocation_id: allocation.id || crypto.randomUUID(),
            partner_organization_name: partner,
            created_at: new Date().toISOString()
          }))
      }))

    onAllocationsChange(converted)
    validateForm()
  }, [applicationId, reportingPeriodStart, reportingPeriodEnd, onAllocationsChange, validateForm])

  const handleAllocationChange = (index: number, field: keyof AllocationFormData, value: string | string[]) => {
    const newAllocations = [...allocations]
    if (field === 'partners') {
      newAllocations[index][field] = value as string[]
    } else {
      newAllocations[index][field] = value as string
    }
    updateAllocations(newAllocations)
  }

  const handleLanguageSelect = (index: number, languageData: LanguageData | null) => {
    const newAllocations = [...allocations]
    newAllocations[index].language_data = languageData
    
    if (languageData) {
      // Auto-populate fields from SIL data
      newAllocations[index].language_name = languageData.name
      newAllocations[index].ethnologue_code = languageData.ethnologue_code
      newAllocations[index].country = languageData.country_primary
    } else {
      // Clear fields when no language selected
      newAllocations[index].language_name = ''
      newAllocations[index].ethnologue_code = ''
      newAllocations[index].country = ''
    }
    
    updateAllocations(newAllocations)
  }

  const addAllocation = () => {
    updateAllocations([...allocations, createEmptyAllocation()])
  }

  const removeAllocation = (index: number) => {
    if (allocations.length > 1) {
      const newAllocations = allocations.filter((_, i) => i !== index)
      updateAllocations(newAllocations)
    }
  }

  const addPartner = (allocationIndex: number) => {
    const newAllocations = [...allocations]
    newAllocations[allocationIndex].partners.push('')
    updateAllocations(newAllocations)
  }

  const removePartner = (allocationIndex: number, partnerIndex: number) => {
    const newAllocations = [...allocations]
    if (newAllocations[allocationIndex].partners.length > 1) {
      newAllocations[allocationIndex].partners.splice(partnerIndex, 1)
      updateAllocations(newAllocations)
    }
  }

  const handlePartnerChange = (allocationIndex: number, partnerIndex: number, value: string) => {
    const newAllocations = [...allocations]
    newAllocations[allocationIndex].partners[partnerIndex] = value
    updateAllocations(newAllocations)
  }

  const totalAllocated = allocations.reduce((sum, allocation) => 
    sum + (parseFloat(allocation.amount_allocated) || 0), 0
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Project Allocations</h3>
        <div className="text-sm text-gray-600">
          Total: ${totalAllocated.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      </div>

      <div className="space-y-4">
        {allocations.map((allocation, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Project {index + 1}</h4>
              {allocations.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAllocation(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language Selection *
                </label>
                <LanguageSelector
                  value={allocation.language_data}
                  onChange={(languageData) => handleLanguageSelect(index, languageData)}
                  placeholder="Search for a language by name or code..."
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Select a language from the SIL Ethnologue database to auto-populate details
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dialect/ROLV Number
                </label>
                <input
                  type="text"
                  value={allocation.dialect_rolv_number}
                  onChange={(e) => handleAllocationChange(index, 'dialect_rolv_number', e.target.value)}
                  className="form-input"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Allocated *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={allocation.amount_allocated}
                  onChange={(e) => handleAllocationChange(index, 'amount_allocated', e.target.value)}
                  className="form-input"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Show auto-populated language details */}
            {allocation.language_data && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Auto-populated Language Details</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Language Name:</span>
                    <p className="text-gray-900">{allocation.language_data.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Ethnologue Code:</span>
                    <p className="text-gray-900 uppercase">{allocation.language_data.ethnologue_code}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Primary Country:</span>
                    <p className="text-gray-900">{allocation.language_data.country_primary}</p>
                  </div>
                  {allocation.language_data.speakers && (
                    <div>
                      <span className="font-medium text-gray-600">Speakers:</span>
                      <p className="text-gray-900">
                        {allocation.language_data.speakers >= 1000000 
                          ? `${(allocation.language_data.speakers / 1000000).toFixed(1)}M`
                          : allocation.language_data.speakers >= 1000
                          ? `${(allocation.language_data.speakers / 1000).toFixed(0)}K`
                          : allocation.language_data.speakers.toLocaleString()
                        }
                      </p>
                    </div>
                  )}
                  {allocation.language_data.family && (
                    <div>
                      <span className="font-medium text-gray-600">Language Family:</span>
                      <p className="text-gray-900 text-xs">{allocation.language_data.family}</p>
                    </div>
                  )}
                  {allocation.language_data.countries.length > 1 && (
                    <div>
                      <span className="font-medium text-gray-600">Other Countries:</span>
                      <p className="text-gray-900 text-xs">
                        {allocation.language_data.countries
                          .filter(c => c !== allocation.language_data?.country_primary)
                          .slice(0, 3)
                          .join(', ')}
                        {allocation.language_data.countries.length > 4 && 
                          ` +${allocation.language_data.countries.length - 4} more`
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Users className="w-4 h-4 inline mr-1" />
                  ETEN Implementing Partners *
                </label>
                <button
                  type="button"
                  onClick={() => addPartner(index)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Partner
                </button>
              </div>
              
              <div className="space-y-2">
                {allocation.partners.map((partner, partnerIndex) => (
                  <div key={partnerIndex} className="flex gap-2">
                    <input
                      type="text"
                      value={partner}
                      onChange={(e) => handlePartnerChange(index, partnerIndex, e.target.value)}
                      className="form-input flex-1"
                      placeholder="Enter partner organization name"
                    />
                    {allocation.partners.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePartner(index, partnerIndex)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addAllocation}
        className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        <Plus className="w-4 h-4 inline mr-2" />
        Add Another Project Allocation
      </button>
    </div>
  )
}