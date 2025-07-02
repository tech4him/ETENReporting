/**
 * Centralized call type color system for consistency across the application
 */
export function getCallTypeColor(callType: string): string {
  switch (callType) {
    case 'Translation Tool':
    case 'Translation Tools':
      return 'bg-slate-600 text-white'
    case 'Translation Investment':
      return 'bg-purple-600 text-white'
    case 'Organizational Development':
      return 'bg-emerald-600 text-white'
    case 'Quality Assurance':
    case 'Capacity Building - Quality Assurance':
      return 'bg-amber-600 text-white'
    case 'Capacity Building':
      return 'bg-indigo-600 text-white'
    case 'illumiNations Undesignated':
      return 'bg-teal-600 text-white'
    case 'Other':
    default:
      return 'bg-gray-600 text-white'
  }
}

/**
 * Get call type color variants for different use cases
 */
export function getCallTypeColorVariant(callType: string, variant: 'solid' | 'light' = 'solid'): string {
  const baseColors = {
    'Translation Tool': { solid: 'bg-slate-600 text-white', light: 'bg-slate-100 text-slate-800' },
    'Translation Tools': { solid: 'bg-slate-600 text-white', light: 'bg-slate-100 text-slate-800' },
    'Translation Investment': { solid: 'bg-purple-600 text-white', light: 'bg-purple-100 text-purple-800' },
    'Organizational Development': { solid: 'bg-emerald-600 text-white', light: 'bg-emerald-100 text-emerald-800' },
    'Quality Assurance': { solid: 'bg-amber-600 text-white', light: 'bg-amber-100 text-amber-800' },
    'Capacity Building - Quality Assurance': { solid: 'bg-amber-600 text-white', light: 'bg-amber-100 text-amber-800' },
    'Capacity Building': { solid: 'bg-indigo-600 text-white', light: 'bg-indigo-100 text-indigo-800' },
    'illumiNations Undesignated': { solid: 'bg-teal-600 text-white', light: 'bg-teal-100 text-teal-800' },
  }

  const colorConfig = baseColors[callType as keyof typeof baseColors]
  return colorConfig ? colorConfig[variant] : 'bg-gray-600 text-white'
}