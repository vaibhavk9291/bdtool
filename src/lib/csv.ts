export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return ''
    let s = String(v)
    
    // Protection against CSV injection attacks
    const FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r']
    if (FORMULA_PREFIXES.includes(s.charAt(0))) {
      s = "'" + s
    }
    
    // Quote if contains comma, quote, newline, or CR; double up quotes inside
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  
  const lines = [headers.map(escape).join(',')]
  for (const row of rows) {
    lines.push(row.map(escape).join(','))
  }
  
  // Prepend UTF-8 BOM so Excel opens it correctly with non-ASCII characters
  return '\uFEFF' + lines.join('\r\n')
}
