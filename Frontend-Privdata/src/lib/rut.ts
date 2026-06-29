export function formatRut(value: string): string {
  const clean = value.replace(/[^0-9kK]/g, "").toUpperCase()
  if (clean.length <= 1) return clean
  const body = clean.slice(0, -1)
  const dv   = clean.slice(-1)
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${formatted}-${dv}`
}

export function validateRut(rut: string): boolean {
  const clean = rut.replace(/\./g, "").replace("-", "").toLowerCase()
  if (clean.length < 2) return false
  const body = clean.slice(0, -1)
  const dv   = clean.slice(-1)
  if (!/^\d+$/.test(body)) return false
  let sum = 0
  let mul = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * mul
    mul = mul === 7 ? 2 : mul + 1
  }
  const rem = 11 - (sum % 11)
  const expected = rem === 11 ? "0" : rem === 10 ? "k" : rem.toString()
  return dv === expected
}
