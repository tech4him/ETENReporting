# SIL Ethnologue Integration Guide

## Overview

This document describes the integration with SIL International's Ethnologue database for accurate language data in the ETEN Reporting system. The Ethnologue is the world's most comprehensive reference for language information and is the authoritative source used by linguists, translators, and Bible translation organizations globally.

## SIL Ethnologue Database

The Ethnologue (https://www.ethnologue.com) contains data on over 7,000 languages worldwide, including:

- **Language Identification**: Official language codes (ISO 639-3)
- **Geographic Distribution**: Countries and regions where languages are spoken
- **Speaker Populations**: Current estimates of native and total speakers
- **Language Classification**: Detailed family trees and genetic relationships
- **Vitality Status**: Living, Extinct, Nearly Extinct, Dormant classifications
- **Dialects and Variants**: Regional and social variants
- **Writing Systems**: Scripts and orthographies used

## Integration Architecture

### Current Implementation

The system uses a multi-tier approach for language data:

1. **Local Language Database** (`/public/data/languages.json`)
   - Contains curated subset of commonly requested languages
   - Provides offline functionality and fast search
   - Based on real Ethnologue data structure

2. **SIL API Integration** (Optional)
   - Direct connection to Ethnologue API when available
   - Requires valid API credentials from SIL International
   - Provides access to complete, up-to-date language database

3. **Fallback System**
   - Graceful degradation when API is unavailable
   - Local data ensures system continues to function
   - User experience remains consistent

### Data Structure

Each language entry contains:

```typescript
interface LanguageData {
  id: string                    // Unique identifier (usually ISO 639-3)
  name: string                 // English language name
  autonym?: string             // Native language name
  ethnologue_code: string      // SIL Ethnologue code (ISO 639-3)
  iso_639_3?: string          // ISO 639-3 standard code
  country_primary: string      // Primary country of usage
  countries: string[]          // All countries where spoken
  region?: string              // Geographic region
  family?: string              // Language family classification
  speakers?: number            // Total speaker population
  status?: LanguageStatus      // Vitality status
  dialects?: string[]          // Known dialect variants
  alternate_names?: string[]   // Alternative names
}
```

## Setup Instructions

### 1. Basic Setup (Local Data Only)

The system works immediately with the included language data:

```bash
# Language data is already included in the repository
# No additional setup required for basic functionality
```

### 2. SIL API Integration (Recommended for Production)

To enable full SIL Ethnologue integration:

1. **Obtain API Credentials**:
   - Contact SIL International (https://www.sil.org)
   - Request Ethnologue API access for translation projects
   - Provide details about your organization and use case

2. **Configure Environment Variables**:
   ```bash
   # Add to your .env.local file
   NEXT_PUBLIC_SIL_API_URL=https://www.ethnologue.com/api
   NEXT_PUBLIC_SIL_API_KEY=your_api_key_here
   ```

3. **Verify Integration**:
   ```bash
   # Test API connection
   npm run test:sil-integration
   ```

### 3. Data Updates

#### Automatic Updates (API Mode)
- Language data syncs automatically when API is available
- Cache refreshes every 24 hours
- Real-time search queries API directly

#### Manual Updates (Local Mode)
1. Download latest language data from SIL
2. Update `/public/data/languages.json`
3. Follow the existing data structure format
4. Test language search functionality

## Usage in Components

### Language Selector Component

The `LanguageSelector` component provides a user-friendly interface for language selection:

```tsx
import LanguageSelector, { LanguageData } from '@/components/language-selector'

function MyComponent() {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageData | null>(null)

  return (
    <LanguageSelector
      value={selectedLanguage}
      onChange={setSelectedLanguage}
      placeholder="Search for a language..."
    />
  )
}
```

### Language Service API

The service provides programmatic access to language data:

```tsx
import { languageService, searchLanguages, getLanguageByCode } from '@/services/language-service'

// Search for languages
const languages = await searchLanguages('Spanish', 10)

// Get specific language by code
const language = await getLanguageByCode('spa')

// Validate user input
const validated = await languageService.validateLanguage('English')
```

## Benefits for Translation Organizations

### 1. Data Accuracy
- **Authoritative Source**: SIL Ethnologue is maintained by professional linguists
- **Regular Updates**: Language situations change; data stays current
- **Comprehensive Coverage**: Includes minority and endangered languages

### 2. Standardization
- **ISO 639-3 Codes**: International standard for language identification
- **Consistent Naming**: Eliminates ambiguity in language references
- **Geographic Precision**: Accurate country and region mapping

### 3. Translation Planning
- **Speaker Populations**: Helps prioritize translation projects
- **Language Vitality**: Identifies urgent vs. stable languages
- **Dialect Information**: Supports decisions about variant translations

### 4. Reporting Compliance
- **Donor Requirements**: Many funders require standardized language codes
- **Audit Trail**: Clear documentation of language identification
- **Regional Analysis**: Support for geographic reporting requirements

## Maintenance and Support

### Regular Maintenance
- Monitor API usage and quotas
- Update local language data quarterly
- Review new language additions from SIL
- Test integration after system updates

### Troubleshooting

**Common Issues**:

1. **API Connection Failures**
   - Check API key validity
   - Verify network connectivity
   - Review rate limiting policies

2. **Search Performance**
   - Consider caching strategies for large datasets
   - Implement search result pagination
   - Monitor query response times

3. **Data Inconsistencies**
   - Compare local vs. API data
   - Check for encoding issues with non-Latin scripts
   - Validate country name mappings

### Support Resources

- **SIL International**: https://www.sil.org/contact
- **Ethnologue Support**: https://www.ethnologue.com/help
- **API Documentation**: Available with SIL API credentials
- **Technical Issues**: Contact your development team

## Data Privacy and Compliance

### Usage Rights
- Language data from SIL Ethnologue is used under appropriate licensing
- API access requires compliance with SIL's terms of service
- Commercial use may require special licensing arrangements

### Data Protection
- No personal information is stored in language data
- API keys are stored securely in environment variables
- Local language data is publicly available information

## Future Enhancements

### Planned Features
1. **Multi-language Interface**: Support for non-English language names
2. **Advanced Filtering**: Filter by region, family, or speaker count
3. **Bulk Import**: Support for importing language lists from CSV
4. **Offline Sync**: Better offline capability with periodic syncing
5. **Custom Fields**: Organization-specific language metadata

### Integration Opportunities
1. **Translation Memory Systems**: Link to existing translation assets
2. **Project Management**: Integration with project planning tools
3. **Resource Databases**: Connect to Scripture and literature databases
4. **Geographic Information Systems**: Map-based language selection

## Conclusion

The SIL Ethnologue integration provides ETEN Reporting with authoritative, comprehensive language data that enhances the accuracy and reliability of translation investment reporting. This foundation supports better decision-making, improved compliance, and more effective translation planning for organizations worldwide.

For questions about implementing or extending this integration, consult the development team or contact SIL International directly.