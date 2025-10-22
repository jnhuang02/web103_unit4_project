export const formatPrice = (value) => {
  const n = Number(value || 0)
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}
