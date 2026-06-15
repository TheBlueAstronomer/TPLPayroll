export function normalizeEmployeeId(employeeId: string): string {
  const trimmed = employeeId.trim()
  const match = trimmed.match(/^([A-Z]+)(\d{6})$/)
  if (match) {
    const prefix = match[1]
    const lastThreeDigits = match[2].slice(-3)
    return `${prefix}${lastThreeDigits}`
  }
  return trimmed
}
