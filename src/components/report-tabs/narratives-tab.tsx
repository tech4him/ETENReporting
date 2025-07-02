'use client'

import { createFieldUpdater } from '@/hooks/useAutoSave'

interface NarrativesTabProps {
  data: {
    progress_narrative?: string
    variance_narrative?: string
  }
  updateData: (updates: any) => void
  isSubmitted: boolean
  errors: Record<string, string>
}

function CharacterCounter({ 
  current, 
  max, 
  className = '' 
}: { 
  current: number
  max: number
  className?: string 
}) {
  const remaining = max - current
  const isOverLimit = current > max
  const isNearLimit = current > max * 0.9
  
  return (
    <div className={`text-sm ${
      isOverLimit ? 'text-red-600' : 
      isNearLimit ? 'text-yellow-600' : 
      'text-gray-500'
    } ${className}`}>
      {current.toLocaleString()}/{max.toLocaleString()} characters 
      <span className={`ml-1 ${isOverLimit ? 'text-red-600 font-medium' : ''}`}>
        ({remaining >= 0 ? `${remaining.toLocaleString()} remaining` : `${Math.abs(remaining).toLocaleString()} over limit`})
      </span>
    </div>
  )
}

export default function NarrativesTab({
  data,
  updateData,
  isSubmitted,
  errors
}: NarrativesTabProps) {
  const updateProgressNarrative = createFieldUpdater(updateData, 'progress_narrative')
  const updateVarianceNarrative = createFieldUpdater(updateData, 'variance_narrative')

  const progressNarrative = data.progress_narrative || ''
  const varianceNarrative = data.variance_narrative || ''

  return (
    <div className="space-y-8">
      {/* Progress Narrative */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Progress Narrative</h3>
          <p className="text-sm text-gray-600 mt-1">
            Describe the progress you've made toward your application goals during this reporting period
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                2. Describe progress made toward your goals? *
              </label>
              <textarea
                value={progressNarrative}
                onChange={(e) => updateProgressNarrative(e.target.value)}
                disabled={isSubmitted}
                rows={8}
                maxLength={1500}
                className={`
                  w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 
                  text-gray-900 placeholder-gray-500 bg-white disabled:bg-gray-50 disabled:opacity-60
                  ${progressNarrative.length > 1500 ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}
                `}
                placeholder="Describe the progress you've made toward your application goals during the first half of 2025. Include specific achievements, milestones reached, and outcomes accomplished. Be specific about what you have completed and how it contributes to your overall project objectives."
              />
              <div className="mt-2 flex justify-between items-center">
                <p className="text-sm text-gray-500">Required field</p>
                <CharacterCounter current={progressNarrative.length} max={1500} />
              </div>
            </div>

            {progressNarrative.length > 1500 && (
              <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">
                    Progress narrative exceeds the 1,500 character limit. Please shorten your response.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Variance Narrative */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Variance Narrative</h3>
          <p className="text-sm text-gray-600 mt-1">
            Explain any unexpected developments and how they have affected your project direction
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                3. Did anything go differently than you expected? If so, has that changed the direction of your project moving forward? *
              </label>
              <textarea
                value={varianceNarrative}
                onChange={(e) => updateVarianceNarrative(e.target.value)}
                disabled={isSubmitted}
                rows={8}
                maxLength={1500}
                className={`
                  w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 
                  text-gray-900 placeholder-gray-500 bg-white disabled:bg-gray-50 disabled:opacity-60
                  ${varianceNarrative.length > 1500 ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}
                `}
                placeholder="Did anything go differently than you expected? If so, has that changed the direction of your project moving forward? Include any challenges faced, changes in scope, delays, or unexpected opportunities. Explain how you have adapted your approach and what adjustments you've made to your timeline or methodology."
              />
              <div className="mt-2 flex justify-between items-center">
                <p className="text-sm text-gray-500">Required field</p>
                <CharacterCounter current={varianceNarrative.length} max={1500} />
              </div>
            </div>

            {varianceNarrative.length > 1500 && (
              <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">
                    Variance narrative exceeds the 1,500 character limit. Please shorten your response.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submission Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Writing Guidelines</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Be specific and provide concrete examples of your progress</li>
                <li>Focus on outcomes and measurable achievements</li>
                <li>Explain how any changes align with your overall objectives</li>
                <li>Use clear, professional language appropriate for stakeholder review</li>
                <li>Both narratives are required and limited to 1,500 characters each</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}