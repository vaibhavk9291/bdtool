import { env } from './env'

export type ContactKind = 'phone' | 'email' | 'unknown'

export type ParsedContact =
  | { kind: 'phone'; raw: string; e164: string; display: string; href: string }
  | { kind: 'email'; raw: string; address: string; href: string }
  | { kind: 'unknown'; raw: string }

export function parseContact(raw: string): ParsedContact {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (emailRegex.test(raw.trim())) {
    const address = raw.trim()
    return {
      kind: 'email',
      raw,
      address,
      href: `mailto:${address}`
    }
  }

  // Strip all non-digits and non-+
  let digits = raw.replace(/[^\d+]/g, '')
  
  // Replace 00 with + at the start
  if (digits.startsWith('00')) {
    digits = '+' + digits.slice(2)
  }

  // Count purely the numerical digits
  const pureDigits = digits.replace(/\D/g, '')

  if (pureDigits.length >= 7) {
    const defaultCountryCode = env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE || '+91'
    let e164 = digits

    // If it's a 10 digit number without +, assume default country code
    if (pureDigits.length === 10 && !digits.startsWith('+')) {
      e164 = defaultCountryCode + pureDigits
    } else if (!digits.startsWith('+')) {
      e164 = '+' + digits
    }

    // Basic readable grouping (e.g. +91 98765 43210 or +1 415 555 2671)
    let display = e164
    if (e164.startsWith('+91') && e164.length === 13) {
      display = `${e164.slice(0, 3)} ${e164.slice(3, 8)} ${e164.slice(8)}`
    } else {
      // generic 3-4-4 fallback
      if (e164.length > 7) {
        display = e164.replace(/(\+\d{1,3})(\d{3})(\d{3,4})(\d{0,4})/, '$1 $2 $3 $4').trim()
      }
    }

    return {
      kind: 'phone',
      raw,
      e164,
      display,
      href: `tel:${e164}`
    }
  }

  return {
    kind: 'unknown',
    raw
  }
}
