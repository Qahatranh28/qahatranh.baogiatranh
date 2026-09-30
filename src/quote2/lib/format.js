// Định dạng số/tiền/ngày dùng cho trang báo giá mới.

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })
export const fmtNum = (v) => nf.format(Math.round(Number(v) || 0))
export const fmtMoney = (v) => `${fmtNum(v)} đ`
export const fmtPct = (v, digits = 2) =>
  `${new Intl.NumberFormat('vi-VN', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(v) || 0)}%`

export const fmtDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

// "1.234.567" -> 1234567 ; ô nhập tiền chỉ giữ chữ số
export const parseMoney = (s) => Number(String(s ?? '').replace(/[^\d]/g, '')) || 0

export const monthKey = (iso) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
export const monthLabel = (key) => {
  if (key === 'all') return 'Tất cả các tháng'
  const [y, m] = key.split('-')
  return `Tháng ${Number(m)}/${y}`
}

export const initials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Đọc số tiền thành chữ tiếng Việt: 1.500.000 -> "Một triệu năm trăm nghìn đồng"
const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']
function readTriple(n, full) {
  const tram = Math.floor(n / 100)
  const chuc = Math.floor((n % 100) / 10)
  const donvi = n % 10
  const out = []
  if (full || tram > 0) out.push(`${DIGITS[tram]} trăm`)
  if (chuc > 1) {
    out.push(`${DIGITS[chuc]} mươi`)
    if (donvi === 1) out.push('mốt')
    else if (donvi === 5) out.push('lăm')
    else if (donvi > 0) out.push(DIGITS[donvi])
  } else if (chuc === 1) {
    out.push('mười')
    if (donvi === 5) out.push('lăm')
    else if (donvi > 0) out.push(DIGITS[donvi])
  } else if (donvi > 0) {
    if (full || tram > 0) out.push('lẻ')
    out.push(DIGITS[donvi])
  }
  return out.join(' ')
}
export function moneyToWords(value) {
  let n = Math.round(Number(value) || 0)
  if (n <= 0) return 'Không đồng'
  const units = ['', ' nghìn', ' triệu', ' tỷ']
  const groups = []
  while (n > 0) {
    groups.push(n % 1000)
    n = Math.floor(n / 1000)
  }
  const parts = []
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0) continue
    const full = i < groups.length - 1 // nhóm không phải nhóm đầu thì đọc đủ "không trăm"
    parts.push(readTriple(groups[i], full) + (units[i] ?? ''))
  }
  const s = parts.join(' ').replace(/\s+/g, ' ').trim()
  return s.charAt(0).toUpperCase() + s.slice(1) + ' đồng'
}
