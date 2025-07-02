'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, ChevronDown, Globe, MapPin, Users } from 'lucide-react'

export interface LanguageData {
  id: string
  name: string
  autonym?: string
  ethnologue_code: string
  iso_639_3?: string
  country_primary: string
  countries: string[]
  region?: string
  family?: string
  speakers?: number
  status?: 'Living' | 'Extinct' | 'Nearly extinct' | 'Dormant'
  dialects?: string[]
  alternate_names?: string[]
  
  // All Access Goal and ETEN Funding fields
  all_access_goal?: string
  eligible_for_eten_funding?: boolean
  
  // Additional All Access data
  continent?: string
  country_code?: string
  is_sign_language?: boolean
  is_iso_recognized?: boolean
  language_population_group?: string
  first_language_population?: number
  egids_group?: string
  egids_level?: string
  all_access_status?: string
  all_access_population?: string
  luminations_region?: string
}

interface LanguageSelectorProps {
  value?: LanguageData | null
  onChange: (language: LanguageData | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

// This will be populated from the language service
let LOADED_LANGUAGES: LanguageData[] = []

// Load languages on component initialization
import { searchLanguages } from '@/services/language-service'

// Sample languages for immediate display while real data loads
const SAMPLE_LANGUAGES: LanguageData[] = [
  {
    id: 'eng',
    name: 'English',
    ethnologue_code: 'eng',
    iso_639_3: 'eng',
    country_primary: 'United States',
    countries: ['United States', 'United Kingdom', 'Canada', 'Australia', 'New Zealand', 'South Africa'],
    region: 'Global',
    family: 'Indo-European, Germanic, West, English',
    speakers: 1500000000,
    status: 'Living',
    dialects: ['American English', 'British English', 'Australian English', 'Canadian English'],
    alternate_names: ['Modern English']
  },
  {
    id: 'spa',
    name: 'Spanish',
    autonym: 'Español',
    ethnologue_code: 'spa',
    iso_639_3: 'spa',
    country_primary: 'Spain',
    countries: ['Spain', 'Mexico', 'Argentina', 'Colombia', 'Peru', 'Venezuela', 'Chile', 'Ecuador', 'Guatemala', 'Cuba', 'Bolivia', 'Honduras', 'Paraguay', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama', 'Uruguay', 'Dominican Republic'],
    region: 'Europe, Americas',
    family: 'Indo-European, Italic, Romance, Italo-Western, Western, Gallo-Iberian, Ibero-Romance, West Iberian, Castilian',
    speakers: 500000000,
    status: 'Living',
    dialects: ['Castilian Spanish', 'Mexican Spanish', 'Argentinian Spanish', 'Colombian Spanish'],
    alternate_names: ['Castilian', 'Castellano']
  }
]

export default function LanguageSelector({
  value,
  onChange,
  placeholder = "Search for a language...",
  disabled = false,
  className = ""
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [allLanguages, setAllLanguages] = useState<LanguageData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load all languages on component mount
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        setIsLoading(true)
        console.log('Starting to load languages...')
        
        // Try to get languages directly from the language service
        const languages = await searchLanguages('', 10000) // Load up to 10,000 languages
        console.log(`Search returned ${languages.length} languages`)
        
        if (languages.length > 0) {
          setAllLanguages(languages)
          LOADED_LANGUAGES = languages
          console.log(`Successfully loaded ${languages.length} languages`)
        } else {
          // Fallback to sample languages if service fails
          console.warn('No languages returned from service, using sample languages as fallback')
          setAllLanguages(SAMPLE_LANGUAGES)
        }
      } catch (error) {
        console.error('Failed to load languages:', error)
        setAllLanguages(SAMPLE_LANGUAGES)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadLanguages()
  }, [])

  // Filter languages based on search term
  const filteredLanguages = useMemo(() => {
    const languagesToSearch = allLanguages.length > 0 ? allLanguages : SAMPLE_LANGUAGES
    
    if (!searchTerm.trim()) {
      // Show first 20 languages when no search term
      return languagesToSearch.slice(0, 20)
    }
    
    const term = searchTerm.toLowerCase()
    return languagesToSearch.filter(lang => 
      lang.name.toLowerCase().includes(term) ||
      lang.ethnologue_code.toLowerCase().includes(term) ||
      lang.autonym?.toLowerCase().includes(term) ||
      lang.alternate_names?.some(alt => alt.toLowerCase().includes(term)) ||
      lang.countries.some(country => country.toLowerCase().includes(term)) ||
      lang.all_access_goal?.toLowerCase().includes(term) ||
      lang.country_primary?.toLowerCase().includes(term)
    ).slice(0, 100) // Limit results to 100 for performance
  }, [searchTerm, allLanguages])

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredLanguages.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredLanguages.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredLanguages.length) {
          selectLanguage(filteredLanguages[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const selectLanguage = (language: LanguageData) => {
    onChange(language)
    setIsOpen(false)
    setSearchTerm('')
    setHighlightedIndex(-1)
  }

  const clearSelection = () => {
    onChange(null)
    setSearchTerm('')
    inputRef.current?.focus()
  }

  const formatSpeakers = (speakers?: number) => {
    if (!speakers) return 'Unknown'
    if (speakers >= 1000000) {
      return `${(speakers / 1000000).toFixed(1)}M speakers`
    } else if (speakers >= 1000) {
      return `${(speakers / 1000).toFixed(0)}K speakers`
    }
    return `${speakers} speakers`
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value ? `${value.name} (${value.ethnologue_code})` : searchTerm}
          onChange={(e) => {
            if (!value) {
              setSearchTerm(e.target.value)
              setIsOpen(true)
            }
          }}
          onFocus={() => {
            if (!value) {
              setIsOpen(true)
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60 disabled:bg-gray-50 text-gray-900 placeholder-gray-500 bg-white ${value ? 'bg-blue-50 border-blue-300' : ''}`}
          readOnly={!!value}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {value ? (
            <button
              onClick={clearSelection}
              disabled={disabled}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              type="button"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center space-x-1">
              <Search className="h-4 w-4 text-gray-400" />
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          )}
        </div>
      </div>

      {/* Selected Language Info */}
      {value && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {value.name}
                  {value.autonym && value.autonym !== value.name && (
                    <span className="ml-2 text-blue-700">({value.autonym})</span>
                  )}
                </span>
                {value.eligible_for_eten_funding && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ETEN Eligible
                  </span>
                )}
              </div>
              <div className="mt-1 space-y-1 text-sm text-blue-700">
                <div className="flex items-center space-x-1">
                  <span className="font-medium">Code:</span>
                  <span>{value.ethnologue_code.toUpperCase()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>{value.country_primary}</span>
                  {value.countries.length > 1 && (
                    <span className="text-blue-600">+{value.countries.length - 1} more</span>
                  )}
                </div>
                {value.speakers && (
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{formatSpeakers(value.speakers)}</span>
                  </div>
                )}
                {value.all_access_goal && (
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">All Access Goal:</span>
                    <span className="text-blue-800">{value.all_access_goal}</span>
                  </div>
                )}
                {value.all_access_status && (
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">All Access Status:</span>
                    <span className="text-blue-800">{value.all_access_status}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !value && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
              Loading languages...
            </div>
          ) : filteredLanguages.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No languages found for "{searchTerm}"
            </div>
          ) : (
            <div>
              {searchTerm.trim() === '' && allLanguages.length > 0 && (
                <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                  Showing {filteredLanguages.length} of {allLanguages.length} languages. Type to search...
                </div>
              )}
              <div className="py-1">
                {filteredLanguages.map((language, index) => (
                  <div
                    key={language.id}
                    onClick={() => selectLanguage(language)}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-100 ${index === highlightedIndex ? 'bg-blue-100' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            {language.name}
                            {language.autonym && language.autonym !== language.name && (
                              <span className="ml-2 text-gray-600">({language.autonym})</span>
                            )}
                          </span>
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            {language.ethnologue_code.toUpperCase()}
                          </span>
                          {language.eligible_for_eten_funding && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              ETEN
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{language.country_primary}</span>
                          </div>
                          {language.speakers && (
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{formatSpeakers(language.speakers)}</span>
                            </div>
                          )}
                          {language.all_access_goal && (
                            <div className="flex items-center space-x-1">
                              <span className="text-purple-600 font-medium">{language.all_access_goal}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}