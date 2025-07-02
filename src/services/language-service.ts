import { LanguageData } from '@/components/language-selector'
import { loadAllAccessLanguages, searchLanguagesWithAllAccess } from '@/utils/csv-parser'

// SIL Language Data Service
// This service provides access to comprehensive language data from SIL International

export interface LanguageSearchOptions {
  query?: string
  country?: string
  region?: string
  family?: string
  status?: 'Living' | 'Extinct' | 'Nearly extinct' | 'Dormant'
  limit?: number
  includeEtenEligibleOnly?: boolean
  includeSignLanguages?: boolean
  regions?: string[]
  countries?: string[]
}

export interface CountryInfo {
  name: string
  code: string
  region: string
  languages_count: number
}

class LanguageService {
  private baseUrl: string
  private apiKey?: string
  private languageData: LanguageData[] = []
  private dataLoaded: boolean = false
  private loadingPromise: Promise<void> | null = null

  constructor() {
    // SIL Ethnologue API endpoints
    this.baseUrl = process.env.NEXT_PUBLIC_SIL_API_URL || 'https://www.ethnologue.com/api'
    this.apiKey = process.env.NEXT_PUBLIC_SIL_API_KEY
    this.loadingPromise = this.loadLanguageData()
  }

  private async loadLanguageData(): Promise<void> {
    try {
      console.info('Starting to load language data...')
      
      // Load from All Access CSV first (primary source)
      const allAccessLanguages = await loadAllAccessLanguages()
      if (allAccessLanguages.length > 0) {
        this.languageData = allAccessLanguages
        this.dataLoaded = true
        console.info(`Loaded ${allAccessLanguages.length} languages from All Access CSV`)
      } else {
        // Fallback to local JSON file
        console.warn('All Access CSV failed, trying local JSON file...')
        const baseUrl = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        const jsonUrl = `${baseUrl}/data/languages.json`
        const response = await fetch(jsonUrl)
        if (response.ok) {
          this.languageData = await response.json()
          this.dataLoaded = true
          console.info('Loaded languages from local JSON file')
        } else {
          console.warn('Local JSON file also failed')
        }
      }
      
      // Attempt to sync with SIL API if available (optional enhancement)
      this.syncWithSILAPI()
    } catch (error) {
      console.error('Failed to load language data:', error)
      this.dataLoaded = true // Set to true even on error so we don't keep waiting
    }
  }

  private async syncWithSILAPI() {
    if (!this.apiKey) {
      console.info('SIL API key not configured, using local data only')
      return
    }

    try {
      // Sync with real SIL Ethnologue API
      // Note: This requires valid API credentials from SIL International
      const response = await fetch(`${this.baseUrl}/languages`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        this.languageData = this.transformApiResponse(data)
        console.info('Successfully synced with SIL Ethnologue API')
      }
    } catch (error) {
      console.warn('Failed to sync with SIL API, using local data:', error)
    }
  }

  /**
   * Search for languages by name, code, or other criteria
   */
  async searchLanguages(options: LanguageSearchOptions = {}): Promise<LanguageData[]> {
    try {
      // Wait for data to be loaded if it hasn't been yet
      if (!this.dataLoaded && this.loadingPromise) {
        console.info('Waiting for language data to load...')
        await this.loadingPromise
      }
      
      console.info(`Searching through ${this.languageData.length} loaded languages`)
      
      // Use local All Access data with enhanced search
      let results = searchLanguagesWithAllAccess(this.languageData, options.query || '', {
        includeEtenEligibleOnly: options.includeEtenEligibleOnly,
        includeSignLanguages: options.includeSignLanguages,
        regions: options.regions,
        countries: options.countries
      })

      // Apply additional filters
      if (options.country) {
        results = results.filter(lang =>
          lang.country_primary?.toLowerCase().includes(options.country!.toLowerCase()) ||
          lang.countries.some(c => c.toLowerCase().includes(options.country!.toLowerCase()))
        )
      }

      if (options.region) {
        results = results.filter(lang =>
          lang.region?.toLowerCase().includes(options.region!.toLowerCase()) ||
          lang.continent?.toLowerCase().includes(options.region!.toLowerCase())
        )
      }

      if (options.status) {
        results = results.filter(lang => lang.status === options.status)
      }

      // Apply limit
      if (options.limit) {
        results = results.slice(0, options.limit)
      }

      return results
    } catch (error) {
      console.warn('Language search failed:', error)
      return []
    }
  }

  /**
   * Get language by Ethnologue code
   */
  async getLanguageByCode(code: string): Promise<LanguageData | null> {
    try {
      if (!this.apiKey) {
        return this.getLocalLanguageByCode(code)
      }

      const response = await fetch(`${this.baseUrl}/languages/${code}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      return this.transformSingleLanguage(data)
    } catch (error) {
      console.warn('Language API unavailable, using local data:', error)
      return this.getLocalLanguageByCode(code)
    }
  }

  /**
   * Get all countries with language information
   */
  async getCountries(): Promise<CountryInfo[]> {
    try {
      if (!this.apiKey) {
        return this.getLocalCountries()
      }

      const response = await fetch(`${this.baseUrl}/countries`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()
      return data.map((country: any) => ({
        name: country.name,
        code: country.code,
        region: country.region,
        languages_count: country.languages_count
      }))
    } catch (error) {
      console.warn('Countries API unavailable, using local data:', error)
      return this.getLocalCountries()
    }
  }

  /**
   * Validate if a language exists and get its canonical form
   */
  async validateLanguage(nameOrCode: string): Promise<LanguageData | null> {
    const languages = await this.searchLanguages({ 
      query: nameOrCode, 
      limit: 1 
    })
    return languages.length > 0 ? languages[0] : null
  }

  // Private methods for local data fallback
  private getLocalLanguageData(options: LanguageSearchOptions): LanguageData[] {
    // Extended sample data - in production this would be a comprehensive database
    const languages: LanguageData[] = [
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
      // Add more languages here...
      {
        id: 'spa',
        name: 'Spanish',
        autonym: 'Español',
        ethnologue_code: 'spa',
        iso_639_3: 'spa',
        country_primary: 'Spain',
        countries: ['Spain', 'Mexico', 'Argentina', 'Colombia', 'Peru', 'Venezuela', 'Chile'],
        region: 'Europe, Americas',
        family: 'Indo-European, Italic, Romance',
        speakers: 500000000,
        status: 'Living'
      },
      // Additional languages would be loaded from a JSON file or database
    ]

    let filtered = languages

    if (options.query) {
      const query = options.query.toLowerCase()
      filtered = filtered.filter(lang =>
        lang.name.toLowerCase().includes(query) ||
        lang.ethnologue_code.toLowerCase().includes(query) ||
        lang.autonym?.toLowerCase().includes(query) ||
        lang.countries.some(country => country.toLowerCase().includes(query))
      )
    }

    if (options.country) {
      filtered = filtered.filter(lang =>
        lang.countries.some(country => 
          country.toLowerCase().includes(options.country!.toLowerCase())
        )
      )
    }

    if (options.status) {
      filtered = filtered.filter(lang => lang.status === options.status)
    }

    if (options.limit) {
      filtered = filtered.slice(0, options.limit)
    }

    return filtered
  }

  private getLocalLanguageByCode(code: string): LanguageData | null {
    const languages = this.getLocalLanguageData({})
    return languages.find(lang => 
      lang.ethnologue_code.toLowerCase() === code.toLowerCase()
    ) || null
  }

  private getLocalCountries(): CountryInfo[] {
    return [
      { name: 'United States', code: 'US', region: 'North America', languages_count: 430 },
      { name: 'Mexico', code: 'MX', region: 'North America', languages_count: 290 },
      { name: 'Papua New Guinea', code: 'PG', region: 'Oceania', languages_count: 840 },
      { name: 'Indonesia', code: 'ID', region: 'Asia', languages_count: 710 },
      { name: 'Nigeria', code: 'NG', region: 'Africa', languages_count: 520 },
      { name: 'India', code: 'IN', region: 'Asia', languages_count: 780 },
      { name: 'Cameroon', code: 'CM', region: 'Africa', languages_count: 280 },
      { name: 'Australia', code: 'AU', region: 'Oceania', languages_count: 200 },
      { name: 'Brazil', code: 'BR', region: 'South America', languages_count: 220 },
      { name: 'Philippines', code: 'PH', region: 'Asia', languages_count: 180 }
    ]
  }

  private transformApiResponse(apiData: any): LanguageData[] {
    // Transform SIL API response to our LanguageData format
    if (!Array.isArray(apiData?.languages)) return []
    
    return apiData.languages.map((lang: any) => this.transformSingleLanguage(lang))
  }

  private transformSingleLanguage(apiLang: any): LanguageData {
    return {
      id: apiLang.id || apiLang.code,
      name: apiLang.name,
      autonym: apiLang.autonym,
      ethnologue_code: apiLang.code || apiLang.ethnologue_code,
      iso_639_3: apiLang.iso_639_3,
      country_primary: apiLang.primary_country || apiLang.countries?.[0],
      countries: apiLang.countries || [apiLang.primary_country].filter(Boolean),
      region: apiLang.region,
      family: apiLang.language_family,
      speakers: apiLang.speaker_count,
      status: apiLang.vitality || apiLang.status,
      dialects: apiLang.dialects,
      alternate_names: apiLang.alternate_names || apiLang.also_known_as
    }
  }
}

// Singleton instance
export const languageService = new LanguageService()

// Utility functions for component use
export async function searchLanguages(query: string, limit = 20): Promise<LanguageData[]> {
  return languageService.searchLanguages({ query, limit })
}

export async function getLanguageByCode(code: string): Promise<LanguageData | null> {
  return languageService.getLanguageByCode(code)
}

export async function validateLanguageInput(input: string): Promise<LanguageData | null> {
  // Try exact code match first
  let language = await getLanguageByCode(input)
  if (language) return language

  // Then try name search
  const languages = await searchLanguages(input, 1)
  return languages.length > 0 ? languages[0] : null
}

// Hook for React components
export function useLanguageSearch(query: string, enabled = true) {
  const [languages, setLanguages] = useState<LanguageData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !query.trim()) {
      setLanguages([])
      return
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true)
      setError(null)
      
      try {
        const results = await searchLanguages(query)
        setLanguages(results)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
        setLanguages([])
      } finally {
        setLoading(false)
      }
    }, 300) // Debounce search

    return () => clearTimeout(searchTimeout)
  }, [query, enabled])

  return { languages, loading, error }
}

// React imports for the hook
import { useState, useEffect } from 'react'