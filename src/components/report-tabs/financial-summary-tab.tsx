'use client'

import { createFieldUpdater } from '@/hooks/useAutoSave'
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react'

interface FinancialSummaryTabProps {
  data: {
    current_funds_spent?: number
    financial_summary_narrative?: string
  }
  updateData: (updates: any) => void
  isSubmitted: boolean
  errors: Record<string, string>
  preloadedFinancials?: {
    funds_received?: number
    funds_prior_year?: number
    total_awarded?: number
  }
}

function CurrencyInput({
  value,
  onChange,
  disabled,
  placeholder,
  className = '',
  required = false
}: {
  value: number | string
  onChange: (value: number) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  required?: boolean
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFloat(e.target.value) || 0
    onChange(numValue)
  }

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="text-gray-500 sm:text-sm">$</span>
      </div>
      <input
        type="number"
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`
          block w-full pl-7 pr-12 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 
          text-gray-900 placeholder-gray-500 bg-white disabled:bg-gray-50 disabled:opacity-60
          ${className}
        `}
        min="0"
        step="0.01"
        required={required}
      />
    </div>
  )
}

export default function FinancialSummaryTab({
  data,
  updateData,
  isSubmitted,
  errors,
  preloadedFinancials = {}
}: FinancialSummaryTabProps) {
  const updateCurrentFundsSpent = createFieldUpdater(updateData, 'current_funds_spent')
  const updateFinancialNarrative = createFieldUpdater(updateData, 'financial_summary_narrative')

  const currentFundsSpent = data.current_funds_spent || 0
  const financialNarrative = data.financial_summary_narrative || ''
  
  const fundsReceived = preloadedFinancials.funds_received || 0
  const fundsPriorYear = preloadedFinancials.funds_prior_year || 0
  const totalAwarded = preloadedFinancials.total_awarded || 0
  
  const totalAvailable = fundsReceived + fundsPriorYear
  const remainingFunds = totalAvailable - currentFundsSpent
  const spentPercentage = totalAvailable > 0 ? (currentFundsSpent / totalAvailable) * 100 : 0

  return (
    <div className="space-y-8">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ETEN Investment Received */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-sm font-medium text-gray-600 mb-2">ETEN Investment Received</p>
          <p className="text-2xl font-bold text-green-600">
            ${fundsReceived.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Jan 1 - June 30, 2025</p>
        </div>

        {/* Prior Year Funds */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-sm font-medium text-gray-600 mb-2">Prior Year Funds</p>
          <p className="text-2xl font-bold text-blue-600">
            ${fundsPriorYear.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Carried forward</p>
        </div>

        {/* Current Funds Spent */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-4">
            <DollarSign className="h-6 w-6 text-orange-600" />
          </div>
          <p className="text-sm font-medium text-gray-600 mb-2">Current Fiscal Year Funds Spent *</p>
          <div className="text-2xl font-bold text-orange-600">
            <CurrencyInput
              value={currentFundsSpent}
              onChange={updateCurrentFundsSpent}
              disabled={isSubmitted}
              placeholder="0"
              className="text-center border-none bg-orange-50 text-2xl font-bold text-orange-600 placeholder-orange-400"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Required input</p>
        </div>
      </div>

      {/* Financial Analysis */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Financial Analysis</h3>
          <p className="text-sm text-gray-600 mt-1">
            Overview of your funding utilization and remaining balance
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Utilization Summary */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Utilization Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Available Funds:</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${totalAvailable.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Funds Spent:</span>
                  <span className="text-sm font-medium text-orange-600">
                    ${currentFundsSpent.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-sm font-medium text-gray-900">Remaining Balance:</span>
                  <span className={`text-sm font-bold ${remainingFunds >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${remainingFunds.toLocaleString()}
                  </span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Utilization Rate</span>
                  <span>{spentPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      spentPercentage > 100 ? 'bg-red-500' : 
                      spentPercentage > 80 ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Spending Alerts */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Status Indicators</h4>
              {remainingFunds < 0 && (
                <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Overspending Alert</p>
                    <p className="text-sm text-red-700">
                      You have exceeded your available funds by ${Math.abs(remainingFunds).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              
              {spentPercentage > 80 && remainingFunds >= 0 && (
                <div className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">High Utilization</p>
                    <p className="text-sm text-yellow-700">
                      You have used {spentPercentage.toFixed(1)}% of your available funds
                    </p>
                  </div>
                </div>
              )}

              {spentPercentage <= 50 && (
                <div className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <TrendingUp className="h-5 w-5 text-blue-400 mt-0.5 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Conservative Spending</p>
                    <p className="text-sm text-blue-700">
                      Consider increasing project activity if behind schedule
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Context Narrative */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Financial Summary & Context</h3>
          <p className="text-sm text-gray-600 mt-1">
            Provide additional context about your financial situation (optional)
          </p>
        </div>
        <div className="p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Financial Context
            </label>
            <textarea
              value={financialNarrative}
              onChange={(e) => updateFinancialNarrative(e.target.value)}
              disabled={isSubmitted}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 bg-white disabled:bg-gray-50 disabled:opacity-60"
              placeholder="Provide context about your financial situation, any variances from budget, efficiency improvements, cost-saving measures, or other relevant financial information..."
            />
            <p className="text-sm text-gray-500 mt-2">
              Optional field - use this space to explain any financial variances, efficiency improvements, or other relevant context
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}