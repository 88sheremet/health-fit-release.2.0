
import fs from 'node:fs'
import path from 'node:path'

const localeDir = path.resolve('i18n/locales')
const localeFiles = {
  ru: path.join(localeDir, 'ru.json'),
  uk: path.join(localeDir, 'uk.json')
}

const errors = []

function fail(message) {
  errors.push(message)
}

function loadLocale(locale, file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    fail(`${locale}: invalid JSON - ${error.message}`)
    return null
  }
}

function flatten(value, prefix = '', result = {}) {
  for (const [key, item] of Object.entries(value)) {
    const current = prefix ? `${prefix}.${key}` : key

    if (
      item !== null &&
      typeof item === 'object' &&
      !Array.isArray(item)
    ) {
      flatten(item, current, result)
    } else {
      result[current] = item
    }
  }

  return result
}

function extractPlaceholders(value) {
  return [...value.matchAll(/(?<!\{)\{([a-zA-Z_$][\w$.-]*)\}(?!\})/g)]
    .map(match => match[1])
    .sort()
}

function extractHtmlTags(value) {
  return [...value.matchAll(/<\/?([a-zA-Z][\w:-]*)\b[^>]*>/g)]
    .map(match => match[0].replace(/\s+/g, ' ').trim())
    .sort()
}

function extractIcu(value) {
  return [...value.matchAll(/\{[^{}]*,\s*(plural|select|selectordinal)\s*,/g)]
    .map(match => match[0].replace(/\s+/g, ' ').trim())
    .sort()
}

function compareStructure(ru, uk) {
  const ruKeys = Object.keys(ru).sort()
  const ukKeys = Object.keys(uk).sort()

  const missingInUk = ruKeys.filter(key => !ukKeys.includes(key))
  const missingInRu = ukKeys.filter(key => !ruKeys.includes(key))

  for (const key of missingInUk) {
    fail(`Missing in UK: ${key}`)
  }

  for (const key of missingInRu) {
    fail(`Missing in RU: ${key}`)
  }

  if (missingInUk.length === 0 && missingInRu.length === 0) {
    console.log(`Key synchronization: Passed (${ruKeys.length} keys)`)
  }
}

function compareTechnicalIntegrity(ru, uk) {
  for (const key of Object.keys(ru)) {
    if (!(key in uk)) continue

    const ruValue = ru[key]
    const ukValue = uk[key]

    if (typeof ruValue !== 'string' || typeof ukValue !== 'string') {
      continue
    }

    const checks = [
      ['placeholders', extractPlaceholders],
      ['HTML tags', extractHtmlTags],
      ['ICU constructions', extractIcu]
    ]

    for (const [name, extractor] of checks) {
      const ruParts = extractor(ruValue)
      const ukParts = extractor(ukValue)

      if (JSON.stringify(ruParts) !== JSON.stringify(ukParts)) {
        fail(`${name} mismatch: ${key}`)
      }
    }
  }
}

function validateDailyReward(ru, uk) {
  const key = 'daily.reward'
  const ruValue = ru[key]
  const ukValue = uk[key]

  if (typeof ruValue !== 'string' || typeof ukValue !== 'string') {
    fail(`${key}: expected strings in both locales`)
    return
  }

  const ruVariants = ruValue.split('|').map(value => value.trim())
  const ukVariants = ukValue.split('|').map(value => value.trim())

  if (ruVariants.length !== 3 || ukVariants.length !== 3) {
    fail(`${key}: expected exactly 3 pluralization variants`)
    return
  }

  for (const variant of [...ruVariants, ...ukVariants]) {
    if (JSON.stringify(extractPlaceholders(variant)) !== JSON.stringify(['n'])) {
      fail(`${key}: invalid placeholder in pluralization variant`)
      return
    }
  }

  console.log('Pluralization structure: Passed (3 variants, no runtime check)')
}

console.log('=== Health Fit Localization Validation ===')

const ruData = loadLocale('RU', localeFiles.ru)
const ukData = loadLocale('UK', localeFiles.uk)

if (!ruData || !ukData) {
  console.error('\nJSON validation: Failed')
  process.exitCode = 1
} else {
  console.log('JSON validation: Passed')

  const ru = flatten(ruData)
  const uk = flatten(ukData)

  compareStructure(ru, uk)
  compareTechnicalIntegrity(ru, uk)
  validateDailyReward(ru, uk)

  if (errors.length === 0) {
    console.log('Technical integrity: Passed')
    console.log('\nFinal Status: Successful')
  } else {
    console.error('\nValidation errors:')

    for (const error of errors) {
      console.error(`- ${error}`)
    }

    console.error('\nFinal Status: Failed')
    process.exitCode = 1
  }
}
