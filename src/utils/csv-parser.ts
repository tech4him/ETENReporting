import { LanguageData } from '@/components/language-selector'

export interface AllAccessCSVRow {
  'Report Month': string
  'Continent': string
  'Country': string
  'Country Code': string
  'Language Name': string
  'Language Code': string
  'Is Sign Language': string
  'Is ISO Recognized': string
  'Language Population Group': string
  'First Language Population': string
  'EGIDS Group': string
  'EGIDS Level': string
  'All Access Status': string
  'All Access Population': string
  'All Access Goal': string
  'Eligible for ETEN Funding': string
  'Top 100 Progress': string
  'Top 100 Revision Status': string
  'Completed Scripture': string
  'Latest Publication Year': string
  'Chapters Completed': string
  'Text Chapters Completed': string
  'Audio Chapters Completed': string
  'Video Chapters Completed': string
  'Unknown Mode Chapters Completed': string
  'Active Translation': string
  'Active Intent': string
  'Active OBT': string
  'Access Through 2nd Language': string
  '2nd Language Scripture Level': string
  '2nd Language Scripture Pub Year': string
  'Is Protected Country': string
  'IllumiNationsRegion': string
}

export function parseCSVRow(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0
  
  while (i < line.length) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Handle escaped quotes
        current += '"'
        i += 2
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
        i++
      }
    } else if (char === ',' && !inQuotes) {
      // Found field separator
      result.push(current.trim())
      current = ''
      i++
    } else {
      current += char
      i++
    }
  }
  
  // Add the last field
  result.push(current.trim())
  
  return result
}

export function parseAllAccessCSV(csvText: string): LanguageData[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []
  
  // Parse header
  const headerLine = lines[0].replace(/^\uFEFF/, '') // Remove BOM if present
  const headers = parseCSVRow(headerLine)
  
  const languages: LanguageData[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVRow(lines[i])
    if (fields.length !== headers.length) continue
    
    // Create object from CSV row
    const row: any = {}
    headers.forEach((header, index) => {
      row[header] = fields[index]
    })
    
    // Parse language name and code from the format "Language Name [code]"
    const languageNameWithCode = row['Language Name'] || ''
    const match = languageNameWithCode.match(/^(.+?)\s*\[([^\]]+)\]$/)
    
    let languageName = languageNameWithCode
    let languageCode = row['Language Code'] || ''
    
    if (match) {
      languageName = match[1].trim()
      languageCode = match[2].trim()
    }
    
    // Parse population numbers
    const parsePopulation = (popStr: string): number | undefined => {
      if (!popStr || popStr === '0') return undefined
      const num = parseInt(popStr.replace(/,/g, ''))
      return isNaN(num) ? undefined : num
    }
    
    // Convert to LanguageData format
    const languageData: LanguageData = {
      id: languageCode,
      name: languageName,
      ethnologue_code: languageCode,
      iso_639_3: languageCode,
      country_primary: row['Country'] || '',
      countries: [row['Country']].filter(Boolean),
      region: row['Continent'] || '',
      speakers: parsePopulation(row['First Language Population']),
      
      // All Access Goal and ETEN Funding fields (the key ones we need)
      all_access_goal: row['All Access Goal'] || undefined,
      eligible_for_eten_funding: row['Eligible for ETEN Funding']?.toLowerCase() === 'yes',
      
      // Additional All Access data
      continent: row['Continent'],
      country_code: row['Country Code'],
      is_sign_language: row['Is Sign Language']?.toLowerCase() === 'yes',
      is_iso_recognized: row['Is ISO Recognized']?.toLowerCase() === 'yes',
      language_population_group: row['Language Population Group'],
      first_language_population: parsePopulation(row['First Language Population']),
      egids_group: row['EGIDS Group'],
      egids_level: row['EGIDS Level'],
      all_access_status: row['All Access Status'],
      all_access_population: row['All Access Population'],
      luminations_region: row['IllumiNationsRegion']
    }
    
    // Only add if we have valid language code and name
    if (languageCode && languageName) {
      languages.push(languageData)
    }
  }
  
  return languages
}

export async function loadAllAccessLanguages(): Promise<LanguageData[]> {
  try {
    // Load from the public/data directory
    const baseUrl = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const csvUrl = `${baseUrl}/data/all-access-languages.csv`
    
    const response = await fetch(csvUrl)
    if (!response.ok) {
      console.warn(`Failed to load CSV from ${csvUrl}: ${response.status}`)
      throw new Error(`Failed to load CSV: ${response.status}`)
    }
    
    const csvText = await response.text()
    const languages = parseAllAccessCSV(csvText)
    
    console.info(`Loaded ${languages.length} languages from All Access CSV`)
    return languages
  } catch (error) {
    console.error('Failed to load All Access CSV:', error)
    // Try alternative path
    try {
      console.info('Attempting to load from alternative path...')
      const altUrl = `${baseUrl}/All_Access_1751374938284.csv`
      const altResponse = await fetch(altUrl)
      if (altResponse.ok) {
        const csvText = await altResponse.text()
        const languages = parseAllAccessCSV(csvText)
        console.info(`Loaded ${languages.length} languages from alternative path`)
        return languages
      }
    } catch (altError) {
      console.error('Alternative path also failed:', altError)
    }
    return []
  }
}

// Utility function to search languages with All Access data
export function searchLanguagesWithAllAccess(
  languages: LanguageData[], 
  query: string, 
  options: {
    includeEtenEligibleOnly?: boolean
    includeSignLanguages?: boolean
    regions?: string[]
    countries?: string[]
  } = {}
): LanguageData[] {
  const {
    includeEtenEligibleOnly = false,
    includeSignLanguages = true,
    regions,
    countries
  } = options
  
  let filtered = languages
  
  // Filter by ETEN eligibility if requested
  if (includeEtenEligibleOnly) {
    filtered = filtered.filter(lang => lang.eligible_for_eten_funding === true)
  }
  
  // Filter by sign languages if requested
  if (!includeSignLanguages) {
    filtered = filtered.filter(lang => lang.is_sign_language !== true)
  }
  
  // Filter by regions if specified
  if (regions && regions.length > 0) {
    filtered = filtered.filter(lang => 
      regions.some(region => 
        lang.continent?.toLowerCase().includes(region.toLowerCase()) ||
        lang.luminations_region?.toLowerCase().includes(region.toLowerCase())
      )
    )
  }
  
  // Filter by countries if specified
  if (countries && countries.length > 0) {
    filtered = filtered.filter(lang =>
      countries.some(country =>
        lang.country_primary?.toLowerCase().includes(country.toLowerCase()) ||
        lang.countries.some(c => c.toLowerCase().includes(country.toLowerCase()))
      )
    )
  }
  
  // Filter by search query
  if (query.trim()) {
    const searchTerm = query.toLowerCase()
    filtered = filtered.filter(lang =>
      lang.name.toLowerCase().includes(searchTerm) ||
      lang.ethnologue_code.toLowerCase().includes(searchTerm) ||
      lang.country_primary?.toLowerCase().includes(searchTerm) ||
      lang.all_access_goal?.toLowerCase().includes(searchTerm) ||
      lang.all_access_status?.toLowerCase().includes(searchTerm)
    )
  }
  
  return filtered
}